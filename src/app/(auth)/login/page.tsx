'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router  = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      {/* Window Chrome Card */}
      <div className="window-chrome">
        {/* Title bar */}
        <div className="window-title-bar-blue">
          <span className="window-dot" />
          <span className="window-dot" />
          <span className="window-dot-filled" />
          <span className="label-caps text-white ml-2">EDT.SALES.EXE</span>
        </div>

        {/* Logo + Content */}
        <div className="bg-[#0A0A0A] p-8 flex flex-col gap-6">
          {/* Logo */}
          <div className="flex justify-center pt-2">
            <Image
              src="/images/EDT-lockup-dark.svg"
              alt="Experiential Design Team"
              width={160}
              height={37}
              priority
            />
          </div>

          {/* Eyebrow */}
          <div className="text-center">
            <span className="label-caps text-[#8C8C8C]">Sales Funnel 2026</span>
          </div>

          {/* Divider */}
          <div className="border-t border-[#333]" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="label-caps text-[#8C8C8C] text-[10px]">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@weareedt.com"
                required
                className="bg-[#111] border border-[#333] text-white px-3 py-2.5 text-sm
                  placeholder:text-[#444] focus:border-[#2D2DFF] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="label-caps text-[#8C8C8C] text-[10px]">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-[#111] border border-[#333] text-white px-3 py-2.5 text-sm
                  placeholder:text-[#444] focus:border-[#2D2DFF] transition-colors"
              />
            </div>

            {error && (
              <div className="border border-red-500 bg-red-950/20 px-3 py-2">
                <p className="text-red-400 text-xs font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#2D2DFF] hover:bg-[#0000CC] text-white label-caps
                py-3 px-6 mt-2 cursor-pointer transition-colors disabled:opacity-50
                disabled:cursor-not-allowed"
            >
              {loading ? 'SIGNING IN...' : 'SIGN IN →'}
            </button>
          </form>
        </div>

        {/* Footer bar */}
        <div className="window-title-bar-surface">
          <span className="label-caps text-[#8C8C8C] text-[10px] ml-6">
            Experiential Design Team · Internal Tool
          </span>
        </div>
      </div>
    </div>
  )
}
