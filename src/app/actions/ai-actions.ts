'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.NEXT_OPENAI_KEY || process.env.OPENAI_API_KEY,
})

export async function generateWebsite(prompt: string, projectId: string, currentCode?: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    const systemPrompt = `You are an expert Next.js and Tailwind CSS developer.
    You build modern, beautiful, and responsive websites using the Next.js App Router.
    
    Your goal is to generate a JSON object containing the files needed to render the website.
    The keys should be the file paths (e.g., "/app/page.tsx", "/components/Header.tsx") and the values should be the code content.
    
    IMPORTANT RULES:
    1. Return ONLY a valid JSON object. Do not wrap it in markdown code blocks.
    2. The main entry point must be "/app/page.tsx".
    3. Use 'lucide-react' for icons.
    4. Use Tailwind CSS classes for styling.
    5. Ensure the code is fully functional and imports are correct (relative to the file structure).
    6. Do NOT use CSS modules (*.module.css). Use Tailwind CSS only.
    7. Do not include 'node_modules' or configuration files like 'next.config.js' or 'tailwind.config.js' unless absolutely necessary for specific custom config (usually not needed for Sandpack).
    8. If 'currentCode' is provided, it will be a JSON string of the current files. Modify or add to these files based on the user's prompt.
    
    Example Output Format:
    {
      "/app/page.tsx": "import React from 'react'; export default function Page() { return <div className='p-4'>Hello</div>; }",
      "/components/Button.tsx": "..."
    }
    `

    const messages: any[] = [
      { role: 'user', content: systemPrompt }
    ]

    if (currentCode) {
      messages.push({ role: 'user', content: `Here is the current code (JSON): ${currentCode}` })
      messages.push({ role: 'user', content: `Update this code based on this request: ${prompt}` })
    } else {
      messages.push({ role: 'user', content: `Build a website based on this description: ${prompt}` })
    }

    const response = await openai.chat.completions.create({
      model: 'o1-mini',
      messages: messages
    })

    const cleanContent = (response.choices[0].message.content || '{}').replace(/```json\n?|```/g, '').trim()
    const generatedCode = cleanContent

    // Save to database
    const { error } = await supabase
      .from('projects')
      .update({ 
        code_content: generatedCode,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error saving generated code:', error)
      return { error: 'Failed to save generated code' }
    }

    revalidatePath(`/builder/${projectId}`)
    return { success: true, code: generatedCode }

  } catch (error: any) {
    console.error('AI Generation Error:', error)
    return { error: error.message || 'Failed to generate website' }
  }
}
