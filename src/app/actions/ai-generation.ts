'use server'

import { createClient } from '@/utils/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.NEXT_OPENAI_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com'
})

export type GenerationJob = {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  currentStep: string;
  progress: number;
  files: Record<string, string>;
  error?: string;
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
      current_step: 'Starting...',
      progress: 0,
      files: {}
    })

  if (error) {
    console.error('Failed to create job:', error)
    return { success: false, error: error.message }
  }

  // Start background generation (fire and forget)
  generateInBackground(jobId, prompt, projectId, currentCode, user.id, history).catch(console.error)

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

  const updateStatus = async (status: Partial<GenerationJob>) => {
    const dbUpdates: any = { updated_at: new Date().toISOString() }
    if (status.status) dbUpdates.status = status.status
    if (status.currentStep) dbUpdates.current_step = status.currentStep
    if (status.progress !== undefined) dbUpdates.progress = status.progress
    if (status.files) dbUpdates.files = status.files
    if (status.error) dbUpdates.error = status.error
    
    await supabase
      .from('generation_jobs')
      .update(dbUpdates)
      .eq('id', jobId)
  }

  try {
    // Determine if this is a new project or modification
    let existingFiles: Record<string, string> = {}
    let isModification = false
    
    console.log('[AI-GEN] currentCode exists:', !!currentCode)
    console.log('[AI-GEN] currentCode length:', currentCode?.length || 0)
    
    if (currentCode) {
      try {
        existingFiles = JSON.parse(currentCode)
        console.log('[AI-GEN] Parsed existing files:', Object.keys(existingFiles))
        // Check if we have actual content (not just the default placeholder)
        const hasRealContent = Object.keys(existingFiles).some(key => 
          key !== '_reasoning' && existingFiles[key] && existingFiles[key].length > 100
        )
        isModification = hasRealContent
        console.log('[AI-GEN] hasRealContent:', hasRealContent, 'isModification:', isModification)
      } catch (e) {
        // If parsing fails, treat as new project
        console.log('[AI-GEN] Failed to parse currentCode:', e)
        existingFiles = {}
      }
    }

    // Choose model based on task complexity
    const model = isModification ? "deepseek-chat" : "deepseek-reasoner"

    await updateStatus({
      status: 'processing',
      progress: 10,
      currentStep: isModification ? 'Analyzing your changes...' : 'Understanding your requirements...'
    })

    // Build a comprehensive system prompt
    const systemPrompt = buildSystemPrompt(isModification, existingFiles)

    // Build the user message with proper context
    const userMessage = buildUserMessage(prompt, isModification, existingFiles)

    // Build API messages - only include relevant history
    const relevantHistory = history.slice(-6) // Last 3 exchanges
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
      currentStep: isModification ? 'Applying your changes...' : 'Designing your website...'
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
        
        if (Date.now() - lastUpdate > 500) {
          await updateStatus({ 
            files: { '_reasoning': fullReasoning } as any,
            currentStep: 'Thinking through the design...',
            progress: 25
          })
          lastUpdate = Date.now()
        }
      } else if (delta?.content) {
        fullContent += delta.content
        
        if (Date.now() - lastUpdate > 500) {
          const progress = 40 + Math.min(50, Math.floor(fullContent.length / 200))
          await updateStatus({
            currentStep: 'Writing code...',
            progress: progress
          })
          lastUpdate = Date.now()
        }
      }
    }

    await updateStatus({ 
      progress: 92, 
      currentStep: 'Processing output...',
      files: { '_reasoning': fullReasoning } as any
    })

    // Parse and validate the JSON output
    const files = parseAIOutput(fullContent, existingFiles, isModification)

    // Validate that we have meaningful content
    if (!files || Object.keys(files).filter(k => k !== '_reasoning').length === 0) {
      throw new Error('AI did not generate any files')
    }

    // Check for valid HTML in index.html
    if (files['index.html'] && !files['index.html'].includes('<!DOCTYPE') && !files['index.html'].includes('<html')) {
      throw new Error('Generated HTML appears to be incomplete')
    }

    // Save to project
    await supabase
      .from('projects')
      .update({ 
        code_content: JSON.stringify(files),
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)

    // Save AI success message to DB
    await supabase.from('messages').insert({
      project_id: projectId,
      role: 'ai',
      content: 'Website updated successfully!'
    })

    await updateStatus({
      status: 'completed',
      progress: 100,
      currentStep: 'Done!',
      files: files as any
    })

  } catch (error: any) {
    console.error('Generation Error:', error)
    
    // Save error message to chat
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

MODIFICATION MODE - Current files: ${fileList || 'index.html'}

WHEN USER ASKS TO ADD A NEW PAGE (e.g. "add about page", "create contact page"):
You MUST return MULTIPLE files in your JSON response:
{
  "about.html": "<!DOCTYPE html>...(new page with same header/nav/footer as index.html)...",
  "index.html": "<!DOCTYPE html>...(UPDATED with navigation link to about.html)..."
}

WHEN USER ASKS TO EDIT EXISTING CONTENT:
Return only the modified file:
{
  "index.html": "<!DOCTYPE html>...(with requested changes)..."
}

CRITICAL RULES:
1. For NEW pages: Create a NEW .html file AND update index.html navigation
2. New pages MUST have same header/nav/footer style as index.html
3. Add links in navigation: <a href="about.html">About</a>
4. Keep Home link: <a href="index.html">Home</a>
5. PRESERVE all existing content not being changed`
  }

  return `${basePrompt}

NEW WEBSITE MODE:
You are creating a brand new website from scratch.

REQUIREMENTS:
1. Create a complete, production-ready website
2. Include all necessary sections (hero, features, about, contact, footer, etc.)
3. Make it visually stunning with modern design
4. Include placeholder content that makes sense
5. Add interactive elements (buttons, forms, animations)
6. Ensure the website is fully functional`
}

function buildUserMessage(prompt: string, isModification: boolean, existingFiles: Record<string, string>): string {
  if (!isModification) {
    return `Create a new website based on this description:

${prompt}

Remember: Return ONLY a JSON object with file contents. No explanations.`
  }

  // For modifications, include the current code context
  const currentFilesContext = Object.entries(existingFiles)
    .filter(([key]) => key !== '_reasoning')
    .map(([filename, content]) => {
      // Truncate very long files to avoid token limits
      const truncatedContent = content.length > 3000 
        ? content.substring(0, 3000) + '\n<!-- ... content truncated ... -->'
        : content
      return `=== ${filename} ===\n${truncatedContent}`
    })
    .join('\n\n')

  // Detect if user is asking for a new page
  const lowerPrompt = prompt.toLowerCase()
  const isNewPageRequest = lowerPrompt.includes('add') || lowerPrompt.includes('create') || 
    lowerPrompt.includes('new page') || lowerPrompt.includes('about page') || 
    lowerPrompt.includes('contact page') || lowerPrompt.includes('pricing page')

  if (isNewPageRequest) {
    return `CURRENT WEBSITE:
${currentFilesContext}

USER REQUEST: ${prompt}

IMPORTANT: User is asking for a NEW PAGE. You MUST:
1. Create a NEW .html file (e.g., "about.html", "contact.html", "pricing.html")
2. ALSO update index.html to add navigation link to the new page
3. Use the SAME design style as index.html

Return JSON with MULTIPLE files:
{
  "about.html": "<!DOCTYPE html>...(complete new page)...",
  "index.html": "<!DOCTYPE html>...(with navigation updated)..."
}`
  }

  return `CURRENT WEBSITE:
${currentFilesContext}

USER REQUEST: ${prompt}

Apply the requested changes. Return JSON with the modified file(s).`
}

function parseAIOutput(rawContent: string, existingFiles: Record<string, string>, isModification: boolean): Record<string, string> {
  let files: Record<string, string> = {}
  
  // Clean up the raw content
  let jsonString = rawContent
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim()

  // Remove any leading/trailing whitespace or newlines before the JSON
  jsonString = jsonString.replace(/^\s*\n*/, '').replace(/\n*\s*$/, '')

  try {
    // First attempt: direct parse
    files = JSON.parse(jsonString)
  } catch (e) {
    console.log('Direct parse failed, attempting repairs...')
    
    // Attempt repairs
    try {
      files = JSON.parse(repairJson(jsonString))
    } catch (e2) {
      console.log('Repair parse failed, attempting extraction...')
      
      // Try to extract content manually
      files = extractFilesManually(jsonString)
      
      if (Object.keys(files).length === 0) {
        // Last resort: wrap raw content as HTML
        console.log('Extraction failed, using raw content...')
        if (jsonString.includes('<!DOCTYPE') || jsonString.includes('<html')) {
          files = { 'index.html': jsonString }
        } else {
          throw new Error('Could not parse AI output as valid JSON or HTML')
        }
      }
    }
  }

  // Post-process all files
  Object.keys(files).forEach(key => {
    if (typeof files[key] === 'string' && key !== '_reasoning') {
      // Fix escape sequences
      files[key] = files[key]
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\>/g, '>')
        .replace(/\\</g, '<')
        .replace(/\\\\/g, '\\')
    }
  })

  // ALWAYS merge with existing files during modifications
  // This ensures we don't lose existing pages when AI only returns new/modified ones
  console.log('[AI-GEN] isModification:', isModification)
  console.log('[AI-GEN] existingFiles keys:', Object.keys(existingFiles))
  console.log('[AI-GEN] AI returned files keys:', Object.keys(files))
  
  if (isModification) {
    Object.keys(existingFiles).forEach(key => {
      if (key !== '_reasoning' && !files[key]) {
        // Keep existing files that weren't returned by AI
        console.log('[AI-GEN] Preserving existing file:', key)
        files[key] = existingFiles[key]
      }
    })
    console.log('[AI-GEN] Final merged files keys:', Object.keys(files))
  }

  // Remove the _reasoning key if present
  delete files['_reasoning']

  return files
}

function repairJson(str: string): string {
  let repaired = str
  
  // Fix common escape sequence issues
  repaired = repaired.replace(/\\>/g, '>')
  repaired = repaired.replace(/\\</g, '<')
  repaired = repaired.replace(/\\'/g, "'")
  
  // Remove control characters except newlines, tabs, returns
  repaired = repaired.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Fix truncated JSON
  if (repaired.startsWith('{') && !repaired.endsWith('}')) {
    // Find the last complete string
    const lastQuoteIndex = repaired.lastIndexOf('"')
    if (lastQuoteIndex > 0) {
      repaired = repaired.substring(0, lastQuoteIndex + 1) + '}'
    }
  }
  
  return repaired
}

function extractFilesManually(str: string): Record<string, string> {
  const files: Record<string, string> = {}
  
  // Try to find file patterns like "filename.html": "content"
  const filePattern = /"([^"]+\.html?)"\s*:\s*"([\s\S]*?)(?:"\s*[,}]|"$)/g
  let match
  
  while ((match = filePattern.exec(str)) !== null) {
    const filename = match[1]
    let content = match[2]
    
    // Unescape the content
    content = content
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\>/g, '>')
      .replace(/\\</g, '<')
    
    files[filename] = content
  }
  
  return files
}

export async function getGenerationStatus(jobId: string): Promise<GenerationJob | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }
  
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    status: data.status,
    progress: data.progress,
    currentStep: data.current_step,
    files: data.files || {},
    error: data.error
  }
}
