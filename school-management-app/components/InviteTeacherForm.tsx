'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, BookOpen, ChevronDown, Check, X, Search, School } from 'lucide-react'

interface ClassItem {
  id: string
  name: string
  level?: string
}

interface InviteTeacherFormProps {
  classes: ClassItem[]
}

const MOROCCAN_SUBJECTS = [
  'Mathématiques',
  'Physique-Chimie',
  'SVT (Sciences de la Vie et de la Terre)',
  'Langue Arabe',
  'Langue Française',
  'Langue Anglaise',
  'Histoire-Géographie',
  'Philosophie',
  'Éducation Islamique',
  'Économie Générale & Statistique',
  'Comptabilité & Organisation',
  'Informatique',
  'Éducation Physique et Sportive (EPS)',
]

export default function InviteTeacherForm({ classes }: InviteTeacherFormProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState(MOROCCAN_SUBJECTS[0])
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false)
  const [classSearchQuery, setClassSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const toggleClass = (classId: string) => {
    if (selectedClassIds.includes(classId)) {
      setSelectedClassIds(selectedClassIds.filter(id => id !== classId))
    } else {
      setSelectedClassIds([...selectedClassIds, classId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      setError('Veuillez remplir le nom et l\'email.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          subject,
          class_ids: selectedClassIds,
        }),
      })

      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error || 'Erreur lors de l\'ajout du professeur.')
        return
      }

      setSuccess(true)
      setFullName('')
      setEmail('')
      setSelectedClassIds([])
      router.refresh()
    } catch {
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  const filteredClasses = classes.filter(c =>
    c.name.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
    (c.level && c.level.toLowerCase().includes(classSearchQuery.toLowerCase()))
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 h-fit shadow-sm">
      <h2 className="font-extrabold text-slate-800 flex items-center gap-2 text-base">
        <UserPlus size={18} className="text-indigo-600" />
        Ajouter un professeur
      </h2>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          Professeur enregistré avec succès !
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nom complet */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
            Nom complet du professeur *
          </label>
          <input
            id="teacher-name-input"
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            placeholder="ex: Prof. Hassan El Amrani"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
            Email professionnel *
          </label>
          <input
            id="teacher-email-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="ex: hassan.elamrani@ecole.ma"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 🌟 MATIÈRE ENSEIGNÉE (PREDEFINED SELECT DROPDOWN) */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <BookOpen size={14} className="text-indigo-600" />
            Matière enseignée *
          </label>
          <select
            id="teacher-subject-select"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {MOROCCAN_SUBJECTS.map(sub => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* 🌟 CLASSES À AFFECTER (MULTI-SELECT COMBOBOX) */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <School size={14} className="text-indigo-600" />
            Classes à affecter ({selectedClassIds.length})
          </label>

          <div
            onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white min-h-[44px] flex items-center justify-between cursor-pointer flex-wrap gap-1.5"
          >
            <div className="flex flex-wrap items-center gap-1">
              {selectedClassIds.length === 0 ? (
                <span className="text-slate-400 text-xs font-medium">Sélectionner une ou plusieurs classes...</span>
              ) : (
                selectedClassIds.map(clsId => {
                  const cls = classes.find(c => c.id === clsId)
                  return (
                    <span
                      key={clsId}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 text-xs font-bold border border-indigo-200 inline-flex items-center gap-1"
                    >
                      🏫 {cls?.name || 'Classe'}
                      <X
                        size={12}
                        className="hover:text-red-600 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); toggleClass(clsId) }}
                      />
                    </span>
                  )
                })
              )}
            </div>
            <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
          </div>

          {/* Dropdown menu */}
          {isClassDropdownOpen && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2.5 space-y-2 animate-fadeIn max-h-60 overflow-y-auto">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={classSearchQuery}
                  onChange={e => setClassSearchQuery(e.target.value)}
                  placeholder="Rechercher une classe..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                {filteredClasses.length === 0 ? (
                  <p className="text-slate-400 text-xs p-2 text-center">Aucune classe trouvée</p>
                ) : (
                  filteredClasses.map(cls => {
                    const isSelected = selectedClassIds.includes(cls.id)
                    return (
                      <div
                        key={cls.id}
                        onClick={() => toggleClass(cls.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                          isSelected ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>🏫 {cls.name} {cls.level ? `[${cls.level}]` : ''}</span>
                        {isSelected && <Check size={16} className="text-indigo-600" />}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <button
          id="btn-add-teacher"
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold rounded-xl transition text-sm shadow-md"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer le professeur'}
        </button>
      </form>
    </div>
  )
}
