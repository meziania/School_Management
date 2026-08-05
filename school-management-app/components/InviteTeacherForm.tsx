'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, BookOpen, ChevronDown, Check, X, Search, School, Plus, Settings, Edit2, Trash2 } from 'lucide-react'

interface ClassItem {
  id: string
  name: string
  level?: string
}

interface InviteTeacherFormProps {
  classes: ClassItem[]
}

const DEFAULT_MOROCCAN_SUBJECTS = [
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

  // 🌟 CREATABLE SUBJECTS STATE
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(DEFAULT_MOROCCAN_SUBJECTS)
  const [subject, setSubject] = useState(DEFAULT_MOROCCAN_SUBJECTS[0])
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false)
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('')
  const subjectDropdownRef = useRef<HTMLDivElement>(null)

  // 🌟 SUBJECT MANAGEMENT MODAL STATE
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [editingSubjectIndex, setEditingSubjectIndex] = useState<number | null>(null)
  const [editingSubjectText, setEditingSubjectText] = useState('')
  const [newSubjectInput, setNewSubjectInput] = useState('')
  const [modalSearchQuery, setModalSearchQuery] = useState('')

  // CLASSES MULTI-SELECT STATE
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false)
  const [classSearchQuery, setClassSearchQuery] = useState('')
  const classDropdownRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Handle Creating a New Custom Subject
  const handleCreateNewSubject = (newSub: string) => {
    const trimmed = newSub.trim()
    if (!trimmed) return

    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1)

    if (!availableSubjects.some(s => s.toLowerCase() === formatted.toLowerCase())) {
      setAvailableSubjects(prev => [...prev, formatted])
    }
    setSubject(formatted)
    setSubjectSearchQuery('')
    setIsSubjectDropdownOpen(false)
  }

  // Manage Modal: Add Subject
  const handleAddSubjectFromModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubjectInput.trim()) return
    const formatted = newSubjectInput.trim().charAt(0).toUpperCase() + newSubjectInput.trim().slice(1)

    if (!availableSubjects.some(s => s.toLowerCase() === formatted.toLowerCase())) {
      setAvailableSubjects(prev => [...prev, formatted])
      setNewSubjectInput('')
    }
  }

  // Manage Modal: Save Edit Subject
  const handleSaveEditSubject = (index: number) => {
    if (!editingSubjectText.trim()) return
    const formatted = editingSubjectText.trim().charAt(0).toUpperCase() + editingSubjectText.trim().slice(1)
    const oldSubject = availableSubjects[index]

    setAvailableSubjects(prev => prev.map((s, idx) => idx === index ? formatted : s))
    if (subject === oldSubject) {
      setSubject(formatted)
    }
    setEditingSubjectIndex(null)
    setEditingSubjectText('')
  }

  // Manage Modal: Delete Subject
  const handleDeleteSubject = (targetSub: string) => {
    if (availableSubjects.length <= 1) {
      alert('Vous devez conserver au moins une matière dans le catalogue.')
      return
    }

    if (confirm(`Voulez-vous vraiment supprimer la matière "${targetSub}" du catalogue ?`)) {
      const updated = availableSubjects.filter(s => s !== targetSub)
      setAvailableSubjects(updated)
      if (subject === targetSub) {
        setSubject(updated[0])
      }
    }
  }

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

  const filteredSubjects = availableSubjects.filter(s =>
    s.toLowerCase().includes(subjectSearchQuery.toLowerCase())
  )

  const hasExactSubjectMatch = availableSubjects.some(
    s => s.toLowerCase() === subjectSearchQuery.trim().toLowerCase()
  )

  const modalFilteredSubjects = availableSubjects.filter(s =>
    s.toLowerCase().includes(modalSearchQuery.toLowerCase())
  )

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

        {/* 🌟 CREATABLE MATIÈRE ENSEIGNÉE COMBOBOX + MANAGE BUTTON */}
        <div className="relative" ref={subjectDropdownRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen size={14} className="text-indigo-600" />
              Matière enseignée *
            </label>
            <button
              type="button"
              onClick={() => setIsManageModalOpen(true)}
              className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 transition"
            >
              <Settings size={13} />
              Gérer
            </button>
          </div>

          <div
            onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white min-h-[44px] flex items-center justify-between cursor-pointer text-sm font-bold text-slate-900 shadow-2xs"
          >
            <span>{subject}</span>
            <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
          </div>

          {/* Creatable Dropdown Menu */}
          {isSubjectDropdownOpen && (
            <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2.5 space-y-2 animate-fadeIn max-h-72 overflow-y-auto">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={subjectSearchQuery}
                  onChange={e => setSubjectSearchQuery(e.target.value)}
                  placeholder="Rechercher ou créer une matière..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Option to create a new custom subject if not matched */}
              {subjectSearchQuery.trim() && !hasExactSubjectMatch && (
                <div
                  onClick={() => handleCreateNewSubject(subjectSearchQuery)}
                  className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-extrabold flex items-center gap-2 cursor-pointer transition border border-indigo-200"
                >
                  <Plus size={16} className="text-indigo-600 flex-shrink-0" />
                  <span>Créer la matière <span className="underline">"{subjectSearchQuery.trim()}"</span></span>
                </div>
              )}

              {/* List of existing subjects */}
              <div className="space-y-1">
                {filteredSubjects.map(sub => {
                  const isSelected = subject === sub
                  return (
                    <div
                      key={sub}
                      onClick={() => {
                        setSubject(sub)
                        setIsSubjectDropdownOpen(false)
                        setSubjectSearchQuery('')
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition ${
                        isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span>{sub}</span>
                      {isSelected && <Check size={16} className="text-white" />}
                    </div>
                  )
                })}
              </div>

              {/* Manage Subjects Footer Action */}
              <div
                onClick={() => {
                  setIsSubjectDropdownOpen(false)
                  setIsManageModalOpen(true)
                }}
                className="pt-2 border-t border-slate-100 text-center text-xs font-extrabold text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center justify-center gap-1.5 transition"
              >
                <Settings size={13} />
                <span>Gérer le catalogue des matières</span>
              </div>
            </div>
          )}
        </div>

        {/* 🌟 CLASSES À AFFECTER (MULTI-SELECT COMBOBOX) */}
        <div className="relative" ref={classDropdownRef}>
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

      {/* 🌟 SUBJECT MANAGEMENT MODAL (GESTION DU CATALOGUE DES MATIÈRES) */}
      {isManageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  <BookOpen size={18} />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Gestion du Catalogue des Matières</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {/* Form to quick-add subject */}
              <form onSubmit={handleAddSubjectFromModal} className="flex gap-2">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={e => setNewSubjectInput(e.target.value)}
                  placeholder="Ajouter une nouvelle matière..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1"
                >
                  <Plus size={15} />
                  <span>Ajouter</span>
                </button>
              </form>

              {/* Filter search input */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={e => setModalSearchQuery(e.target.value)}
                  placeholder="Rechercher une matière dans le catalogue..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              {/* Subjects Master List */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {modalFilteredSubjects.length === 0 ? (
                  <p className="p-4 text-center text-slate-400 text-xs italic">Aucune matière trouvée.</p>
                ) : (
                  modalFilteredSubjects.map((sub) => {
                    const originalIndex = availableSubjects.indexOf(sub)
                    const isEditing = editingSubjectIndex === originalIndex

                    return (
                      <div key={sub} className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50 transition">
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingSubjectText}
                              onChange={e => setEditingSubjectText(e.target.value)}
                              className="px-3 py-1 bg-white border border-indigo-400 rounded-lg text-xs font-bold flex-1 text-slate-900 focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditSubject(originalIndex)}
                              className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition"
                            >
                              Valider
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSubjectIndex(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-xs">{sub}</span>
                              {subject === sub && (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold border border-indigo-100">
                                  Sélectionnée
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubjectIndex(originalIndex)
                                  setEditingSubjectText(sub)
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                title="Modifier"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubject(sub)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-500 transition"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
