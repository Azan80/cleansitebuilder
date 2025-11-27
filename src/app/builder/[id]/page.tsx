'use client'

import { getProjectFiles } from '@/app/actions/download-actions'
import { getProjectById } from '@/app/actions/project-actions'
import { SandpackPreview } from '@/components/SandpackPreview'
import { ThemeToggle } from '@/components/ThemeToggle'
import { saveAs } from 'file-saver'
import { AnimatePresence, motion } from 'framer-motion'
import JSZip from 'jszip'
import {
    ChevronLeft,
    Code,
    Download,
    Maximize2,
    Monitor,
    Rocket,
    RotateCcw,
    Send,
    Share2,
    Smartphone,
    Sparkles,
    Tablet
} from 'lucide-react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'



export default function ProjectEditorPage() {
    const params = useParams()
    const router = useRouter()
    const [project, setProject] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [prompt, setPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
    const [version, setVersion] = useState(0)
    const [isViewCodeOpen, setIsViewCodeOpen] = useState(false)
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai', content: string }>>([
        { role: 'ai', content: 'Hello! I\'m your AI web builder. Describe the website you want to create, and I\'ll build it for you instantly.' }
    ])
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchProject = async () => {
            if (params.id) {
                const data = await getProjectById(params.id as string)
                if (data) {
                    setProject(data)
                    if (data.code_content) {
                        // If there is existing code, add a message about it
                        setMessages(prev => [...prev, { role: 'ai', content: 'I loaded your existing project code.' }])
                    }
                } else {
                    router.push('/builder')
                }
                setLoading(false)
            }
        }
        fetchProject()
    }, [params.id, router])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!prompt.trim() || isGenerating) return

        const userMessage = prompt
        const newMessages = [...messages, { role: 'user' as const, content: userMessage }]
        setMessages(newMessages)
        setPrompt('')
        setIsGenerating(true)

        try {
            // Import the new generation action
            const { startWebsiteGeneration, getGenerationStatus } = await import('@/app/actions/ai-generation')

            // Start generation
            const result = await startWebsiteGeneration(userMessage, project.id, project.code_content)

            if (!result.success || !result.jobId) {
                setMessages([...newMessages, { role: 'ai', content: `Sorry, something went wrong: ${result.error}` }])
                setIsGenerating(false)
                return
            }

            // Add progress message
            setMessages([...newMessages, { role: 'ai', content: 'Starting generation...' }])

            // Poll for status
            const jobId = result.jobId
            let completed = false
            let lastProgress = 0

            while (!completed) {
                await new Promise(resolve => setTimeout(resolve, 1000)) // Poll every second

                const status = await getGenerationStatus(jobId)

                if (!status) {
                    setMessages([...newMessages, { role: 'ai', content: 'Error: Could not get generation status' }])
                    break
                }

                // Update progress message
                if (status.progress > lastProgress) {
                    const progressMsg = `${status.currentStep} (${status.progress}%)`
                    setMessages([...newMessages, { role: 'ai', content: progressMsg }])
                    lastProgress = status.progress
                }

                if (status.status === 'completed') {
                    completed = true
                    if (status.files) {
                        setProject((prev: any) => ({ ...prev, code_content: JSON.stringify(status.files) }))
                        setVersion(v => v + 1)
                        setMessages([...newMessages, { role: 'ai', content: '✅ Website generated successfully! Check out the preview.' }])
                    }
                } else if (status.status === 'error') {
                    completed = true
                    setMessages([...newMessages, { role: 'ai', content: `❌ Error: ${status.error}` }])
                }
            }
        } catch (error) {
            console.error('Handle Message Error:', error)
            setMessages([...newMessages, { role: 'ai', content: 'An unexpected error occurred.' }])
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDownload = async () => {
        if (!project?.id) return

        try {
            const result = await getProjectFiles(project.id)
            if (result.error || !result.files) {
                alert('Error downloading files: ' + result.error)
                return
            }

            const zip = new JSZip()

            Object.entries(result.files).forEach(([path, content]) => {
                // Remove leading slash if present
                const cleanPath = path.startsWith('/') ? path.substring(1) : path
                zip.file(cleanPath, content as string)
            })

            const blob = await zip.generateAsync({ type: 'blob' })
            saveAs(blob, `${result.projectName || 'project'}.zip`)
        } catch (error) {
            console.error('Download error:', error)
            alert('Failed to download project')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-[#030712] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-white overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] flex items-center justify-between px-4 z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/builder')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-500"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center">
                            <Image src="/icon/project-initiation (1).png" alt="Logo" width={20} height={20} className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm leading-tight">{project?.name}</h1>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-[10px] text-gray-500 font-medium">Draft</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center bg-gray-100 dark:bg-white/5 rounded-lg p-1 mr-4">
                        <button
                            onClick={() => setViewport('desktop')}
                            className={`p-1.5 rounded-md transition-all ${viewport === 'desktop' ? 'bg-white dark:bg-[#222] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Monitor className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewport('tablet')}
                            className={`p-1.5 rounded-md transition-all ${viewport === 'tablet' ? 'bg-white dark:bg-[#222] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Tablet className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewport('mobile')}
                            className={`p-1.5 rounded-md transition-all ${viewport === 'mobile' ? 'bg-white dark:bg-[#222] shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <Smartphone className="w-4 h-4" />
                        </button>
                    </div>

                    <ThemeToggle />
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 transition-colors">
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-white/10"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                        <Rocket className="w-4 h-4" />
                        <span className="hidden sm:inline">Deploy</span>
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - AI Chat */}
                <div className="w-[400px] flex flex-col border-r border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] z-10 shadow-xl">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {messages.map((msg, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={idx}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'bg-gray-100 dark:bg-white/10'}`}>
                                    {msg.role === 'ai' ? (
                                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    ) : (
                                        <div className="text-xs font-bold">You</div>
                                    )}
                                </div>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                    }`}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}
                        {isGenerating && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
                        <form onSubmit={handleSendMessage} className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSendMessage(e)
                                    }
                                }}
                                placeholder="Describe changes or new sections..."
                                className="w-full bg-gray-500 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none h-[52px] max-h-32"
                            />
                            <button
                                type="submit"
                                disabled={!prompt.trim() || isGenerating}
                                className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-white/10 text-white rounded-lg transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                            <span>AI can make mistakes. Review generated code.</span>
                            <span>Enter to send</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Preview */}
                <div className="flex-1 bg-gray-100 dark:bg-[#111] relative flex flex-col">
                    {/* Toolbar */}
                    <div className="h-10 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] flex items-center justify-between px-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span>Preview Mode</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded text-gray-500" title="Refresh">
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setIsViewCodeOpen(true)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded text-gray-500"
                                title="View Code"
                            >
                                <Code className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded text-gray-500" title="Full Screen">
                                <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Preview Canvas */}
                    <div className="flex-1 overflow-hidden flex items-center justify-center p-8 relative">
                        {/* Dotted Background */}
                        <div className="absolute inset-0 bg-[radial-gradient(#80808030_1px,transparent_1px)] [background-size:20px_20px]" />

                        <motion.div
                            layout
                            className={`bg-white dark:bg-[#0a0a0a] shadow-2xl rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 transition-all duration-500 ease-in-out relative z-10 flex flex-col ${viewport === 'mobile' ? 'w-[375px] h-[667px]' :
                                viewport === 'tablet' ? 'w-[768px] h-[1024px]' :
                                    'w-full h-full'
                                }`}
                        >
                            {/* Browser Chrome (Mockup) */}
                            <div className="h-8 bg-gray-100 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-white/10 flex items-center px-3 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                                </div>
                                <div className="flex-1 flex justify-center">
                                    <div className="bg-white dark:bg-[#0a0a0a] px-3 py-0.5 rounded text-[10px] text-gray-400 border border-gray-200 dark:border-white/5 w-1/2 text-center truncate">
                                        {project?.name ? `${project.name.toLowerCase().replace(/\s+/g, '-')}.vercel.app` : 'untitled-project.vercel.app'}
                                    </div>
                                </div>
                            </div>

                            {/* Preview Content (Sandpack) */}
                            <div className="flex-1 bg-white relative group h-full">
                                <SandpackPreview
                                    files={(() => {
                                        try {
                                            const aiFiles = project?.code_content ? JSON.parse(project.code_content) : {
                                                "/app/page.tsx": `export default function Page() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Your Project</h1>
        <p className="text-gray-600 mb-8">Start by describing what you want to build in the chat</p>
      </div>
    </div>
  )
}`
                                            }
                                            return aiFiles
                                        } catch (e) {
                                            console.error('Error parsing code_content:', e)
                                            return {
                                                "/app/page.tsx": `export default function Page() { return <div className="p-8">Error loading preview</div> }`
                                            }
                                        }
                                    })()}
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isViewCodeOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setIsViewCodeOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-4xl bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <h3 className="text-white font-medium">Generated Code (JSON)</h3>
                                <button onClick={() => setIsViewCodeOpen(false)} className="text-gray-400 hover:text-white">
                                    <ChevronLeft className="w-5 h-5 rotate-180" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                                <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                                    {project?.code_content || 'No code generated yet.'}
                                </pre>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
