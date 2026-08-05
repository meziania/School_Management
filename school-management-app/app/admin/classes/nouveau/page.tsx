'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, School, Award } from 'lucide-react'

const MOROCCAN_LEVEL_OPTIONS = [
  { group: 'Cycle Primaire', items: [
    { value: '1AP', label: '1ère Année Primaire (1AP)' },
    { value: '2AP', label: '2ème Année Primaire (2AP)' },
    { value: '3AP', label: '3ème Année Primaire (3AP)' },
    { value: '4AP', label: '4ème Année Primaire (4AP)' },
    { value: '5AP', label: '5ème Année Primaire (5AP)' },
    { value: '6AP', label: '6ème Année Primaire (6AP — Examen Normalisé Provincial)' },
  ]},
  { group: 'Cycle Collégial', items: [
    { value: '1AC', label: '1ère Année Collège (1AC)' },
    { value: '2AC', label: '2ème Année Collège (2AC)' },
    { value: '3AC', label: '3ème Année Collège (3AC — Examen Normalisé Régional)' },
  ]},
  { group: 'Cycle Qualifiant (Lycée)', items: [
    { value: 'TCS', label: 'Tronc Commun (TCS)' },
    { value: '1BAC', label: '1ère Année Baccalauréat (1BAC — Examen Régional)' },
    { value: '2BAC', label: '2ème Année Baccalauréat (2BAC — Examen National)' },
  ]},
]

export default function NouvelleClassePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [level, setLevel] = useState('2BAC')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Le nom de la classe est requis.')
      return
    }
    if (!level) {
      setError('Le niveau pédagogique est obligatoire.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), level }),
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
          <p className="text-slate-500 text-sm">Définir une classe et son niveau du système marocain</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">Nom de la classe *</label>
          <input
            id="class-name-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ex: 2BAC Sciences Math A, 3AC 1, 6AP B"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center justify-between">
            <span>Niveau Pédagogique *</span>
            <span className="text-xs text-blue-600 font-normal">Détermine les examens applicables</span>
          </label>
          <select
            id="class-level-select"
            value={level}
            onChange={e => setLevel(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MOROCCAN_LEVEL_OPTIONS.map(grp => (
              <optgroup key={grp.group} label={grp.group}>
                {grp.items.map(item => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="text-slate-400 text-xs mt-1.5">
            💡 Les classes de certification (6AP, 3AC, 1BAC, 2BAC) débloquent les vues d'examens normalisés et nationaux.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/classes"
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-semibold rounded-xl transition text-sm">
            Annuler
          </Link>
          <button
            id="btn-submit-class"
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-sm text-sm"
          >
            {loading ? 'Création...' : 'Créer la classe'}
          </button>
        </div>
      </form>
    </div>
  )
}
