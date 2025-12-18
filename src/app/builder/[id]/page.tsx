'use client'

import { deployToNetlify, getDomainStatus, removeProjectDomain, updateProjectDomain } from '@/app/actions/deploy-actions'
import { getProjectFiles } from '@/app/actions/download-actions'
import { getProjectById } from '@/app/actions/project-actions'
import { GeneratingPreview } from '@/components/GeneratingPreview'
import { SandpackPreview } from '@/components/SandpackPreview'
import { ThemeToggle } from '@/components/ThemeToggle'
import { saveAs } from 'file-saver'
import { AnimatePresence, motion } from 'framer-motion'
import JSZip from 'jszip'
import {
    Brain,
    ChevronLeft,
    Code,
    Download,
    ExternalLink,
    Maximize2,
    Monitor,
    Rocket,
    RotateCcw,
    Send,
    Smartphone,
    Sparkles,
    Tablet,
    Trash2,
    X
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
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [isDeploying, setIsDeploying] = useState(false)
    const [isDomainModalOpen, setIsDomainModalOpen] = useState(false)
    const [customDomain, setCustomDomain] = useState('')
    const [isConnectingDomain, setIsConnectingDomain] = useState(false)
    const [dnsInstructions, setDnsInstructions] = useState<{ domain: string, target: string } | null>(null)
    const [isRemovingDomain, setIsRemovingDomain] = useState(false)
    const [domainStatus, setDomainStatus] = useState<'none' | 'verifying' | 'active' | 'error'>('none')
    const [reasoning, setReasoning] = useState('')
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai', content: string }>>([])
    const [agentTasks, setAgentTasks] = useState<Array<{ id: string, name: string, type: string, status: string, fileName?: string }>>([])
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
    const [totalTasks, setTotalTasks] = useState(0)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [activeJobId, setActiveJobId] = useState<string | null>(null)
    const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false)
    const [activeMobileTab, setActiveMobileTab] = useState<'editor' | 'preview'>('editor')

    useEffect(() => {
        const fetchProject = async () => {
            if (params.id) {
                const data = await getProjectById(params.id as string)
                if (data) {
                    setProject(data)

                    // Fetch chat history
                    const { createClient } = await import('@/utils/supabase/client')
                    const supabase = createClient()
                    const { data: history } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('project_id', params.id)
                        .order('created_at', { ascending: true })

                    if (history && history.length > 0) {
                        setMessages(history.map(m => ({ role: m.role as 'user' | 'ai', content: m.content })))
                    } else {
                        setMessages([{ role: 'ai', content: 'Hello! I\'m your AI web builder. Describe the website you want to create, and I\'ll build it for you instantly.' }])

                        // Check if this is a new project with an initial prompt from the landing page
                        if (data.description && !data.code_content && !hasAutoSubmitted) {
                            setHasAutoSubmitted(true)
                            // Auto-submit the initial prompt
                            setTimeout(() => {
                                setPrompt(data.description)
                                // Trigger generation after a short delay to ensure UI is ready
                                setTimeout(async () => {
                                    const userMessage = data.description.trim()
                                    const newMessages = [
                                        { role: 'ai' as const, content: 'Hello! I\'m your AI web builder. Describe the website you want to create, and I\'ll build it for you instantly.' },
                                        { role: 'user' as const, content: userMessage }
                                    ]
                                    setMessages(newMessages)
                                    setPrompt('')
                                    setIsGenerating(true)
                                    setReasoning('')

                                    try {
                                        const { startWebsiteGeneration } = await import('@/app/actions/ai-generation')
                                        const result = await startWebsiteGeneration(userMessage, data.id, undefined, newMessages)

                                        if (!result.success || !result.jobId) {
                                            setMessages(prev => [...prev, { role: 'ai', content: `❌ Sorry, something went wrong: ${result.error || 'Unknown error'}. Please try again.` }])
                                            setIsGenerating(false)
                                            return
                                        }

                                        setActiveJobId(result.jobId)
                                        setMessages(prev => [...prev, { role: 'ai', content: '🚀 Starting generation...' }])
                                    } catch (error) {
                                        console.error('Auto-generation error:', error)
                                        setMessages(prev => [...prev, { role: 'ai', content: '❌ An error occurred. Please try sending your request again.' }])
                                        setIsGenerating(false)
                                    }
                                }, 500)
                            }, 100)
                        }
                    }

                    // Check for active (running) jobs
                    const { getActiveJobForProject } = await import('@/app/actions/ai-generation')
                    const activeJob = await getActiveJobForProject(params.id as string)
                    if (activeJob && (activeJob.status === 'pending' || activeJob.status === 'processing')) {
                        console.log('[RESUME] Found active job:', activeJob.id, activeJob.status)
                        setActiveJobId(activeJob.id)
                        setIsGenerating(true)
                        setAgentTasks(activeJob.tasks || [])
                        setCurrentTaskIndex(activeJob.currentTaskIndex || 0)
                        setTotalTasks(activeJob.totalTasks || 0)
                        setMessages(prev => [...prev, { role: 'ai', content: `${activeJob.currentStep} (${activeJob.progress}%)` }])
                    }
                } else {
                    router.push('/builder')
                }
                setLoading(false)
            }
        }
        fetchProject()
    }, [params.id, router, hasAutoSubmitted])

    // Resume polling for active job if page was refreshed
    useEffect(() => {
        if (!activeJobId || !isGenerating) return

        let cancelled = false

        const pollActiveJob = async () => {
            const { getGenerationStatus } = await import('@/app/actions/ai-generation')

            while (!cancelled && isGenerating) {
                const status = await getGenerationStatus(activeJobId)
                if (!status) {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    continue
                }

                // Update agent tasks if available
                if (status.tasks && status.tasks.length > 0) {
                    setAgentTasks(status.tasks)
                    setCurrentTaskIndex(status.currentTaskIndex || 0)
                    setTotalTasks(status.totalTasks || status.tasks.length)
                }

                // Update progress message
                const taskInfo = status.totalTasks ? ` (Task ${(status.currentTaskIndex || 0) + 1}/${status.totalTasks})` : ''
                const progressMsg = `${status.currentStep || 'Working...'}${taskInfo}`
                setMessages(prev => {
                    const newMsgs = [...prev]
                    if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === 'ai') {
                        newMsgs[newMsgs.length - 1].content = progressMsg
                    }
                    return newMsgs
                })

                if (status.files && status.files['_reasoning']) {
                    setReasoning(status.files['_reasoning'])
                }

                if (status.status === 'completed') {
                    const cleanFiles = { ...status.files }
                    delete cleanFiles['_reasoning']

                    setProject((prev: any) => ({
                        ...prev,
                        code_content: JSON.stringify(cleanFiles)
                    }))
                    setVersion(v => v + 1)

                    const fileNames = Object.keys(cleanFiles)
                    setMessages(prev => [...prev.slice(0, -1), {
                        role: 'ai',
                        content: `✅ Done! Generated ${fileNames.length} file(s): ${fileNames.join(', ')}`
                    }])
                    setReasoning('')
                    setAgentTasks([])
                    setIsGenerating(false)
                    setActiveJobId(null)
                    break
                } else if (status.status === 'error') {
                    setMessages(prev => [...prev.slice(0, -1), {
                        role: 'ai',
                        content: `❌ Error: ${status.error || 'Unknown error'}`
                    }])
                    setReasoning('')
                    setAgentTasks([])
                    setIsGenerating(false)
                    setActiveJobId(null)
                    break
                }

                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        pollActiveJob()

        return () => { cancelled = true }
    }, [activeJobId, isGenerating])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Poll for domain status and get DNS instructions for existing domains
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isDomainModalOpen && project?.custom_domain) {
            const checkStatus = async () => {
                const result = await getDomainStatus(project.id)
                if (result.status) {
                    setDomainStatus(result.status as any)
                    // Set DNS instructions so user can view them again
                    if (result.cnameTarget && result.domain) {
                        setDnsInstructions({
                            domain: result.domain,
                            target: result.cnameTarget
                        })
                    }
                }
            }
            checkStatus()
            interval = setInterval(checkStatus, 5000)
        } else {
            // Clear DNS instructions when modal closes or no custom domain
            if (!isDomainModalOpen) {
                setDnsInstructions(null)
            }
        }
        return () => clearInterval(interval)
    }, [isDomainModalOpen, project?.custom_domain, project?.id])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!prompt.trim() || isGenerating) return

        const userMessage = prompt.trim()
        const newMessages = [...messages, { role: 'user' as const, content: userMessage }]
        setMessages(newMessages)
        setPrompt('')
        setIsGenerating(true)
        setReasoning('')

        try {
            const { startWebsiteGeneration, getGenerationStatus } = await import('@/app/actions/ai-generation')

            const result = await startWebsiteGeneration(userMessage, project.id, project.code_content, newMessages)

            if (!result.success || !result.jobId) {
                setMessages(prev => [...prev, { role: 'ai', content: `❌ Sorry, something went wrong: ${result.error || 'Unknown error'}. Please try again.` }])
                setIsGenerating(false)
                return
            }

            // Add initial progress message
            setMessages(prev => [...prev, { role: 'ai', content: '🚀 Starting generation...' }])

            // Poll for status
            const jobId = result.jobId
            let completed = false
            let lastProgress = 0
            let consecutiveErrors = 0

            while (!completed) {
                await new Promise(resolve => setTimeout(resolve, 1000))

                const status = await getGenerationStatus(jobId)

                if (!status) {
                    consecutiveErrors++
                    if (consecutiveErrors > 10) {
                        setMessages(prev => [...prev.slice(0, -1), { role: 'ai', content: '⚠️ Lost connection to generation process. Please refresh and try again.' }])
                        break
                    }
                    continue
                }
                consecutiveErrors = 0 // Reset on successful fetch

                // Update agent tasks if available
                if (status.tasks && status.tasks.length > 0) {
                    setAgentTasks(status.tasks)
                    setCurrentTaskIndex(status.currentTaskIndex || 0)
                    setTotalTasks(status.totalTasks || status.tasks.length)
                }

                // Update progress message
                if (status.progress > lastProgress || status.currentStep) {
                    const taskInfo = status.totalTasks ? ` (Task ${(status.currentTaskIndex || 0) + 1}/${status.totalTasks})` : ''
                    const progressMsg = `${status.currentStep || 'Working...'}${taskInfo}`
                    setMessages(prev => {
                        const newMsgs = [...prev]
                        if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === 'ai') {
                            newMsgs[newMsgs.length - 1].content = progressMsg
                        }
                        return newMsgs
                    })
                    lastProgress = status.progress
                }

                // Update reasoning display
                if (status.files && status.files['_reasoning']) {
                    setReasoning(status.files['_reasoning'])
                }

                if (status.status === 'completed') {
                    completed = true
                    if (status.files && Object.keys(status.files).filter(k => k !== '_reasoning').length > 0) {
                        // Create clean files object without _reasoning
                        const cleanFiles = { ...status.files }
                        delete cleanFiles['_reasoning']

                        setProject((prev: any) => ({
                            ...prev,
                            code_content: JSON.stringify(cleanFiles)
                        }))
                        setVersion(v => v + 1)

                        const fileNames = Object.keys(cleanFiles)
                        const fileCount = fileNames.length
                        const fileList = fileNames.join(', ')
                        setMessages(prev => [...prev.slice(0, -1), {
                            role: 'ai',
                            content: `✅ Done! Generated ${fileCount} file${fileCount > 1 ? 's' : ''}: ${fileList}`
                        }])
                        setReasoning('')
                        setAgentTasks([]) // Clear tasks on completion
                    } else {
                        setMessages(prev => [...prev.slice(0, -1), { role: 'ai', content: '⚠️ Generation completed but no files were created. Please try with a different prompt.' }])
                    }
                } else if (status.status === 'error') {
                    completed = true
                    setMessages(prev => [...prev.slice(0, -1), { role: 'ai', content: `❌ Error: ${status.error || 'Unknown error'}. Try a simpler request or be more specific.` }])
                    setReasoning('')
                    setAgentTasks([]) // Clear tasks on error
                }
            }
        } catch (error: any) {
            console.error('Handle Message Error:', error)
            setMessages(prev => [...prev, { role: 'ai', content: `❌ An error occurred: ${error.message || 'Please try again.'}` }])
            setAgentTasks([])
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

    const previewFiles = (() => {
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
    })()

    const handleOpenNewTab = () => {
        if (previewFiles['index.html']) {
            const blob = new Blob([previewFiles['index.html']], { type: 'text/html' })
            const url = URL.createObjectURL(blob)
            window.open(url, '_blank')
        } else {
            alert('This feature is only available for static HTML projects.')
        }
    }

    const handleDeploy = async () => {
        if (!project?.id || isDeploying) return

        setIsDeploying(true)
        try {
            const result = await deployToNetlify(project.id)
            if (result.success && result.url) {
                window.open(result.url, '_blank')
                setMessages(prev => [...prev, { role: 'ai', content: `🚀 Website deployed successfully! View it here: ${result.url}` }])
                setProject((prev: any) => ({ ...prev, deployment_url: result.url }))
            } else {
                alert('Deployment failed: ' + result.error)
            }
        } catch (error) {
            console.error('Deploy error:', error)
            alert('Failed to deploy project')
        } finally {
            setIsDeploying(false)
        }
    }

    const handleConnectDomain = async () => {
        if (!customDomain) return
        setIsConnectingDomain(true)
        try {
            const result = await updateProjectDomain(project.id, customDomain)
            if (result.success) {
                setProject((prev: any) => ({ ...prev, deployment_url: result.url, custom_domain: customDomain }))
                setDnsInstructions({ domain: customDomain, target: result.cnameTarget })
                // Don't close modal yet, show instructions
            } else {
                alert('Failed to connect domain: ' + result.error)
            }
        } catch (error) {
            console.error('Domain connection error:', error)
            alert('Failed to connect domain')
        } finally {
            setIsConnectingDomain(false)
        }
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#030712] text-gray-900 dark:text-white overflow-hidden">
            {/* Header */}
            <header className="h-14 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] flex items-center justify-between px-3 md:px-4 z-20 shrink-0">
                <div className="flex items-center gap-2 md:gap-4 font-sans">
                    <button
                        onClick={() => router.push('/builder')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-500"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg hidden md:flex items-center justify-center">
                            <Image src="/icon/project-initiation (1).png" alt="Logo" width={20} height={20} className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm leading-tight max-w-[120px] md:max-w-none truncate">{project?.name}</h1>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-[10px] text-gray-500 font-medium">Draft</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden lg:flex items-center bg-gray-100 dark:bg-white/5 rounded-lg p-1 mr-4">
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

                    <div className="hidden sm:block">
                        <ThemeToggle />
                    </div>

                    <button
                        onClick={handleDownload}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500 transition-colors hidden sm:block"
                    >
                        <Download className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleDeploy}
                        disabled={isDeploying}
                        className="flex items-center gap-2 px-3 md:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
                    >
                        {isDeploying ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Rocket className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">{isDeploying ? 'Deploying...' : 'Deploy'}</span>
                        <span className="sm:hidden">{isDeploying ? '...' : 'Deploy'}</span>
                    </button>
                </div>
            </header>

            {/* Mobile Tab Switcher */}
            <div className="flex md:hidden border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
                <button
                    onClick={() => setActiveMobileTab('editor')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeMobileTab === 'editor'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400'
                        }`}
                >
                    AI Editor
                </button>
                <button
                    onClick={() => setActiveMobileTab('preview')}
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeMobileTab === 'preview'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400'
                        }`}
                >
                    Preview
                </button>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Panel - AI Chat */}
                <div className={`
                    w-full md:w-[400px] flex flex-col border-r border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] z-10 shadow-xl
                    absolute inset-0 md:relative
                    transition-transform duration-300
                    ${activeMobileTab === 'editor' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}>
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
                            <div className="space-y-4">
                                {reasoning && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-white/10 bg-gray-100/50 dark:bg-white/5">
                                            <Brain className="w-4 h-4 text-indigo-500 animate-pulse" />
                                            <span className="text-xs font-medium text-gray-500">AI Thinking Process</span>
                                        </div>
                                        <div className="p-3 max-h-40 overflow-y-auto text-xs text-gray-500 font-mono whitespace-pre-wrap leading-relaxed">
                                            {reasoning}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Agent Task List */}
                                {agentTasks.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between gap-2 p-3 border-b border-gray-200 dark:border-white/10 bg-gray-100/50 dark:bg-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                                                    <span className="text-[8px] text-white font-bold">{currentTaskIndex + 1}</span>
                                                </div>
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    Task Progress {currentTaskIndex + 1}/{totalTasks}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-indigo-500 font-medium">
                                                {Math.round((currentTaskIndex / totalTasks) * 100)}%
                                            </div>
                                        </div>
                                        <div className="p-2 max-h-48 overflow-y-auto space-y-1">
                                            {agentTasks.map((task, idx) => (
                                                <div
                                                    key={task.id}
                                                    className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-all ${task.status === 'in_progress'
                                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20'
                                                        : task.status === 'completed'
                                                            ? 'bg-green-50/50 dark:bg-green-500/5'
                                                            : 'opacity-50'
                                                        }`}
                                                >
                                                    {/* Status Icon */}
                                                    {task.status === 'completed' ? (
                                                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                                                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    ) : task.status === 'in_progress' ? (
                                                        <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin shrink-0" />
                                                    ) : task.status === 'error' ? (
                                                        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                                                            <span className="text-white text-[8px]">✕</span>
                                                        </div>
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0" />
                                                    )}

                                                    {/* Task Name */}
                                                    <span className={`flex-1 truncate ${task.status === 'in_progress'
                                                        ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                                                        : task.status === 'completed'
                                                            ? 'text-green-600 dark:text-green-400'
                                                            : 'text-gray-500'
                                                        }`}>
                                                        {task.name}
                                                    </span>

                                                    {/* File badge */}
                                                    {task.fileName && task.status === 'completed' && (
                                                        <span className="text-[10px] bg-gray-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500">
                                                            {task.fileName}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

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
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
                        {/* Quick Prompt Suggestions */}
                        {!isGenerating && messages.length > 1 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {[
                                    'Add a contact form',
                                    'Create an about page',
                                    'Add more animations',
                                    'Change the color scheme'
                                ].map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPrompt(suggestion)}
                                        className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full text-gray-600 dark:text-gray-400 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
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
                                placeholder={messages.length <= 1 ? "Describe the website you want to create..." : "Describe changes or new sections..."}
                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none h-[52px] max-h-32 placeholder:text-gray-400"
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
                            <span>Tip: Be specific! "Add a pricing section with 3 tiers" works better than "add pricing"</span>
                            <span>Enter to send</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Preview */}
                <div className={`
                    flex-1 bg-gray-100 dark:bg-[#111] relative flex flex-col
                    absolute inset-0 md:relative
                    transition-transform duration-300
                    ${activeMobileTab === 'preview' ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                `}>
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
                            <button
                                onClick={handleOpenNewTab}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded text-gray-500"
                                title="Open in New Tab"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setIsFullScreen(true)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded text-gray-500"
                                title="Full Screen"
                            >
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
                                {isGenerating && !project?.code_content ? (
                                    <GeneratingPreview />
                                ) : (
                                    <SandpackPreview files={previewFiles} />
                                )}
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

            <AnimatePresence>
                {isFullScreen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="fixed inset-0 z-[100] bg-white dark:bg-[#0a0a0a] flex flex-col"
                    >
                        <div className="h-14 border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-6 bg-white dark:bg-[#0a0a0a]">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsFullScreen(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="font-medium">Full Screen Preview</span>
                            </div>
                            <button
                                onClick={() => setIsFullScreen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-[#111] p-4 md:p-8 overflow-hidden">
                            <div className="w-full h-full bg-white dark:bg-[#0a0a0a] rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-white/10">
                                {isGenerating && !project?.code_content ? (
                                    <GeneratingPreview />
                                ) : (
                                    <SandpackPreview files={previewFiles} />
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isDomainModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setIsDomainModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium">
                                    {project?.custom_domain ? 'Domain Settings' : 'Connect Custom Domain'}
                                </h3>
                                <button onClick={() => { setIsDomainModalOpen(false); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {project?.custom_domain ? (
                                <div className="space-y-4">
                                    {/* Current Domain Status */}
                                    <div className="p-4 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-500">Current Domain</span>
                                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${domainStatus === 'active' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
                                                domainStatus === 'verifying' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' :
                                                    'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
                                                }`}>
                                                {domainStatus === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                                                {domainStatus === 'verifying' && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />}
                                                {domainStatus === 'active' ? 'Active' : domainStatus === 'verifying' ? 'Verifying' : 'Checking...'}
                                            </div>
                                        </div>
                                        <div className="font-mono text-lg font-bold">{project.custom_domain}</div>
                                    </div>

                                    {/* DNS Instructions */}
                                    {dnsInstructions && (
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3 font-medium">
                                                DNS Configuration
                                            </p>
                                            <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                                                <div className="font-medium text-gray-500">Type:</div>
                                                <div className="font-mono font-bold">CNAME</div>

                                                <div className="font-medium text-gray-500">Name:</div>
                                                <div className="font-mono font-bold">www</div>

                                                <div className="font-medium text-gray-500">Value:</div>
                                                <div className="font-mono font-bold select-all bg-white dark:bg-black/20 px-2 py-1 rounded text-xs break-all">
                                                    {dnsInstructions.target}
                                                </div>
                                            </div>
                                            {domainStatus === 'verifying' && (
                                                <p className="text-xs text-blue-600 dark:text-blue-300 mt-3">
                                                    ⏳ DNS verification can take up to 24 hours. Make sure your CNAME record is correctly configured.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Remove Domain Button */}
                                    <button
                                        onClick={async () => {
                                            if (!confirm('Are you sure you want to remove this custom domain? Your site will go back to using the Netlify subdomain.')) return;
                                            setIsRemovingDomain(true);
                                            const result = await removeProjectDomain(project.id);
                                            setIsRemovingDomain(false);
                                            if (result.success) {
                                                setProject((prev: any) => ({ ...prev, custom_domain: null, deployment_url: result.newUrl }));
                                                setCustomDomain('');
                                                setDnsInstructions(null);
                                            } else {
                                                alert(result.error || 'Failed to remove domain');
                                            }
                                        }}
                                        disabled={isRemovingDomain}
                                        className="w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {isRemovingDomain ? (
                                            <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                        Remove Domain
                                    </button>

                                    {/* Close Button */}
                                    <button
                                        onClick={() => setIsDomainModalOpen(false)}
                                        className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* New Domain Input - only shown when no custom domain */}
                                    {dnsInstructions ? (
                                        <div className="space-y-4">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                                                    To finish connecting <strong>{dnsInstructions.domain}</strong>, please add the following CNAME record to your DNS provider:
                                                </p>
                                                <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
                                                    <div className="font-medium text-gray-500">Type:</div>
                                                    <div className="font-mono font-bold">CNAME</div>

                                                    <div className="font-medium text-gray-500">Name:</div>
                                                    <div className="font-mono font-bold">www</div>

                                                    <div className="font-medium text-gray-500">Value:</div>
                                                    <div className="font-mono font-bold select-all bg-white dark:bg-black/20 px-1 rounded">
                                                        {dnsInstructions.target}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { setIsDomainModalOpen(false); setDnsInstructions(null); }}
                                                className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                                            >
                                                I've Added the Record
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-500 mb-4">
                                                Enter your custom domain (e.g., www.example.com). You will need to configure your DNS settings separately.
                                            </p>
                                            <input
                                                type="text"
                                                value={customDomain}
                                                onChange={(e) => setCustomDomain(e.target.value)}
                                                placeholder="www.yourdomain.com"
                                                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 mb-4 outline-none focus:border-indigo-500"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setIsDomainModalOpen(false)}
                                                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleConnectDomain}
                                                    disabled={isConnectingDomain || !customDomain}
                                                    className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg flex items-center gap-2"
                                                >
                                                    {isConnectingDomain && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                                    Connect
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
