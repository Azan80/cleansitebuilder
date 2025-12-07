'use server'

import { createClient } from '@/utils/supabase/server'
import JSZip from 'jszip'

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
  
  // Get project to find site_id
  const { data: project } = await supabase
    .from('projects')
    .select('netlify_site_id')
    .eq('id', projectId)
    .single()
    
  if (!project?.netlify_site_id) return { error: 'Project not deployed yet' }

  try {
    // Update site with custom domain
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${project.netlify_site_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        custom_domain: domain
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      return { error: data.message || 'Failed to update domain' }
    }

    // Update DB
    await supabase
      .from('projects')
      .update({ 
        custom_domain: domain,
        deployment_url: `https://${domain}` // Update URL to use custom domain
      })
      .eq('id', projectId)

    // Get the default Netlify subdomain for DNS instructions
    const siteResponse = await fetch(`https://api.netlify.com/api/v1/sites/${project.netlify_site_id}`, {
      headers: { 'Authorization': `Bearer ${NETLIFY_ACCESS_TOKEN}` }
    })
    const siteData = await siteResponse.json()
    const cnameTarget = siteData.default_domain

    return { success: true, url: `https://${domain}`, cnameTarget }
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
    
    // Check SSL status if available
    // Netlify returns ssl_url if SSL is active, or we can check processing_settings
    // A more robust check might involve fetching the domain specific endpoint if needed,
    // but usually site details contain enough info.
    
    // Simplified status logic:
    // If custom_domain matches and ssl is true -> active
    // If custom_domain matches but no ssl -> verifying
    
    const isSslReady = data.ssl_url && data.ssl_url.includes(project.custom_domain)
    
    return {
      status: isSslReady ? 'active' : 'verifying',
      ssl: isSslReady,
      domain: project.custom_domain
    }
  } catch (e: any) {
    return { error: e.message }
  }
}
