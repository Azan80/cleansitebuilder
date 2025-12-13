'use client'

import { createClient } from '@/utils/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, Lock, Mail, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVerifiedModal, setShowVerifiedModal] = useState(false)
  const [showNotVerifiedModal, setShowNotVerifiedModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || '/builder'
  const promptFromUrl = searchParams.get('prompt')
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // If user is already logged in and there's a prompt, create project
        if (promptFromUrl) {
          await handlePromptRedirect(user.id, promptFromUrl)
        } else {
          router.push(redirectUrl)
        }
      }
    }
    checkUser()

    if (searchParams.get('verified') === 'true') {
      setShowVerifiedModal(true)
      // Optional: Clean up URL
      // router.replace('/login') 
    }
  }, [router, supabase, redirectUrl, searchParams, promptFromUrl])

  const handlePromptRedirect = async (userId: string, prompt: string) => {
    try {
      // Generate project name with AI
      const { generateProjectName } = await import('@/app/actions/project-name-generator')
      const projectName = await generateProjectName(prompt)

      // Create project
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: projectName,
          description: prompt,
        })
        .select()
        .single()

      if (!error && project) {
        router.push(`/builder/${project.id}`)
      } else {
        router.push(redirectUrl)
      }
    } catch (err) {
      console.error('Error creating project from prompt:', err)
      router.push(redirectUrl)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setShowNotVerifiedModal(true)
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      // If there's a prompt, create project and redirect
      if (promptFromUrl && data.user) {
        await handlePromptRedirect(data.user.id, promptFromUrl)
      } else {
        router.push(redirectUrl)
      }
      router.refresh()
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    const nextUrl = promptFromUrl
      ? `${redirectUrl}?prompt=${encodeURIComponent(promptFromUrl)}`
      : redirectUrl

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <Image src="/icon/project-initiation (1).png" alt="Logo" width={48} height={48} className="w-12 h-12 group-hover:rotate-12 transition-transform" />
            <span className="font-bold text-white text-2xl tracking-tight">CleanSiteBuilder</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-gray-400">Sign in to your account to continue building.</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {promptFromUrl && (
            <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-300 mb-1">Your project is ready!</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    After login, we'll create: <span className="text-white font-medium">"{promptFromUrl}"</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold rounded-xl py-3 hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0a0a0a] text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-[#111] border border-white/10 text-white font-medium rounded-xl py-3 hover:bg-[#1a1a1a] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link
              href={promptFromUrl ? `/signup?prompt=${encodeURIComponent(promptFromUrl)}` : '/signup'}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </motion.div>


      {/* Verified Success Modal */}
      <AnimatePresence>
        {showVerifiedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowVerifiedModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Email Verified!</h3>
              <p className="text-gray-400 mb-6">
                Your account has been successfully verified. You can now sign in.
              </p>
              <button
                onClick={() => setShowVerifiedModal(false)}
                className="w-full bg-white text-black font-bold rounded-xl py-3 hover:bg-gray-200 transition-all"
              >
                Continue to Login
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Not Verified Modal */}
      <AnimatePresence>
        {showNotVerifiedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowNotVerifiedModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl text-center"
            >
              <button
                onClick={() => setShowNotVerifiedModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Not Verified</h3>
              <p className="text-gray-400 mb-6">
                Your email address has not been verified yet. Please check your inbox for the verification link.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setShowNotVerifiedModal(false)}
                  className="w-full bg-white text-black font-bold rounded-xl py-3 hover:bg-gray-200 transition-all"
                >
                  Okay, I'll check
                </button>
                {/* Optional: Add Resend Link button logic here if needed */}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
