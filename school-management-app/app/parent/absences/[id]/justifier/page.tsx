'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, ArrowLeft, CheckCircle } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default function JustifierAbsencePage({ params }: Props) {
  const router = useRouter()
  const [justification, setJustification] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!justification.trim()) {
      setError('Veuillez saisir une justification.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const resolvedParams = await params
      const formData = new FormData()
      formData.append('attendance_id', resolvedParams.id)
      formData.append('justification', justification)
      if (file) formData.append('file', file)

      const res = await fetch('/api/justifications', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error || 'Erreur lors de l\'envoi.')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/parent/presence'), 2000)
    } catch {
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <CheckCircle className="text-green-500 mx-auto mb-3" size={40} />
          <h2 className="font-semibold text-slate-900 mb-2">Justificatif envoyé</h2>
          <p className="text-slate-500 text-sm">L'administration a été notifiée. Redirection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/parent/presence"
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Justifier une absence</h1>
          <p className="text-slate-500 text-sm">Envoyez un justificatif à l'administration</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Motif de l'absence *
          </label>
          <textarea
            id="justification-text"
            value={justification}
            onChange={e => setJustification(e.target.value)}
            placeholder="Maladie, rendez-vous médical, raison familiale..."
            rows={3}
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Justificatif (optionnel — PDF, image)
          </label>
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-slate-200
                       rounded-xl hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition"
          >
            <Upload className="text-slate-400" size={24} />
            <span className="text-slate-500 text-sm">
              {file ? file.name : 'Cliquez pour choisir un fichier'}
            </span>
            <span className="text-slate-400 text-xs">PDF, JPG, PNG — max 5 Mo</span>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          id="btn-submit-justification"
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50
                     text-white font-medium rounded-xl transition shadow-sm"
        >
          {loading ? 'Envoi en cours...' : 'Envoyer le justificatif'}
        </button>
      </form>
    </div>
  )
}
