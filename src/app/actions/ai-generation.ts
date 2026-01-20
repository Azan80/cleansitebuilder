'use server'

import { createClient } from '@/utils/supabase/server';
import { after } from 'next/server';
import OpenAI from 'openai';
import { canUserGenerate, incrementGenerationCount } from './subscription-actions';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.NEXT_OPENAI_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com'
})

// Task structure for multi-step generation
export type GenerationTask = {
  id: string;
  name: string;
  type: 'plan' | 'design' | 'page' | 'finalize';
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  fileName?: string;
}

export type GenerationJob = {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  currentStep: string;
  progress: number;
  files: Record<string, string>;
  error?: string;
  tasks?: GenerationTask[];
  currentTaskIndex?: number;
  totalTasks?: number;
  designSpec?: string;
};

export async function startWebsiteGeneration(
  prompt: string,
  projectId: string,
  currentCode: string | undefined,
  history: Array<{ role: 'user' | 'ai', content: string }> = []
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Check if user can generate (subscription limits)
  const canGenerate = await canUserGenerate();
  if (!canGenerate.allowed) {
    return {
      success: false,
      error: canGenerate.reason || 'Generation limit reached',
      limitReached: true,
      limits: canGenerate.limits
    }
  }

  // 1. Save User Message to DB
  await supabase.from('messages').insert({
    project_id: projectId,
    role: 'user',
    content: prompt
  })

  const jobId = crypto.randomUUID()

  // 2. Create initial job status in DB
  const { error } = await supabase
    .from('generation_jobs')
    .insert({
      id: jobId,
      project_id: projectId,
      user_id: user.id,
      status: 'pending',
      current_step: 'Analyzing your request...',
      progress: 0,
      files: {},
      tasks: [],
      current_task_index: 0,
      total_tasks: 0
    })

  if (error) {
    console.error('Failed to create job:', error)
    return { success: false, error: error.message }
  }

  // Start background generation (fire and forget, safe with after)
  after(() => {
    generateInBackground(jobId, prompt, projectId, currentCode, user.id, history).catch(console.error)
  })

  return { success: true, jobId }
}

async function generateInBackground(
  jobId: string,
  prompt: string,
  projectId: string,
  currentCode: string | undefined,
  userId: string,
  history: Array<{ role: 'user' | 'ai', content: string }>
) {
  const supabase = await createClient()

  const updateStatus = async (status: Partial<GenerationJob> & { tasks?: GenerationTask[], currentTaskIndex?: number, totalTasks?: number }) => {
    const dbUpdates: any = { updated_at: new Date().toISOString() }
    if (status.status) dbUpdates.status = status.status
    if (status.currentStep) dbUpdates.current_step = status.currentStep
    if (status.progress !== undefined) dbUpdates.progress = status.progress
    if (status.files) dbUpdates.files = status.files
    if (status.error) dbUpdates.error = status.error
    if (status.tasks) dbUpdates.tasks = status.tasks
    if (status.currentTaskIndex !== undefined) dbUpdates.current_task_index = status.currentTaskIndex
    if (status.totalTasks !== undefined) dbUpdates.total_tasks = status.totalTasks

    await supabase
      .from('generation_jobs')
      .update(dbUpdates)
      .eq('id', jobId)
  }

  try {
    // Parse existing files
    let existingFiles: Record<string, string> = {}
    let isModification = false

    if (currentCode) {
      try {
        existingFiles = JSON.parse(currentCode)
        const hasRealContent = Object.keys(existingFiles).some(key =>
          key !== '_reasoning' && existingFiles[key] && existingFiles[key].length > 100
        )
        isModification = hasRealContent
      } catch (e) {
        existingFiles = {}
      }
    }

    // Check for quick edit (simple text replacement) - FAST PATH
    if (isModification) {
      const quickEdit = detectQuickEdit(prompt)
      if (quickEdit) {
        console.log('[QUICK-EDIT] Detected quick edit:', quickEdit)
        await performQuickEdit(jobId, quickEdit, existingFiles, userId, projectId, updateStatus, supabase)
        return
      }
    }

    // For new websites: always use agent workflow
    // For modifications: use simple generation
    if (!isModification) {
      // Use multi-step agent workflow for all new projects
      await generateWithAgentWorkflow(jobId, prompt, existingFiles, userId, projectId, updateStatus, supabase)
    } else {
      // Use simple single-step generation for modifications
      await generateSimple(jobId, prompt, existingFiles, isModification, userId, projectId, updateStatus, supabase, history)
    }

  } catch (error: any) {
    console.error('Generation Error:', error)

    await supabase.from('messages').insert({
      project_id: projectId,
      role: 'ai',
      content: `Sorry, I encountered an error: ${error.message}. Please try again with a simpler request.`
    })

    await updateStatus({
      status: 'error',
      error: error.message || 'Unknown error occurred',
      progress: 0,
      currentStep: 'Error'
    })
  }
}

// Detect quick edits (simple text replacements that don't need AI)
type QuickEdit = { type: 'replace', oldText: string, newText: string } | null

function detectQuickEdit(prompt: string): QuickEdit {
  // Patterns for simple text replacement - ordered from most specific to least
  const patterns = [
    // "change website name from ELEVATE to AliCollections" -> captures ELEVATE, AliCollections
    /(?:change|rename|replace)\s+(?:the\s+)?(?:website\s+)?(?:site\s+)?(?:name\s+)?from\s+["']?(\S+)["']?\s+to\s+["']?(\S+)["']?/i,

    // "change 'ELEVATE' to 'AliCollections'" -> with quotes
    /(?:change|rename|replace)\s+["']([^"']+)["']\s+(?:to|with)\s+["']([^"']+)["']/i,

    // "replace ELEVATE with AliCollections" -> simple replace X with Y
    /replace\s+["']?(\S+)["']?\s+with\s+["']?(\S+)["']?/i,

    // "ELEVATE to AliCollections" -> very simple X to Y
    /^["']?(\S+)["']?\s+to\s+["']?(\S+)["']?$/i,

    // "rename ELEVATE to AliCollections" -> rename X to Y
    /rename\s+["']?(\S+)["']?\s+to\s+["']?(\S+)["']?/i,
  ]

  for (const pattern of patterns) {
    const match = prompt.match(pattern)
    if (match && match[1] && match[2]) {
      const oldText = match[1].trim().replace(/["']/g, '')
      const newText = match[2].trim().replace(/["']/g, '')

      // Only use quick edit for short text (likely names, not full paragraphs)
      // And ensure we actually found something meaningful
      if (oldText.length > 0 && oldText.length < 50 && newText.length > 0 && newText.length < 50) {
        console.log(`[QUICK-EDIT] Pattern matched: "${oldText}" -> "${newText}"`)
        return { type: 'replace', oldText, newText }
      }
    }
  }

  return null
}

// Perform quick edit - instant find/replace without AI
async function performQuickEdit(
  jobId: string,
  quickEdit: QuickEdit,
  existingFiles: Record<string, string>,
  userId: string,
  projectId: string,
  updateStatus: Function,
  supabase: any
) {
  if (!quickEdit || quickEdit.type !== 'replace') return

  await updateStatus({
    status: 'processing',
    progress: 30,
    currentStep: `🔄 Replacing "${quickEdit.oldText}" with "${quickEdit.newText}"...`
  })

  const { oldText, newText } = quickEdit
  const updatedFiles: Record<string, string> = {}
  let replacementCount = 0
  let filesUpdated = 0

  // Perform case-insensitive replacement across all files
  for (const [filename, content] of Object.entries(existingFiles)) {
    if (filename === '_reasoning') continue

    // Create a regex for case-insensitive replacement but preserve case
    const regex = new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const matches = content.match(regex)

    if (matches && matches.length > 0) {
      // Replace all occurrences
      updatedFiles[filename] = content.replace(regex, newText)
      replacementCount += matches.length
      filesUpdated++
    } else {
      updatedFiles[filename] = content
    }
  }

  await updateStatus({
    progress: 70,
    currentStep: `✅ Replaced ${replacementCount} occurrences in ${filesUpdated} files`
  })

  // Save to database
  await supabase
    .from('projects')
    .update({
      code_content: JSON.stringify(updatedFiles),
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .eq('user_id', userId)

  // Save success message
  await supabase.from('messages').insert({
    project_id: projectId,
    role: 'ai',
    content: `✅ Quick edit complete! Replaced "${oldText}" with "${newText}" in ${filesUpdated} file(s) (${replacementCount} occurrences).`
  })

  await updateStatus({
    status: 'completed',
    files: updatedFiles,
    progress: 100,
    currentStep: '✅ Done!'
  })

  console.log(`[QUICK-EDIT] Completed: ${replacementCount} replacements in ${filesUpdated} files`)
}

// Detect if prompt is asking for multiple pages
function detectMultiPageRequest(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase()
  const multiPageIndicators = [
    'multi-page', 'multiple pages', 'several pages',
    'pages:', 'include pages',
    'home, ', 'home page,',
    'about, contact', 'pricing, ',
    'blog, ', 'docs, ', 'documentation',
    '5 pages', '10 pages', 'many pages',
    'complete website', 'full website',
    'technology, innovations', 'partners, '
  ]
  return multiPageIndicators.some(indicator => lowerPrompt.includes(indicator))
}

// Extract page names from prompt - uses AI to determine pages
async function extractPageNamesWithAI(prompt: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a website planning assistant. Based on the user's website description, determine what pages should be created.

Return ONLY a JSON array of page names, like: ["home", "about", "contact", "pricing"]

Rules:
- Always include "home" as the first page
- Analyze what the website is about and suggest appropriate pages
- For tech/SaaS: consider technology, features, pricing, docs, blog
- For agencies: consider services, portfolio, team, contact
- For e-commerce: consider products, categories, cart, checkout
- For portfolios: consider work, projects, resume, contact
- Maximum 8-10 pages for complex requests
- Use lowercase, single-word page names (use hyphens for multi-word)

Return ONLY the JSON array, nothing else.`
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.5
    })

    const content = response.choices[0]?.message?.content || ''

    // Try to parse JSON array
    const match = content.match(/\[[\s\S]*\]/)
    if (match) {
      const pages = JSON.parse(match[0]) as string[]
      if (Array.isArray(pages) && pages.length > 0) {
        // Ensure 'home' is first
        const normalized = pages.map(p => p.toLowerCase().replace(/\s+/g, '-'))
        if (!normalized.includes('home')) {
          normalized.unshift('home')
        } else {
          // Move 'home' to front if it exists
          const homeIndex = normalized.indexOf('home')
          if (homeIndex > 0) {
            normalized.splice(homeIndex, 1)
            normalized.unshift('home')
          }
        }
        return normalized.slice(0, 10) // Max 10 pages
      }
    }
  } catch (error) {
    console.error('Error extracting pages with AI:', error)
  }

  // Fallback to keyword matching
  return extractPageNamesFallback(prompt)
}

// Fallback: Extract page names using keyword matching
function extractPageNamesFallback(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase()

  // Try pattern matching first
  const patterns = [
    /pages?:\s*([^.]+)/i,
    /include\s+pages?:\s*([^.]+)/i,
    /with\s+(?:pages?|sections?)(?:\s+like)?:\s*([^.]+)/i,
  ]

  for (const pattern of patterns) {
    const match = prompt.match(pattern)
    if (match) {
      const pages = match[1].split(/[,\s]+and\s+|,\s*/).map(p => p.trim()).filter(p => p.length > 0)
      if (pages.length > 1) {
        return pages.map(p => p.replace(/\s+/g, '-').toLowerCase())
      }
    }
  }

  // Keyword-based detection
  const defaultPages = ['home']
  if (lowerPrompt.includes('about')) defaultPages.push('about')
  if (lowerPrompt.includes('contact')) defaultPages.push('contact')
  if (lowerPrompt.includes('pricing')) defaultPages.push('pricing')
  if (lowerPrompt.includes('blog')) defaultPages.push('blog')
  if (lowerPrompt.includes('technology')) defaultPages.push('technology')
  if (lowerPrompt.includes('feature')) defaultPages.push('features')
  if (lowerPrompt.includes('team')) defaultPages.push('team')
  if (lowerPrompt.includes('service')) defaultPages.push('services')
  if (lowerPrompt.includes('portfolio')) defaultPages.push('portfolio')
  if (lowerPrompt.includes('doc')) defaultPages.push('docs')

  return defaultPages.length > 1 ? defaultPages : ['home']
}

// Multi-step agent workflow for complex projects
async function generateWithAgentWorkflow(
  jobId: string,
  prompt: string,
  existingFiles: Record<string, string>,
  userId: string,
  projectId: string,
  updateStatus: Function,
  supabase: any
) {
  // Step 1: Analyze and plan - Use AI to determine pages
  await updateStatus({
    status: 'processing',
    progress: 5,
    currentStep: '🔍 Analyzing your request...'
  })

  const pageNames = await extractPageNamesWithAI(prompt)

  // Create task list
  const tasks: GenerationTask[] = [
    { id: 'plan', name: 'Create project plan', type: 'plan', status: 'pending' },
    { id: 'design', name: 'Define design system', type: 'design', status: 'pending' },
    ...pageNames.map((page: string, i: number) => ({
      id: `page-${i}`,
      name: `Create ${page === 'home' ? 'index.html' : page + '.html'}`,
      type: 'page' as const,
      status: 'pending' as const,
      fileName: page === 'home' ? 'index.html' : `${page}.html`
    })),
    { id: 'finalize', name: 'Finalize & optimize', type: 'finalize', status: 'pending' }
  ]

  await updateStatus({
    tasks,
    totalTasks: tasks.length,
    currentTaskIndex: 0,
    progress: 10,
    currentStep: `📋 Planning ${tasks.length} tasks...`
  })

  // Step 2: Generate design specification
  tasks[0].status = 'in_progress'
  await updateStatus({ tasks, currentTaskIndex: 0, currentStep: '📋 Creating project plan...' })

  const designSpec = await generateDesignSpec(prompt)

  tasks[0].status = 'completed'
  tasks[1].status = 'in_progress'
  await updateStatus({
    tasks,
    currentTaskIndex: 1,
    progress: 15,
    currentStep: '🎨 Defining design system...'
  })

  // Short delay to show progress
  await new Promise(r => setTimeout(r, 500))
  tasks[1].status = 'completed'

  // Step 3: Generate pages in parallel batches
  const generatedFiles: Record<string, string> = {}
  const pageCount = pageNames.length
  const BATCH_SIZE = 4 // Generate 4 pages at a time

  for (let i = 0; i < pageNames.length; i += BATCH_SIZE) {
    const batch = pageNames.slice(i, i + BATCH_SIZE)

    // Mark batch as in progress
    batch.forEach((_, idx) => {
      const taskIndex = i + idx + 2
      if (tasks[taskIndex]) tasks[taskIndex].status = 'in_progress'
    })

    await updateStatus({
      tasks,
      currentStep: `📄 Generating pages ${i + 1}-${Math.min(i + BATCH_SIZE, pageCount)} of ${pageCount}...`
    })

    const batchPromises = batch.map(async (pageName, batchIdx) => {
      const globalIdx = i + batchIdx
      const fileName = pageName === 'home' ? 'index.html' : `${pageName}.html`
      const taskIndex = globalIdx + 2

      try {
        const pageHtml = await generateSinglePage(
          prompt,
          designSpec,
          pageName,
          fileName,
          pageNames,
          generatedFiles['index.html'] // Pass index.html for style reference (might be undefined for first batch, which is fine)
        )

        generatedFiles[fileName] = pageHtml
        if (tasks[taskIndex]) tasks[taskIndex].status = 'completed'
      } catch (error: any) {
        console.error(`Error generating ${fileName}:`, error)
        if (tasks[taskIndex]) tasks[taskIndex].status = 'error'
      }
    })

    await Promise.all(batchPromises)

    // Update progress after batch
    const progressPercent = 20 + Math.floor((Math.min(i + BATCH_SIZE, pageCount) / pageCount) * 60)
    await updateStatus({
      tasks,
      files: { ...generatedFiles, '_reasoning': designSpec },
      progress: progressPercent
    })
  }

  // Step 4: Finaliz
  const finalTaskIndex = tasks.length - 1
  tasks[finalTaskIndex].status = 'in_progress'
  await updateStatus({
    tasks,
    currentTaskIndex: finalTaskIndex,
    progress: 90,
    currentStep: '✨ Finalizing website...'
  })

  // Post-process all files
  Object.keys(generatedFiles).forEach(key => {
    if (typeof generatedFiles[key] === 'string') {
      generatedFiles[key] = postProcessHtml(generatedFiles[key])
    }
  })

  tasks[finalTaskIndex].status = 'completed'

  // Save to project
  await supabase
    .from('projects')
    .update({
      code_content: JSON.stringify(generatedFiles),
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .eq('user_id', userId)

  // Save success message
  await supabase.from('messages').insert({
    project_id: projectId,
    role: 'ai',
    content: `✅ Created ${Object.keys(generatedFiles).length} pages: ${Object.keys(generatedFiles).join(', ')}`
  })

  await updateStatus({
    status: 'completed',
    tasks,
    files: generatedFiles,
    progress: 100,
    currentStep: '✅ Done!'
  })

  // Increment generation count for multi-page generation
  await incrementGenerationCount();
}

// Generate design specification
async function generateDesignSpec(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'deepseek-reasoner', // Use reasoner for new website generation
    messages: [
      {
        role: 'system',
        content: `You are a UI/UX designer. Create a brief design specification (max 200 words) for the following website request. Include: color palette, typography, layout style, and key visual elements. Be concise.`
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 500,
    temperature: 0.7
  })

  return response.choices[0]?.message?.content || 'Modern, clean design with professional aesthetics'
}

// Generate a single page with consistent styling
async function generateSinglePage(
  originalPrompt: string,
  designSpec: string,
  pageName: string,
  fileName: string,
  allPages: string[],
  indexHtmlReference?: string
): Promise<string> {
  const navLinks = allPages.map(p => {
    const file = p === 'home' ? 'index.html' : `${p}.html`
    const label = p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')
    return `<a href="${file}">${label}</a>`
  }).join(' | ')

  const systemPrompt = `You are an expert web developer. Generate ONLY the HTML code for ${fileName}.
  
DESIGN SPECIFICATION:
${designSpec}

CRITICAL REQUIREMENTS:
1. Return ONLY raw HTML code - no markdown, no explanations, no code blocks
2. Start with <!DOCTYPE html>
3. Include these CDNs in <head>:
   <script src="https://cdn.tailwindcss.com"></script>
   <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css">
   <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

4. Include before </body>:
   <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
   <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
   <script>AOS.init({duration:800,once:true});</script>

5. Navigation must include links to: ${navLinks}
6. ${indexHtmlReference ? 'Match the header/footer style from the reference below' : 'Create a consistent header and footer'}
7. Use data-aos="fade-up" for scroll animations
8. Make it visually stunning with modern design

${indexHtmlReference ? `REFERENCE (match this header/footer style):\n${indexHtmlReference.substring(0, 2000)}` : ''}`

  const response = await openai.chat.completions.create({
    model: 'deepseek-reasoner', // Use reasoner for new website generation
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create the ${pageName} page for: ${originalPrompt}` }
    ],
    max_tokens: 8192,
    temperature: 0.7
  })

  let html = response.choices[0]?.message?.content || ''

  // Clean up the response
  html = html.replace(/```html\s*/g, '').replace(/```\s*/g, '').trim()

  // Ensure it starts with DOCTYPE
  if (!html.includes('<!DOCTYPE')) {
    html = '<!DOCTYPE html>\n<html lang="en">\n' + html
  }
  if (!html.includes('</html>')) {
    html += '\n</html>'
  }

  return html
}

// Simple generation for modifications or simple requests
async function generateSimple(
  jobId: string,
  prompt: string,
  existingFiles: Record<string, string>,
  isModification: boolean,
  userId: string,
  projectId: string,
  updateStatus: Function,
  supabase: any,
  history: Array<{ role: 'user' | 'ai', content: string }>
) {
  // Use deepseek-chat for modifications, deepseek-reasoner for new websites
  const model = isModification ? "deepseek-chat" : "deepseek-reasoner"

  await updateStatus({
    status: 'processing',
    progress: 10,
    currentStep: isModification ? '✏️ Applying your changes...' : '🎨 Designing your website...'
  })

  const systemPrompt = buildSystemPrompt(isModification, existingFiles)
  const userMessage = buildUserMessage(prompt, isModification, existingFiles)

  // Debug logging
  console.log('[MODIFICATION] isModification:', isModification)
  console.log('[MODIFICATION] User prompt:', prompt)
  console.log('[MODIFICATION] Existing files:', Object.keys(existingFiles))
  console.log('[MODIFICATION] User message type:',
    userMessage.includes('ADD A NEW PAGE') ? 'NEW_PAGE' :
      userMessage.includes('FIX A BUG') ? 'BUG_FIX' :
        userMessage.includes('CHANGE STYLING') ? 'STYLE_CHANGE' :
          userMessage.includes('EDIT CONTENT') ? 'CONTENT_EDIT' : 'GENERAL_MODIFY'
  )

  const relevantHistory = history.slice(-6)
  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...relevantHistory
      .filter(msg => msg.content && !msg.content.startsWith('Starting generation') && !msg.content.includes('%'))
      .map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
      })),
    { role: "user", content: userMessage }
  ]

  await updateStatus({
    progress: 20,
    currentStep: isModification ? '✏️ Applying your changes...' : '🎨 Writing code...'
  })

  const stream = await openai.chat.completions.create({
    model: model,
    messages: apiMessages as any,
    stream: true,
    max_tokens: 8192,
    temperature: 0.7,
    response_format: { type: "json_object" },
    ...(model === 'deepseek-reasoner' ? { extra_body: { thinking: { type: "enabled" } } } : {})
  } as any) as unknown as AsyncIterable<any>

  let fullContent = ''
  let fullReasoning = ''
  let lastUpdate = Date.now()

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta as any

    if (delta?.reasoning_content) {
      fullReasoning += delta.reasoning_content
    }
    if (delta?.content) {
      fullContent += delta.content
    }

    if (Date.now() - lastUpdate > 2000) {
      const progress = Math.min(85, 20 + (fullContent.length / 500))
      await updateStatus({
        progress,
        currentStep: '💻 Generating code...',
        files: { '_reasoning': fullReasoning }
      })
      lastUpdate = Date.now()
    }
  }

  await updateStatus({
    progress: 92,
    currentStep: '⚙️ Processing output...',
    files: { '_reasoning': fullReasoning }
  })

  const files = parseAIOutput(fullContent, existingFiles, isModification)

  if (!files || Object.keys(files).filter(k => k !== '_reasoning').length === 0) {
    throw new Error('AI did not generate any files')
  }

  if (files['index.html'] && !files['index.html'].includes('<!DOCTYPE') && !files['index.html'].includes('<html')) {
    throw new Error('Generated HTML appears to be incomplete')
  }

  await supabase
    .from('projects')
    .update({
      code_content: JSON.stringify(files),
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .eq('user_id', userId)

  await supabase.from('messages').insert({
    project_id: projectId,
    role: 'ai',
    content: 'Website updated successfully!'
  })

  await updateStatus({
    status: 'completed',
    files,
    progress: 100,
    currentStep: '✅ Done!'
  })

  // Increment generation count for single-page generation
  await incrementGenerationCount();
}

// Post-process HTML to fix common issues
function postProcessHtml(html: string): string {
  return html
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\>/g, '>')
    .replace(/\\</g, '<')
    .replace(/\\\\/g, '\\')
}

function buildSystemPrompt(isModification: boolean, existingFiles: Record<string, string>): string {
  const fileList = Object.keys(existingFiles).filter(k => k !== '_reasoning').join(', ')

  const basePrompt = `You are an expert web developer creating beautiful, modern websites.

OUTPUT FORMAT:
- Return ONLY a valid JSON object
- Structure: { "filename.html": "content", "other.html": "content" }
- DO NOT use markdown code blocks
- DO NOT include explanations outside the JSON

TECHNICAL REQUIREMENTS:
1. Use HTML5 with embedded CSS and JavaScript
2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
3. Use FontAwesome for icons: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
4. Use Google Fonts (Inter or Roboto)
5. Make designs PREMIUM, MODERN, and ANIMATED
6. Include smooth scroll, hover effects, and micro-animations
7. Ensure responsive design for all screen sizes

DESIGN GUIDELINES:
- Use a cohesive color scheme
- Add subtle gradients and shadows
- Include smooth transitions and hover effects
- Make the design feel "premium" and "polished"
- Use proper spacing and typography hierarchy`

  if (isModification) {
    return `${basePrompt}

MODIFICATION MODE - You are modifying an existing website.
Current files: ${fileList || 'index.html'}

RULES FOR MODIFICATIONS:
1. READ the existing code carefully before making changes
2. UNDERSTAND what the user wants to change
3. PRESERVE everything that should NOT change
4. RETURN complete file(s) - not partial code snippets

MODIFICATION TYPES:

BUG FIX / ERROR:
- Analyze the problem described by user
- Find and fix the issue in the code
- Test that fix doesn't break other things
- Return the complete fixed file

STYLE/DESIGN CHANGE:
- Apply the requested visual changes
- Keep content and structure the same
- Ensure consistency throughout

CONTENT EDIT:
- Change only the specific content mentioned
- Preserve all styling and layout
- Keep links and functionality working

ADD NEW PAGE:
- Create new .html file with same design as index.html
- Update index.html navigation to include new page link
- Return BOTH files: { "about.html": "...", "index.html": "...(updated nav)" }

ADD NEW FEATURE/SECTION:
- Add the requested feature/section
- Integrate it into existing design
- Update navigation if needed

OUTPUT FORMAT:
{ "filename.html": "<!DOCTYPE html>...(complete HTML)..." }

IMPORTANT: Return COMPLETE files, not partial code. The entire file will be replaced.`
  }

  return `${basePrompt}

NEW WEBSITE MODE:
Create a complete, production-ready website with:
1. All necessary sections (hero, features, about, contact, footer)
2. Visually stunning modern design
3. Interactive elements and animations
4. Fully functional and responsive`
}

function buildUserMessage(prompt: string, isModification: boolean, existingFiles: Record<string, string>): string {
  if (!isModification) {
    return `Create a new website: ${prompt}\n\nReturn ONLY JSON with file contents.`
  }

  const filesContext = Object.entries(existingFiles)
    .filter(([key]) => key !== '_reasoning')
    .map(([filename, content]) => {
      const truncated = content.length > 4000
        ? content.substring(0, 4000) + '\n<!-- ... content truncated ... -->'
        : content
      return `=== ${filename} ===\n${truncated}`
    })
    .join('\n\n')

  const lowerPrompt = prompt.toLowerCase()

  // Detect modification type
  const isNewPage = lowerPrompt.includes('add') && (lowerPrompt.includes('page') || lowerPrompt.includes('section'))
    || lowerPrompt.includes('create') && lowerPrompt.includes('page')
    || lowerPrompt.includes('new page')

  const isBugFix = lowerPrompt.includes('fix') || lowerPrompt.includes('bug') || lowerPrompt.includes('broken')
    || lowerPrompt.includes('not working') || lowerPrompt.includes('error') || lowerPrompt.includes('issue')

  const isStyleChange = lowerPrompt.includes('color') || lowerPrompt.includes('style') || lowerPrompt.includes('font')
    || lowerPrompt.includes('theme') || lowerPrompt.includes('dark') || lowerPrompt.includes('light')
    || lowerPrompt.includes('design') || lowerPrompt.includes('look')

  const isContentEdit = lowerPrompt.includes('change') || lowerPrompt.includes('update') || lowerPrompt.includes('edit')
    || lowerPrompt.includes('modify') || lowerPrompt.includes('replace') || lowerPrompt.includes('text')

  let instructions = ''

  if (isNewPage) {
    instructions = `
TASK: ADD A NEW PAGE
1. Create a NEW .html file for the requested page
2. Copy the header/navigation/footer from index.html
3. Update index.html to add navigation link to the new page
4. Match the design style of existing pages

Return JSON with MULTIPLE files:
{ "newpage.html": "<!DOCTYPE html>...", "index.html": "<!DOCTYPE html>...(with updated nav)" }`
  } else if (isBugFix) {
    instructions = `
TASK: FIX A BUG/ISSUE
1. Carefully analyze the user's description of the problem
2. Find the issue in the code
3. Fix it while preserving all other functionality
4. Return the complete fixed file(s)

Return JSON with the modified file(s).`
  } else if (isStyleChange) {
    instructions = `
TASK: CHANGE STYLING/DESIGN
1. Apply the requested style changes
2. Ensure consistency across the entire page
3. Keep all content and functionality the same
4. Only modify CSS/styling, not the structure

Return JSON with the modified file(s).`
  } else if (isContentEdit) {
    instructions = `
TASK: EDIT CONTENT
1. Make the specific content changes requested
2. Preserve all other content and styling
3. Keep the overall structure the same

Return JSON with the modified file(s).`
  } else {
    instructions = `
TASK: MODIFY WEBSITE
1. Apply the requested changes
2. Preserve existing content and design not being changed
3. Keep the website functional

Return JSON with the modified file(s).`
  }

  return `CURRENT WEBSITE FILES:
${filesContext}

USER REQUEST: ${prompt}
${instructions}`
}

function parseAIOutput(rawContent: string, existingFiles: Record<string, string>, isModification: boolean): Record<string, string> {
  let files: Record<string, string> = {}

  let jsonString = rawContent
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim()
    .replace(/^\s*\n*/, '')
    .replace(/\n*\s*$/, '')

  try {
    files = JSON.parse(jsonString)
  } catch (e) {
    try {
      files = JSON.parse(repairJson(jsonString))
    } catch (e2) {
      files = extractFilesManually(jsonString)
      if (Object.keys(files).length === 0) {
        if (jsonString.includes('<!DOCTYPE') || jsonString.includes('<html')) {
          files = { 'index.html': jsonString }
        } else {
          throw new Error('Could not parse AI output')
        }
      }
    }
  }

  Object.keys(files).forEach(key => {
    if (typeof files[key] === 'string' && key !== '_reasoning') {
      files[key] = postProcessHtml(files[key])
    }
  })

  if (isModification) {
    Object.keys(existingFiles).forEach(key => {
      if (key !== '_reasoning' && !files[key]) {
        files[key] = existingFiles[key]
      }
    })
  }

  delete files['_reasoning']
  return files
}

function repairJson(str: string): string {
  let repaired = str
    .replace(/\\>/g, '>')
    .replace(/\\</g, '<')
    .replace(/[\x00-\x1F\x7F]/g, (char) => {
      if (char === '\n') return '\\n'
      if (char === '\r') return '\\r'
      if (char === '\t') return '\\t'
      return ''
    })

  if (!repaired.endsWith('}')) {
    const lastBrace = repaired.lastIndexOf('}')
    if (lastBrace > 0) {
      repaired = repaired.substring(0, lastBrace + 1)
    }
  }

  return repaired
}

function extractFilesManually(content: string): Record<string, string> {
  const files: Record<string, string> = {}
  const regex = /"([^"]+\.html)":\s*"([\s\S]*?)(?:(?<!\\)"(?=\s*[,}]))/g
  let match

  while ((match = regex.exec(content)) !== null) {
    const filename = match[1]
    let fileContent = match[2]
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
    files[filename] = fileContent
  }

  return files
}

export async function getGenerationStatus(jobId: string): Promise<GenerationJob | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    status: data.status,
    currentStep: data.current_step,
    progress: data.progress,
    files: data.files || {},
    error: data.error,
    tasks: data.tasks || [],
    currentTaskIndex: data.current_task_index || 0,
    totalTasks: data.total_tasks || 0
  }
}

// Get active (running) job for a project - used to resume on page refresh
export async function getActiveJobForProject(projectId: string): Promise<GenerationJob | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Find any job that's still pending or processing
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  // Check if job is stale (older than 10 minutes) - mark as error
  const createdAt = new Date(data.created_at)
  const now = new Date()
  const ageMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60

  if (ageMinutes > 10) {
    // Mark stale job as error
    await supabase
      .from('generation_jobs')
      .update({
        status: 'error',
        error: 'Job timed out',
        current_step: 'Timed out'
      })
      .eq('id', data.id)
    return null
  }

  return {
    id: data.id,
    status: data.status,
    currentStep: data.current_step,
    progress: data.progress,
    files: data.files || {},
    error: data.error,
    tasks: data.tasks || [],
    currentTaskIndex: data.current_task_index || 0,
    totalTasks: data.total_tasks || 0
  }
}
