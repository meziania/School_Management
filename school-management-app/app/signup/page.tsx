'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signupSchoolSchema } from '@/lib/validations/schemas'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    school_name: '',
    subdomain: '',
    admin_email: '',
    admin_password: '',
    admin_full_name: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Auto-générer le subdomain depuis le nom
    if (name === 'school_name') {
      const sub = value
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50)
      setFormData(prev => ({ ...prev, school_name: value, subdomain: sub }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = signupSchoolSchema.safeParse(formData)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup-school', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error || 'Erreur lors de l\'inscription.')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">École créée !</h2>
        <p className="text-blue-300">Redirection vers la connexion...</p>
      </div>
    )
  }

  const fields = [
    { name: 'school_name', label: 'Nom de l\'école', placeholder: 'École Primaire Les Acacias', type: 'text' },
    { name: 'subdomain', label: 'Identifiant unique (sous-domaine)', placeholder: 'ecole-les-acacias', type: 'text' },
    { name: 'admin_full_name', label: 'Votre nom complet', placeholder: 'Marie Dupont', type: 'text' },
    { name: 'admin_email', label: 'Email administrateur', placeholder: 'direction@ecole.fr', type: 'email' },
    { name: 'admin_password', label: 'Mot de passe (min. 8 caractères)', placeholder: '••••••••', type: 'password' },
  ]

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-2">Créer l&apos;espace de votre école</h2>
      <p className="text-blue-300 text-sm mb-6">Essai gratuit 30 jours — sans carte bancaire</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ name, label, placeholder, type }) => (
          <div key={name}>
            <label htmlFor={name} className="block text-sm font-medium text-blue-200 mb-1.5">
              {label}
            </label>
            <input
              id={name}
              name={name}
              type={type}
              value={formData[name as keyof typeof formData]}
              onChange={handleChange}
              placeholder={placeholder}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/50
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        ))}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
            {error}
          </div>
        )}

        <button
          id="btn-signup"
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50
                     text-white font-semibold transition-all duration-200 shadow-lg shadow-blue-600/30
                     hover:shadow-blue-500/40 active:scale-[0.98] mt-2"
        >
          {loading ? 'Création en cours...' : 'Créer mon espace école →'}
        </button>
      </form>

      <p className="text-center text-blue-300 text-sm mt-6">
        Déjà inscrit ?{' '}
        <Link href="/login" className="text-blue-400 hover:text-white font-medium transition">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
