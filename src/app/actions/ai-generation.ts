'use server'

import { createClient } from '@/utils/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.NEXT_OPENAI_KEY || process.env.OPENAI_API_KEY,
})

export type GenerationStatus = {
  status: 'pending' | 'generating' | 'completed' | 'error'
  progress: number
  currentStep: string
  files?: Record<string, string>
  error?: string
}

// Start generation and return a job ID
export async function startWebsiteGeneration(prompt: string, projectId: string, currentCode?: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Create a generation job
    const jobId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Store initial status
    await supabase
      .from('generation_jobs')
      .insert({
        id: jobId,
        project_id: projectId,
        user_id: user.id,
        status: 'pending',
        progress: 0,
        current_step: 'Initializing...',
        prompt: prompt,
        current_code: currentCode
      })

    // Start generation in background (we'll poll for status)
    generateInBackground(jobId, prompt, projectId, currentCode, user.id)

    return { success: true, jobId }
  } catch (error: any) {
    console.error('Error starting generation:', error)
    return { error: error.message || 'Failed to start generation' }
  }
}

// Background generation function with multi-step process for high quality
async function generateInBackground(
  jobId: string,
  prompt: string,
  projectId: string,
  currentCode: string | undefined,
  userId: string
) {
  const supabase = await createClient()

  try {
    // STEP 1: Planning Phase (0-15%)
    await updateJobStatus(jobId, {
      status: 'generating',
      progress: 5,
      currentStep: 'Analyzing requirements and planning architecture...'
    })

    const planningPrompt = `You are a senior web architect. Analyze this request and create a detailed plan:

Request: "${prompt}"
${currentCode ? `\nCurrent structure: ${currentCode}` : ''}

Create a JSON plan with:
1. "pages" - List of pages needed (e.g., ["home", "about", "contact"])
2. "components" - List of reusable components (e.g., ["Header", "Footer", "Hero", "Features"])
3. "features" - Key features to implement
4. "colorScheme" - Suggested color palette
5. "layout" - Layout structure description

Return ONLY valid JSON.`

    const planResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: planningPrompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const plan = JSON.parse(planResponse.choices[0].message.content || '{}')
    console.log('Generation plan:', plan)

    await updateJobStatus(jobId, {
      progress: 15,
      currentStep: 'Plan created. Generating layout structure...'
    })

    // STEP 2: Generate Layout & Root Files (15-30%)
    const layoutPrompt = `You are an expert Next.js 14 developer. Create a professional root layout.

Project Plan: ${JSON.stringify(plan)}

Generate ONLY these files as JSON:
{
  "/app/layout.tsx": "...",
  "/app/globals.css": "..."
}

Requirements:
- Modern, professional design
- Proper TypeScript types
- Include metadata (title, description)
- Set up Tailwind CSS properly
- Use the suggested color scheme: ${plan.colorScheme || 'modern and professional'}
- Include font optimization (Inter or similar)
- Do NOT use CSS modules (*.module.css). Use Tailwind CSS only.

Return ONLY valid JSON with file paths as keys.`

    const layoutResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: layoutPrompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    let allFiles = JSON.parse(layoutResponse.choices[0].message.content || '{}')

    await updateJobStatus(jobId, {
      progress: 30,
      currentStep: 'Layout created. Building reusable components...'
    })

    // STEP 3: Generate Components (30-60%)
    const components = plan.components || ['Header', 'Footer']
    const componentProgress = 30
    const progressPerComponent = 30 / components.length

    for (let i = 0; i < components.length; i++) {
      const component = components[i]
      
      await updateJobStatus(jobId, {
        progress: Math.round(componentProgress + (i * progressPerComponent)),
        currentStep: `Creating ${component} component...`
      })

      const componentPrompt = `Create a professional, reusable ${component} component for a Next.js 14 project.

Project context: ${prompt}
Color scheme: ${plan.colorScheme || 'modern'}
Style: Professional, modern, clean

Generate as JSON:
{
  "/components/${component}.tsx": "..."
}

IMPORTANT RULES:
- File MUST be at /components/${component}.tsx
- Use TypeScript with proper types
- Use Tailwind CSS for styling
- Use lucide-react for icons (import { IconName } from 'lucide-react')
- Make it responsive (mobile-first)
- Add smooth animations with framer-motion if appropriate
- Export as: export function ${component}() { ... } or export default function ${component}() { ... }
- Do NOT import from /ui/ or other directories
- Do NOT use @/ imports
- Only import from 'react', 'lucide-react', 'framer-motion', or other /components/ files

Return ONLY valid JSON.`

      const componentResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: componentPrompt }],
        temperature: 0.8,
        response_format: { type: "json_object" }
      })

      const componentFiles = JSON.parse(componentResponse.choices[0].message.content || '{}')
      allFiles = { ...allFiles, ...componentFiles }
    }

    await updateJobStatus(jobId, {
      progress: 60,
      currentStep: 'Components ready. Building main page...'
    })

    // STEP 4: Generate Main Page (60-75%)
    const pagePrompt = `Create a stunning, professional main page that integrates all components.

Request: "${prompt}"
Available components: ${components.join(', ')}
Color scheme: ${plan.colorScheme || 'modern'}
Features to include: ${(plan.features || []).join(', ')}

Generate as JSON:
{
  "/app/page.tsx": "..."
}

Requirements:
- Import and use the components from /components/
- Create a cohesive, professional design
- Use proper TypeScript types
- Implement all requested features
- Make it responsive and mobile-friendly
- Add smooth scroll animations
- Use modern UI patterns
- Include proper spacing and typography
- Make it visually stunning

Return ONLY valid JSON.`

    const pageResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: pagePrompt }],
      temperature: 0.8,
      response_format: { type: "json_object" }
    })

    const pageFiles = JSON.parse(pageResponse.choices[0].message.content || '{}')
    allFiles = { ...allFiles, ...pageFiles }

    await updateJobStatus(jobId, {
      progress: 75,
      currentStep: 'Refining design and adding polish...'
    })

    // STEP 5: Quality Enhancement (75-90%)
    const enhancementPrompt = `Review and enhance this Next.js project for maximum quality.

Current files: ${JSON.stringify(allFiles)}

Improve:
1. Add missing TypeScript types
2. Enhance Tailwind styling for premium look
3. Add micro-interactions and animations
4. Ensure responsive design
5. Add proper accessibility attributes
6. Optimize component structure

Return the COMPLETE improved file structure as JSON with ALL files.`

    const enhancementResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: enhancementPrompt }],
      temperature: 0.6,
      response_format: { type: "json_object" }
    })

    allFiles = JSON.parse(enhancementResponse.choices[0].message.content || '{}')

    await updateJobStatus(jobId, {
      progress: 90,
      currentStep: 'Finalizing and saving...'
    })

    // Ensure required files exist
    if (!allFiles['/app/page.tsx']) {
      allFiles['/app/page.tsx'] = `export default function Page() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">Welcome</h1>
      <p className="mt-4 text-gray-600">Your professional website</p>
    </div>
  )
}`
    }

    if (!allFiles['/app/layout.tsx']) {
      allFiles['/app/layout.tsx'] = `export const metadata = {
  title: 'Professional Website',
  description: 'Built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}`
    }

    // Save to project
    const { error: saveError } = await supabase
      .from('projects')
      .update({ 
        code_content: JSON.stringify(allFiles),
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)

    if (saveError) {
      throw new Error('Failed to save project')
    }

    // Mark as completed
    await updateJobStatus(jobId, {
      status: 'completed',
      progress: 100,
      currentStep: '✨ Professional website generated!',
      files: allFiles
    })

  } catch (error: any) {
    console.error('Generation error:', error)
    await updateJobStatus(jobId, {
      status: 'error',
      currentStep: 'Error occurred',
      error: error.message || 'Generation failed'
    })
  }
}

// Get generation status
export async function getGenerationStatus(jobId: string): Promise<GenerationStatus | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }
  
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id) // Ensure user owns the job
    .single()

  if (error || !data) {
    return null
  }

  return {
    status: data.status,
    progress: data.progress,
    currentStep: data.current_step,
    files: data.files,
    error: data.error
  }
}

// Helper to update job status
async function updateJobStatus(jobId: string, updates: Partial<GenerationStatus>) {
  const supabase = await createClient()
  
  // Map camelCase to snake_case for database
  const dbUpdates: any = {}
  if (updates.status) dbUpdates.status = updates.status
  if (updates.progress !== undefined) dbUpdates.progress = updates.progress
  if (updates.currentStep) dbUpdates.current_step = updates.currentStep
  if (updates.files) dbUpdates.files = updates.files
  if (updates.error) dbUpdates.error = updates.error
  
  await supabase
    .from('generation_jobs')
    .update({
      ...dbUpdates,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId)
}
