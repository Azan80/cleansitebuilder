'use server'

import { createClient } from '@/utils/supabase/server'
import JSZip from 'jszip'
import { canUserAddCustomDomain } from './subscription-actions'

const NETLIFY_ACCESS_TOKEN = process.env.NETLIFY_ACCESS_TOKEN

export type DeployResult = {
  success: boolean
  url?: string
  error?: string
}

export async function deployToNetlify(projectId: string): Promise<DeployResult> {
  if (!NETLIFY_ACCESS_TOKEN) {
    return { success: false, error: 'Missing NETLIFY_ACCESS_TOKEN environment variable' }
  }

  const supabase = await createClient()
  
  // 1. Get project data
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (projectError || !project) {
    return { success: false, error: 'Project not found' }
  }

  try {
    const files = JSON.parse(project.code_content || '{}')
    
    // Ensure we have index.html
    if (!files['index.html']) {
      return { success: false, error: 'No index.html found to deploy' }
    }

    // 2. Create ZIP file
    const zip = new JSZip()
    
    // Add all generated files to the zip
    Object.entries(files).forEach(([filename, content]) => {
      // Skip internal keys if any
      if (!filename.startsWith('_')) {
        zip.file(filename, content as string)
      }
    })
    
    // Force Content-Type for index.html using _headers file to prevent text/plain serving
    zip.file('_headers', '/*\n  Content-Type: text/html')
    
    // Explicitly set publish directory
    zip.file('netlify.toml', '[build]\n  publish = "."')
    
    // Generate node buffer
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' })

    // 3. Deploy to Netlify
    let response
    let siteId
    let deployUrl

    if (project.netlify_site_id) {
      // Redeploy to existing site
      response = await fetch(`https://api.netlify.com/api/v1/sites/${project.netlify_site_id}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}`,
          'Content-Type': 'application/zip'
        },
        body: zipContent as any
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        console.error('Netlify Redeployment Error:', data)
        return { success: false, error: data.message || 'Redeployment failed' }
      }
      
      siteId = project.netlify_site_id
      deployUrl = project.deployment_url // Keep existing URL (or custom domain if set)
    } else {
      // Create NEW site
      response = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}`,
          'Content-Type': 'application/zip'
        },
        body: zipContent as any
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Netlify Deployment Error:', data)
        return { success: false, error: data.message || 'Deployment failed' }
      }
      
      siteId = data.id
      deployUrl = data.ssl_url || data.url
    }

    // 5. Save deployment info to database
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        deployment_url: deployUrl,
        netlify_site_id: siteId,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('Failed to save deployment info:', updateError)
    }

    return { 
      success: true, 
      url: deployUrl 
    }

  } catch (error: any) {
    console.error('Deployment error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateProjectDomain(projectId: string, domain: string) {
  if (!NETLIFY_ACCESS_TOKEN) return { error: 'Missing token' }
  
  const supabase = await createClient()
  
  // Check if user can add custom domain (subscription limits)
  const canAddDomain = await canUserAddCustomDomain();
  if (!canAddDomain.allowed) {
    return { 
      error: canAddDomain.reason || 'Custom domain limit reached',
      limitReached: true,
      limits: canAddDomain.limits
    }
  }
  
  // Get project to find site_id
  const { data: project } = await supabase
    .from('projects')
    .select('netlify_site_id, custom_domain, user_id')
    .eq('id', projectId)
    .single()
    
  if (!project?.netlify_site_id) return { error: 'Project not deployed yet' }
  
  // Normalize domain (remove http/https, trailing slashes)
  const normalizedDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '').trim()
  
  // Check if this domain is already used by another project in our database
  const { data: existingDomainProject, error: domainCheckError } = await supabase
    .from('projects')
    .select('id, name, user_id')
    .eq('custom_domain', normalizedDomain)
    .neq('id', projectId) // Exclude current project
    .single()
  
  if (existingDomainProject) {
    if (existingDomainProject.user_id === project.user_id) {
      return { 
        error: `This domain is already connected to your project "${existingDomainProject.name}". Please remove it from that project first.`,
        domainInUse: true
      }
    } else {
      return { 
        error: 'This domain is already in use by another site. Please use a different domain.',
        domainInUse: true
      }
    }
  }

  try {
    // Update site with custom domain
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${project.netlify_site_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        custom_domain: normalizedDomain
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      // Handle specific Netlify errors
      const errorMessage = data.message || data.error || 'Failed to update domain'
      
      // Check for domain already taken by another Netlify site
      if (errorMessage.toLowerCase().includes('domain') && 
          (errorMessage.toLowerCase().includes('taken') || 
           errorMessage.toLowerCase().includes('use') ||
           errorMessage.toLowerCase().includes('already') ||
           errorMessage.toLowerCase().includes('registered'))) {
        return { 
          error: 'This domain is already registered on Netlify with another site. If you own this domain, you may need to remove it from the other site first or contact Netlify support.',
          domainInUse: true
        }
      }
      
      return { error: errorMessage }
    }

    // Update DB
    await supabase
      .from('projects')
      .update({ 
        custom_domain: normalizedDomain,
        deployment_url: `https://${normalizedDomain}`
      })
      .eq('id', projectId)

    // Get the default Netlify subdomain for DNS instructions
    const siteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${project.netlify_site_id}`, {
      headers: { 'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}` }
    })
    const siteData = await siteResponse.json()
    const cnameTarget = siteData.default_domain

    return { success: true, url: `https://${normalizedDomain}`, cnameTarget }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function getDomainStatus(projectId: string) {
  if (!NETLIFY_ACCESS_TOKEN) return { error: 'Missing token' }
  
  const supabase = await createClient()
  
  const { data: project } = await supabase
    .from('projects')
    .select('netlify_site_id, custom_domain')
    .eq('id', projectId)
    .single()
    
  if (!project?.netlify_site_id || !project.custom_domain) {
    return { status: 'none' }
  }

  try {
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${project.netlify_site_id}`, {
      headers: { 'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}` }
    })
    
    if (!response.ok) return { error: 'Failed to fetch status' }
    
    const data = await response.json()
    
    // Get the default Netlify subdomain for CNAME target
    const cnameTarget = data.default_domain
    
    // Check SSL status if available
    const isSslReady = data.ssl_url && data.ssl_url.includes(project.custom_domain)
    
    return {
      status: isSslReady ? 'active' : 'verifying',
      ssl: isSslReady,
      domain: project.custom_domain,
      cnameTarget: cnameTarget // Include CNAME target for DNS instructions
    }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function removeProjectDomain(projectId: string) {
  if (!NETLIFY_ACCESS_TOKEN) return { error: 'Missing token' }
  
  const supabase = await createClient()
  
  // Get project to find site_id
  const { data: project } = await supabase
    .from('projects')
    .select('netlify_site_id, custom_domain, deployment_url')
    .eq('id', projectId)
    .single()
    
  if (!project?.netlify_site_id) return { error: 'Project not deployed yet' }
  if (!project?.custom_domain) return { error: 'No custom domain to remove' }

  try {
    // Get the default Netlify subdomain first
    const siteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${project.netlify_site_id}`, {
      headers: { 'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}` }
    })
    const siteData = await siteResponse.json()
    const defaultDomain = siteData.default_domain
    const netlifyUrl = siteData.ssl_url || siteData.url || `https://${defaultDomain}`

    // Remove custom domain from Netlify
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${project.netlify_site_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        custom_domain: null
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      return { error: data.message || 'Failed to remove domain' }
    }

    // Update DB - clear custom domain and restore Netlify URL
    await supabase
      .from('projects')
      .update({ 
        custom_domain: null,
        deployment_url: netlifyUrl
      })
      .eq('id', projectId)

    return { success: true, newUrl: netlifyUrl }
  } catch (e: any) {
    return { error: e.message }
  }
}
