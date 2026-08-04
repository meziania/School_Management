'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/validations/schemas'
import type { Metadata } from 'next'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message)
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    // Routing par rôle
    const role = data.user?.user_metadata?.role
    if (role === 'school_admin') {
      router.push('/admin/dashboard')
    } else if (role === 'parent') {
      router.push('/parent/dashboard')
    } else if (role === 'super_admin') {
      router.push('/super-admin')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-6">Connexion</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="votre@email.fr"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/50
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-1.5">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/50
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
            {error}
          </div>
        )}

        <button
          id="btn-login"
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50
                     text-white font-semibold transition-all duration-200 shadow-lg shadow-blue-600/30
                     hover:shadow-blue-500/40 active:scale-[0.98]"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="text-center text-blue-300 text-sm mt-6">
        Vous êtes une école ?{' '}
        <Link href="/signup" className="text-blue-400 hover:text-white font-medium transition">
          Créer un espace
        </Link>
      </p>
    </div>
  )
}
