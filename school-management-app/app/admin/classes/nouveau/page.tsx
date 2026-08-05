'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function NouvelleClassePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [level, setLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Le nom de la classe est requis.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, level: level.trim() || undefined }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error || 'Erreur lors de la création de la classe.')
        return
      }

      router.push('/admin/classes')
      router.refresh()
    } catch {
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/classes" className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nouvelle classe</h1>
          <p className="text-slate-500 text-sm">Ajouter une classe à votre établissement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom de la classe *</label>
          <input
            id="class-name-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ex: CM1 A, 6ème 2, Grande Section B"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Niveau (optionnel)</label>
          <input
            id="class-level-input"
            type="text"
            value={level}
            onChange={e => setLevel(e.target.value)}
            placeholder="ex: CM1, 6ème, Maternelle"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/classes"
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-medium rounded-xl transition text-sm">
            Annuler
          </Link>
          <button
            id="btn-submit-class"
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl transition shadow-sm text-sm"
          >
            {loading ? 'Création...' : 'Créer la classe'}
          </button>
        </div>
      </form>
    </div>
  )
}
