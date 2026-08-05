'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AjouterNotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultStudentId = searchParams.get('student_id') || ''

  const [studentId, setStudentId] = useState(defaultStudentId)
  const [subject, setSubject] = useState('')
  const [score, setScore] = useState('')
  const [coefficient, setCoefficient] = useState('1')
  const [term, setTerm] = useState('1')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [comment, setComment] = useState('')
  const [students, setStudents] = useState<{ id: string; first_name: string; last_name: string; classes?: { name: string } }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/students')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setStudents(data.data)
          if (!studentId && data.data.length > 0) {
            setStudentId(data.data[0].id)
          }
        }
      })
      .catch(() => {})
  }, [studentId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !score || !studentId) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }

    const numScore = parseFloat(score)
    if (isNaN(numScore) || numScore < 0 || numScore > 20) {
      setError('La note doit être comprise entre 0 et 20.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          subject: subject.trim(),
          score: numScore,
          coefficient: parseFloat(coefficient) || 1,
          term: parseInt(term) as 1 | 2 | 3,
          date,
          comment: comment.trim() || undefined,
        }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error || 'Erreur lors de l\'ajout de la note.')
        return
      }

      router.push(`/admin/notes?student_id=${studentId}`)
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
        <Link href="/admin/notes" className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ajouter une note</h1>
          <p className="text-slate-500 text-sm">Saisir une évaluation pour un élève</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Élève *</label>
          <select
            id="grade-student-select"
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sélectionner un élève</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.last_name} {s.first_name} — {(s.classes as any)?.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Matière *</label>
            <input
              id="grade-subject-input"
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="ex: Mathématiques"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Note sur 20 *</label>
            <input
              id="grade-score-input"
              type="number"
              step="0.25"
              min="0"
              max="20"
              value={score}
              onChange={e => setScore(e.target.value)}
              placeholder="ex: 15.5"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Coeff.</label>
            <input
              id="grade-coeff-input"
              type="number"
              min="0.5"
              step="0.5"
              value={coefficient}
              onChange={e => setCoefficient(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Trimestre</label>
            <select
              id="grade-term-select"
              value={term}
              onChange={e => setTerm(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Trimestre 1</option>
              <option value="2">Trimestre 2</option>
              <option value="3">Trimestre 3</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
            <input
              id="grade-date-input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Commentaire (optionnel)</label>
          <input
            id="grade-comment-input"
            type="text"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="ex: Bon travail, à poursuivre"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/notes"
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-medium rounded-xl transition text-sm">
            Annuler
          </Link>
          <button
            id="btn-submit-grade"
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl transition shadow-sm text-sm"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer la note'}
          </button>
        </div>
      </form>
    </div>
  )
}
