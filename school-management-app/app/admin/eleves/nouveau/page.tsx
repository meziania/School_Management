'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NouveauElevePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultClassId = searchParams.get('class_id') || ''

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [classId, setClassId] = useState(defaultClassId)
  const [birthDate, setBirthDate] = useState('')
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/classes')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setClasses(data.data)
          if (!classId && data.data.length > 0) {
            setClassId(data.data[0].id)
          }
        }
      })
      .catch(() => {})
  }, [classId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError('Le prénom et le nom sont requis.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          class_id: classId || undefined,
          birth_date: birthDate || undefined,
        }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error || 'Erreur lors de la création de l\'élève.')
        return
      }

      router.push('/admin/eleves')
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
        <Link href="/admin/eleves" className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nouvel élève</h1>
          <p className="text-slate-500 text-sm">Inscrire un élève dans votre établissement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Prénom *</label>
            <input
              id="student-firstname-input"
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="ex: Lucas"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom *</label>
            <input
              id="student-lastname-input"
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="ex: Dupont"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Classe</label>
          <select
            id="student-class-select"
            value={classId}
            onChange={e => setClassId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner une classe</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Date de naissance</label>
          <input
            id="student-birthdate-input"
            type="date"
            value={birthDate}
            onChange={e => setBirthDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/eleves"
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-medium rounded-xl transition text-sm">
            Annuler
          </Link>
          <button
            id="btn-submit-student"
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl transition shadow-sm text-sm"
          >
            {loading ? 'Inscription...' : 'Inscrire l\'élève'}
          </button>
        </div>
      </form>
    </div>
  )
}
