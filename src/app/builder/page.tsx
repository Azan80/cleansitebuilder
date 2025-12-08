'use client'

import { getDomainStatus } from '@/app/actions/deploy-actions'
import { createProject, deleteProject, getProjects } from '@/app/actions/project-actions'
import { ThemeToggle } from '@/components/ThemeToggle'
import { createClient } from '@/utils/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  ChevronRight,
  Crown,
  Folder,
  Layout,
  Loader2,
  LogOut,
  MoreVertical,
  Plus,
  Search,
  Settings, Trash2, User,
  X,
  Zap
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
          const plan = profile.subscription_plan || 'Free'
          const limit = plan === 'Pro' ? 250 : plan === 'Starter' ? 100 : 5
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#030712] flex text-gray-900 dark:text-white transition-colors duration-300">
      {/* Compact Sidebar */}
      <div
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'
          } border-r border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] flex flex-col transition-all duration-300 z-20 relative hidden md:flex`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-full flex items-center justify-center text-gray-500 hover:text-indigo-600 dark:hover:text-white transition-colors shadow-sm z-30"
        >
          <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${!isSidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'px-6'} border-b border-gray-200 dark:border-white/10 transition-all duration-300`}>
          <div className="flex items-center gap-3">
            <Image src="/icon/project-initiation (1).png" alt="Logo" width={24} height={24} className="w-6 h-6 shrink-0" />
            <span className={`font-bold text-lg tracking-tight transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>Builder</span>
          </div>
        </div>

        <div className="flex-1 py-4 space-y-1 px-3">
          <div className="mb-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-2 px-3'} py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm shadow-indigo-500/20 text-sm font-medium overflow-hidden`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>New Project</span>
            </button>
          </div>

          <NavItem icon={<Layout className="w-4 h-4" />} label="Dashboard" active collapsed={isSidebarCollapsed} />
          <NavItem icon={<Folder className="w-4 h-4" />} label="Projects" collapsed={isSidebarCollapsed} />
          <NavItem icon={<User className="w-4 h-4" />} label="Team" collapsed={isSidebarCollapsed} />
          <NavItem icon={<Settings className="w-4 h-4" />} label="Settings" collapsed={isSidebarCollapsed} />
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-white/10">
          <div className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer group ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className={`flex-1 overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
              <div className="text-xs font-medium truncate">{user?.email}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                {subscription?.status === 'active' ? (
                  <>
                    {subscription.plan === 'Pro' ? <Crown className="w-3 h-3 text-purple-400" /> : <Zap className="w-3 h-3 text-blue-400" />}
                    {subscription.plan} Plan
                  </>
                ) : (
                  'Free Plan'
                )}
              </div>
            </div>
            <LogOut
              onClick={handleSignOut}
              className={`w-4 h-4 text-gray-400 hover:text-red-500 transition-colors shrink-0 ${isSidebarCollapsed ? 'hidden' : 'block'}`}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 dark:border-white/10 bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-xl flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors">Home</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 dark:text-white font-medium">Dashboard</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-gray-100 dark:bg-white/5 border border-transparent focus:border-indigo-500 rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-[10px] bg-gray-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500">⌘K</span>
              </div>
            </div>

            <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-2" />

            <ThemeToggle />

            {/* Subscription Badge */}
            {subscription?.status === 'active' ? (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                {subscription.plan === 'Pro' ? <Crown className="w-4 h-4 text-purple-400" /> : <Zap className="w-4 h-4 text-blue-400" />}
                <span className="text-xs font-medium text-purple-400">{subscription.plan}</span>
                <span className="text-[10px] text-gray-400">{subscription.generationCount}/{subscription.generationLimit}</span>
              </div>
            ) : (
              <Link
                href="/pricing"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Zap className="w-3 h-3" />
                Upgrade
              </Link>
            )}

            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0a0a0a]" />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.user_metadata?.first_name || 'Builder'}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Here's what's happening with your projects today.</p>
              </div>
              <div className="flex gap-2">
                <select className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500 transition-colors">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">Recent Projects</h2>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Create New Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                className="group relative aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-indigo-500 dark:hover:border-indigo-500/50 bg-gray-50 dark:bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="font-medium text-sm">Create New Project</span>
              </motion.div>

              {/* Project Cards */}
              {projects.map((project) => (
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
          </div>
        </main>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white dark:bg-[#111] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Create New Project</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Project Name</label>
                    <input
                      name="name"
                      type="text"
                      required
                      placeholder="My Awesome Website"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Description (Optional)</label>
                    <textarea
                      name="description"
                      rows={3}
                      placeholder="A brief description of your project..."
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Project'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#111] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden p-6"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-4 text-red-600 dark:text-red-500">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Delete Project?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete this project? This action cannot be undone and all data will be lost.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NavItem({ icon, label, active = false, collapsed = false }: { icon: React.ReactNode, label: string, active?: boolean, collapsed?: boolean }) {
  return (
    <div className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-lg cursor-pointer transition-all ${active
      ? 'bg-gray-100 dark:bg-white/10 text-indigo-600 dark:text-white font-medium'
      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
      }`}>
      {icon}
      <span className={`text-sm transition-all duration-300 ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>{label}</span>
      {active && !collapsed && <div className="ml-auto w-1 h-1 rounded-full bg-indigo-600" />}
    </div>
  )
}

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
      return files['index.html'] || null
    } catch {
      return null
    }
  })()

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => router.push(`/builder/${id}`)}
      onMouseLeave={() => setShowMenu(false)}
      className="group relative aspect-[4/3] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
    >
      {/* Website Preview Thumbnail */}
      <div className="h-1/2 bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 relative overflow-hidden shrink-0">
        {previewHtml ? (
          <div className="absolute inset-0 origin-top-left" style={{ transform: 'scale(0.25)', width: '400%', height: '400%' }}>
            <iframe
              srcDoc={previewHtml}
              className="w-full h-full border-0 pointer-events-none"
              title={`Preview of ${title}`}
              sandbox="allow-same-origin"
              loading="lazy"
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
          <button className="bg-white dark:bg-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100">
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
      </div>

      <div className="p-4 flex flex-col flex-1 relative">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-sm truncate pr-2">{title}</h3>
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
                    onClick={() => {
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
