'use server'

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || process.env.NEXT_OPENAI_KEY || process.env.OPENAI_API_KEY,
  baseURL: 'https://api.deepseek.com'
})

export async function generateProjectName(prompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a creative assistant that generates concise, professional project names. Given a website description, create a short, catchy project name (2-4 words max). Return ONLY the project name, nothing else.'
        },
        {
          role: 'user',
          content: `Generate a project name for this website: "${prompt}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 20
    });

    const projectName = response.choices[0]?.message?.content?.trim() || 'New Project';
    
    // Clean up the name (remove quotes, extra punctuation)
    const cleanedName = projectName
      .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
      .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
      .trim()
      .slice(0, 50); // Limit length
    
    return cleanedName || 'New Project';
  } catch (error) {
    console.error('Error generating project name:', error);
    // Fallback: Create a simple name from the prompt
    const fallbackName = prompt
      .split(' ')
      .slice(0, 3)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return fallbackName.slice(0, 50) || 'New Project';
  }
}
