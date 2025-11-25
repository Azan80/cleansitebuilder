'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Plus, Layout, Settings, User } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function BuilderPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    }
    checkUser()
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030712] flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 bg-[#0a0a0a] flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <Image src="/icon/project-initiation.png" alt="Logo" width={40} height={40} className="w-10 h-10" />
          <span className="font-bold text-white text-lg tracking-tight">Builder</span>
        </div>

        <div className="flex-1 p-4 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 text-white rounded-xl border border-white/10 hover:bg-white/10 transition-all group">
            <Plus className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="font-medium">New Project</span>
          </button>

          <div className="pt-6 pb-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Your Projects
          </div>
          
          {/* Placeholder Projects */}
          {['Portfolio Site', 'SaaS Landing', 'E-commerce Store'].map((project, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
              <Layout className="w-4 h-4" />
              <span>{project}</span>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-white truncate">{user?.email}</div>
              <div className="text-xs text-gray-500">Free Plan</div>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#030712] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div className="text-center max-w-lg">
            <Image src="/icon/project-initiation (1).png" alt="Logo" width={80} height={80} className="w-20 h-20 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to the Builder</h1>
            <p className="text-gray-400 mb-8 text-lg">
              Select a project from the sidebar or create a new one to start generating your Next.js website.
            </p>
            <button className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all shadow-lg shadow-white/10 flex items-center gap-2 mx-auto">
              <Plus className="w-5 h-5" />
              Create New Project
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
