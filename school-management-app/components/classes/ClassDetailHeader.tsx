'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit, X, BookOpen, CheckCircle2 } from 'lucide-react'
import { MoroccanFiliere } from '@/types/app'

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

const FILIERE_OPTIONS_FOR_TRONC_COMMUN: MoroccanFiliere[] = [
  'Tronc Commun Scientifique' as MoroccanFiliere,
  'Tronc Commun Lettres et Sciences Humaines' as MoroccanFiliere,
]

const FILIERE_OPTIONS_FOR_BAC: MoroccanFiliere[] = [
  'Sciences Mathématiques A' as MoroccanFiliere,
  'Sciences Mathématiques B' as MoroccanFiliere,
  'Sciences Physiques' as MoroccanFiliere,
  'SVT (Sciences de la Vie et de la Terre)' as MoroccanFiliere,
  'Sciences Économiques et Gestion' as MoroccanFiliere,
  'Sciences et Technologies Électriques' as MoroccanFiliere,
  'Sciences et Technologies Mécaniques' as MoroccanFiliere,
  'Lettres et Sciences Humaines' as MoroccanFiliere,
]

interface ClassDetailHeaderProps {
  cls: {
    id: string
    name: string
    level?: string | null
    filiere?: string | null
  }
}

export default function ClassDetailHeader({ cls: initialClass }: ClassDetailHeaderProps) {
  const router = useRouter()
  const [cls, setCls] = useState(initialClass)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(cls.name)
  const [editLevel, setEditLevel] = useState(cls.level || '2BAC')
  const [editFiliere, setEditFiliere] = useState<string>(cls.filiere || 'Sciences Mathématiques A')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const isHighSchoolCycle = useMemo(() => {
    return ['TCS', '1BAC', '2BAC'].includes(editLevel)
  }, [editLevel])

  const availableFilieres = useMemo(() => {
    if (editLevel === 'TCS') return FILIERE_OPTIONS_FOR_TRONC_COMMUN
    if (editLevel === '1BAC' || editLevel === '2BAC') return FILIERE_OPTIONS_FOR_BAC
    return []
  }, [editLevel])

  const handleLevelChange = (newLevel: string) => {
    setEditLevel(newLevel)
    if (['TCS', '1BAC', '2BAC'].includes(newLevel)) {
      if (newLevel === 'TCS') setEditFiliere(FILIERE_OPTIONS_FOR_TRONC_COMMUN[0])
      else setEditFiliere(FILIERE_OPTIONS_FOR_BAC[0])
    } else {
      setEditFiliere('')
    }
  }

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) {
      setError('Le nom de la classe est requis.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cls.id,
          name: editName.trim(),
          level: editLevel,
          filiere: isHighSchoolCycle ? editFiliere : null,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error || 'Erreur lors de la modification.')
        return
      }

      setCls({
        ...cls,
        name: editName.trim(),
        level: editLevel,
        filiere: isHighSchoolCycle ? editFiliere : null,
      })

      setSuccessMsg('Classe mise à jour avec succès !')
      setTimeout(() => setSuccessMsg(null), 4000)
      setIsEditing(false)
      router.refresh()
    } catch {
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/classes" className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{cls.name}</h1>
              <button
                type="button"
                onClick={() => {
                  setEditName(cls.name)
                  setEditLevel(cls.level || '2BAC')
                  setEditFiliere(cls.filiere || 'Sciences Mathématiques A')
                  setIsEditing(true)
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition border border-blue-200"
              >
                <Edit size={13} />
                Modifier
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {cls.level && (
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  Niveau : {cls.level}
                </span>
              )}
              {cls.filiere && (
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100">
                  Filière : {cls.filiere}
                </span>
              )}
            </div>
          </div>
        </div>

        <Link
          href={`/admin/eleves/nouveau?class_id=${cls.id}`}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-md text-sm"
        >
          <Plus size={16} />
          Ajouter un élève
        </Link>
      </div>

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden space-y-4">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-lg">Modifier la classe</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateClass} className="p-5 space-y-4">
              {/* Nom de la classe */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom de la classe *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="ex: 2BAC Sciences Math A"
                  required
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Niveau Pédagogique */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Niveau Pédagogique *</label>
                <select
                  value={editLevel}
                  onChange={e => handleLevelChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              </div>

              {/* Filière / Branche (Lycée) */}
              {isHighSchoolCycle && (
                <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 space-y-1">
                  <label className="block text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-blue-600" />
                    Filière / Branche du Lycée *
                  </label>
                  <select
                    value={editFiliere}
                    onChange={e => setEditFiliere(e.target.value)}
                    required={isHighSchoolCycle}
                    className="w-full px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {availableFilieres.map(f => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
