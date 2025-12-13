'use client'

import { getDomainStatus } from '@/app/actions/deploy-actions'
import { createProject, deleteProject, getProjects } from '@/app/actions/project-actions'
import { ThemeToggle } from '@/components/ThemeToggle'
import { createClient } from '@/utils/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  ChevronRight,
  Folder,
  Layout,
  Loader2,
  LogOut,
  MoreVertical,
  Plus,
  Search,
  Settings, Trash2, User,
  X
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function BuilderPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [subscription, setSubscription] = useState<{ status: string; plan: string | null; generationCount: number; generationLimit: number } | null>(null)
  const [activeJobs, setActiveJobs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'projects' | 'jobs'>('projects')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        // Fetch projects
        const userProjects = await getProjects()
        setProjects(userProjects)

        // Fetch subscription status
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status, subscription_plan, generation_count')
          .eq('id', user.id)
          .single()

        if (profile) {
          const planName = (profile.subscription_plan || '').toLowerCase()
          // Match PLAN_LIMITS from subscription.ts
          const limit = planName.includes('pro') ? 250 : planName.includes('starter') ? 100 : 2
          setSubscription({
            status: profile.subscription_status || 'free',
            plan: profile.subscription_plan,
            generationCount: profile.generation_count || 0,
            generationLimit: limit
          })
        }
      }
      setLoading(false)
    }
    checkUser()
  }, [router, supabase])

  // Subscribe to active generation jobs
  useEffect(() => {
    if (!user) return

    const fetchActiveJobs = async () => {
      // Get all project IDs for this user
      const { data: projectIds } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)

      if (!projectIds?.length) return

      // Get active jobs for these projects
      const { data: jobs } = await supabase
        .from('generation_jobs')
        .select('*, projects(name)')
        .in('project_id', projectIds.map((p: any) => p.id))
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })

      setActiveJobs(jobs || [])
    }

    fetchActiveJobs()

    // Subscribe to changes
    const channel = supabase
      .channel('generation-jobs-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generation_jobs',
        },
        () => {
          fetchActiveJobs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCreating(true)
    const formData = new FormData(e.currentTarget)

    const result = await createProject(formData)

    if (result.success) {
      // Refresh projects list
      const userProjects = await getProjects()
      setProjects(userProjects)
      setIsModalOpen(false)
      // Redirect to the new project immediately
      router.push(`/builder/${result.project.id}`)
    } else {
      alert(result.error)
    }
    setIsCreating(false)
  }

  const openDeleteModal = (id: string) => {
    setProjectToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!projectToDelete) return

    setIsDeleting(true)
    const result = await deleteProject(projectToDelete)

    if (result.success) {
      const userProjects = await getProjects()
      setProjects(userProjects)
      setIsDeleteModalOpen(false)
      setProjectToDelete(null)
    } else {
      alert(result.error)
    }
    setIsDeleting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#030712] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#f2f3f5] dark:bg-[#050505] p-3 md:p-4 flex gap-3 md:gap-4 text-gray-900 dark:text-white transition-colors duration-300 overflow-hidden font-sans selection:bg-indigo-500/30">

      {/* Background Ambient Glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Unique Floating Sidebar */}
      <aside
        className={`${isSidebarCollapsed ? 'w-20' : 'w-[280px]'} h-full bg-white/80 dark:bg-[#121212]/80 backdrop-blur-2xl border border-white/50 dark:border-white/5 rounded-[32px] shadow-2xl shadow-gray-200/50 dark:shadow-black/50 flex flex-col transition-all duration-500 z-20 relative hidden md:flex overflow-hidden group/sidebar`}
      >
        {/* Decorative Top Gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

        {/* Header */}
        <div className={`h-24 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-8'} transition-all duration-500 shrink-0`}>
          <div className="flex items-center gap-4 group/logo cursor-pointer">
            <Image src="/icon/project-initiation (1).png" alt="Logo" width={40} height={40} className="w-10 h-10 shrink-0" />
            <div className={`transition-all duration-500 ${isSidebarCollapsed ? 'opacity-0 w-0 translate-x-[-20px] hidden' : 'opacity-100 translate-x-0'}`}>
              <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">CleanSite</span>
              <span className="text-[10px] font-medium text-indigo-500 uppercase tracking-widest block mt-0.5">Builder Studio</span>
            </div>
          </div>
        </div>

        {/* Toggle Button (Floating on Edge) */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`absolute -right-0.5 top-9 w-6 h-6 bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 dark:hover:text-white shadow-md z-50 transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100 scale-90 group-hover/sidebar:scale-100`}
        >
          <ChevronRight className={`w-3 h-3 transition-transform duration-500 ${!isSidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Main Navigation */}
        <div className="flex-1 px-4 py-2 space-y-8 overflow-y-auto scrollbar-hide">

          {/* Create Button */}
          <div className="relative group/create">
            <button
              onClick={() => setIsModalOpen(true)}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center h-12' : 'gap-3 px-4 h-14'} bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl transition-all duration-300 shadow-xl shadow-gray-900/10 dark:shadow-black/50 hover:shadow-gray-900/20 dark:hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98] z-10 relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover/create:translate-x-[200%] transition-transform duration-1000" />
              <Plus className="w-5 h-5 shrink-0" />
              <span className={`font-semibold tracking-wide transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>Create New</span>
            </button>
          </div>

          {/* Menu Groups */}
          <div className="space-y-2">
            {!isSidebarCollapsed && (
              <div className="px-4 mb-3 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Workspace</span>
              </div>
            )}
            <SidebarLink icon={<Layout className="w-5 h-5" />} label="Dashboard" active collapsed={isSidebarCollapsed} />
            <SidebarLink icon={<Folder className="w-5 h-5" />} label="All Projects" collapsed={isSidebarCollapsed} />
            <SidebarLink icon={<User className="w-5 h-5" />} label="Team Members" collapsed={isSidebarCollapsed} />
          </div>

          <div className="space-y-2">
            {!isSidebarCollapsed && (
              <div className="px-4 mb-3 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Configuration</span>
              </div>
            )}
            <SidebarLink icon={<Settings className="w-5 h-5" />} label="Settings" collapsed={isSidebarCollapsed} />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 mt-auto space-y-4">
          {/* Usage Card (Glass) */}
          {!isSidebarCollapsed && subscription && (
            <div className="p-5 rounded-[24px] bg-gradient-to-br from-gray-50 to-white dark:from-[#1a1a1a] dark:to-[#111] border border-gray-100 dark:border-white/5 shadow-lg relative overflow-hidden group/card">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full -mr-10 -mt-10 transition-transform duration-700 group-hover/card:scale-150" />

              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan Usage</span>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide ${subscription.plan === 'Pro'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                  }`}>
                  {subscription.status === 'active' ? subscription.plan : 'Free'}
                </span>
              </div>

              <div className="space-y-3 relative z-10">
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{subscription.generationCount}</span>
                  <span className="text-xs font-medium text-gray-400 mb-1">/ {subscription.generationLimit} gens</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-black rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, (subscription.generationCount / subscription.generationLimit) * 100)}%` }}
                  />
                </div>
                {subscription.status !== 'active' && (
                  <Link href="/pricing" className="block w-full py-2 text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors">
                    Upgrade to Pro →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* User Profile (Floating Pill) */}
          <div className={`flex items-center gap-3 p-2 rounded-[20px] bg-gray-100/50 dark:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all cursor-pointer group/user ${isSidebarCollapsed ? 'justify-center aspect-square p-0' : ''}`}>
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-sm shadow-inner">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-[2.5px] border-white dark:border-[#121212]" />
            </div>

            <div className={`flex-1 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.email?.split('@')[0]}</div>
              <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
            </div>

            <button
              onClick={handleSignOut}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0 ${isSidebarCollapsed ? 'hidden' : 'block'}`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Floating Card */}
      <main className="flex-1 h-full bg-white dark:bg-[#0a0a0a] rounded-[32px] border border-white/50 dark:border-white/5 shadow-xl shadow-gray-200/20 dark:shadow-black/20 overflow-hidden relative flex flex-col">
        {/* Header */}
        <header className="h-20 border-b border-gray-100 dark:border-white/5 flex items-center justify-between px-8 bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-xl z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors">Home</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-900 dark:text-white bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-md">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within/search:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-72 bg-gray-50 dark:bg-[#111] border-none rounded-2xl pl-11 pr-4 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-[#151515] transition-all shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50">
                <span className="text-[10px] font-bold bg-gray-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500">⌘K</span>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />

            <ThemeToggle />

            <button className="relative w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-[#111] hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-gray-500 hover:text-indigo-500 transition-all group/bell">
              <Bell className="w-5 h-5 group-hover/bell:rotate-12 transition-transform" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#111]" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 relative scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  Welcome back, {user?.user_metadata?.first_name || 'Builder'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Here's what's happening with your projects today.</p>
              </div>
              <div className="flex gap-3">
                <select className="bg-white dark:bg-[#111] border-none ring-1 ring-gray-200 dark:ring-white/10 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-indigo-500 transition-all shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-8 flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl w-fit">
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'projects'
                  ? 'bg-white dark:bg-[#111] text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  All Projects
                  <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-white/10 text-[10px] font-bold">
                    {projects.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'jobs'
                  ? 'bg-white dark:bg-[#111] text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Loader2 className={`w-4 h-4 ${activeJobs.length > 0 ? 'animate-spin' : ''}`} />
                  Active Jobs
                  {activeJobs.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold animate-pulse">
                      {activeJobs.length}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'jobs' ? (
              // Active Jobs Tab
              <div>
                {activeJobs.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[32px] border border-dashed border-gray-200 dark:border-white/10">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Loader2 className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No active jobs</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                      All your generation jobs are complete. Create a new project or regenerate an existing one to see active jobs here.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 pb-10">
                    {activeJobs.map((job) => (
                      <div key={job.id} className="bg-white dark:bg-[#111] p-6 rounded-[24px] border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <Loader2 className="w-6 h-6 animate-spin text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                                  {job.projects?.name || 'Untitled Project'}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                                    {job.status}
                                  </span>
                                  <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    {job.current_step || 'Initializing...'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-4">
                                <div className="flex-1 h-3 bg-gray-100 dark:bg-black rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 relative overflow-hidden"
                                    style={{ width: `${job.progress}%` }}
                                  >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite]" />
                                  </div>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white min-w-[3rem] text-right">
                                  {job.progress}%
                                </span>
                              </div>

                              {job.error && (
                                <div className="mt-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                                    {job.error}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <Link
                            href={`/builder/${job.project_id}`}
                            className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-gray-900/10 dark:shadow-white/10"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Projects Tab
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Folder className="w-5 h-5 text-gray-400" />
                    Recent Projects
                  </h2>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-64 bg-gray-100 dark:bg-white/5 rounded-[24px] animate-pulse" />
                    ))}
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-20 bg-white dark:bg-[#111] rounded-[32px] border border-dashed border-gray-200 dark:border-white/10">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Folder className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No projects yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">Create your first project to get started building amazing websites with AI.</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1"
                    >
                      Create Project
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                    {projects
                      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((project) => (
                        <ProjectCard
                          key={project.id}
                          id={project.id}
                          title={project.name}
                          lastEdited={new Date(project.updated_at).toLocaleDateString()}
                          status={project.status}
                          deploymentUrl={project.deployment_url}
                          customDomain={project.custom_domain}
                          codeContent={project.code_content}
                          onDelete={() => openDeleteModal(project.id)}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#151515] rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Create New Project</h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleCreateProject}>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Project Name
                      </label>
                      <input
                        name="name"
                        type="text"
                        required
                        placeholder="e.g., My Awesome Portfolio"
                        className="w-full px-5 py-3 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="px-8 py-3 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        {isCreating ? 'Creating...' : 'Create Project'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#151515] rounded-[32px] shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Delete Project?</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                This action cannot be undone. All data associated with this project will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3 font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/30 transition-all"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SidebarLink({ icon, label, active = false, collapsed = false }: { icon: React.ReactNode, label: string, active?: boolean, collapsed?: boolean }) {
  return (
    <div className={`group flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl cursor-pointer transition-all ${active
      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white font-medium'
      }`}>
      <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      <span className={`text-sm transition-all duration-300 ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>{label}</span>
      {active && !collapsed && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
      )}
    </div>
  )
}

// Backward compatibility if needed, though we replaced usages
const NavItem = SidebarLink;

function ProjectCard({ id, title, lastEdited, status, deploymentUrl, customDomain, codeContent, onDelete }: {
  id: string,
  title: string,
  lastEdited: string,
  status: string,
  deploymentUrl?: string,
  customDomain?: string,
  codeContent?: string,
  onDelete: () => void
}) {
  const router = useRouter()
  const [domainStatus, setDomainStatus] = useState<'none' | 'verifying' | 'active' | 'error'>('none')
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    if (customDomain) {
      const checkStatus = async () => {
        const result = await getDomainStatus(id)
        if (result.status) {
          setDomainStatus(result.status as any)
        }
      }
      checkStatus()
    }
  }, [customDomain, id])

  // Parse the HTML content for preview
  const previewHtml = (() => {
    if (!codeContent) return null
    try {
      const files = JSON.parse(codeContent)
      let html = files['index.html'] || null

      if (!html) return null

      // Inject CSS to hide error messages and improve rendering
      const styleInjection = `
        <style>
          /* Hide all error messages and console outputs */
          body { 
            overflow: hidden !important; 
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide common error elements */
          [class*="error"], 
          [id*="error"],
          .console,
          #console {
            display: none !important;
          }
          /* Ensure content fits */
          * {
            max-width: 100%;
            box-sizing: border-box;
          }
        </style>
      `

      // Insert style before closing head tag or at the beginning if no head
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${styleInjection}</head>`)
      } else if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${styleInjection}`)
      } else {
        html = styleInjection + html
      }

      return html
    } catch (error) {
      console.error('Error parsing preview HTML:', error)
      return null
    }
  })()

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative aspect-[4/3] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Website Preview Thumbnail Link */}
      <Link href={`/builder/${id}`} className="block h-1/2 bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 relative overflow-hidden shrink-0 cursor-pointer">
        {previewHtml ? (
          <div className="absolute inset-0 origin-top-left bg-white" style={{ transform: 'scale(0.25)', width: '400%', height: '400%' }}>
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-0 pointer-events-none"
              title={`Preview of ${title}`}
              sandbox="allow-same-origin allow-scripts"
              loading="lazy"
              style={{
                background: 'white',
                colorScheme: 'light'
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-400 dark:text-gray-600">
              <Layout className="w-8 h-8" />
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <button className="bg-white dark:bg-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100 pointer-events-none">
            Edit
          </button>
        </div>

        {deploymentUrl && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-green-500/10 backdrop-blur-md border border-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </div>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1 relative">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/builder/${id}`} className="font-bold text-sm truncate pr-2 hover:text-indigo-500 transition-colors block flex-1">
            {title}
          </Link>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl z-20 overflow-hidden"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                      onDelete()
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {customDomain && (
          <div className="mb-2">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md w-fit">
              <span className={`w-1.5 h-1.5 rounded-full ${domainStatus === 'active' ? 'bg-green-500' :
                domainStatus === 'verifying' ? 'bg-yellow-500' : 'bg-gray-400'
                } ${domainStatus !== 'none' ? 'animate-pulse' : ''}`} />
              <span className="truncate max-w-[120px]">{customDomain}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-white/5">
          <span className="text-xs text-gray-500">{lastEdited}</span>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${status === 'Live' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-[10px] font-medium text-gray-500 capitalize">{status}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
