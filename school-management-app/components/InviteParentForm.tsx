'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { UserPlus, Search, ChevronDown, Check } from 'lucide-react'

interface StudentOption {
  id: string
  first_name: string
  last_name: string
  classes?: { name?: string } | null
}

export default function InviteParentForm({
  students,
  defaultStudentId = '',
}: {
  students: StudentOption[]
  defaultStudentId?: string
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState(defaultStudentId)
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Find selected student object
  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId)
  }, [students, selectedStudentId])

  // Filter students dynamically based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    const query = searchQuery.toLowerCase()
    return students.filter(s => {
      const fullNameStr = `${s.first_name} ${s.last_name}`.toLowerCase()
      const reverseFullNameStr = `${s.last_name} ${s.first_name}`.toLowerCase()
      const classNameStr = (s.classes?.name || '').toLowerCase()
      return fullNameStr.includes(query) || reverseFullNameStr.includes(query) || classNameStr.includes(query)
    })
  }, [students, searchQuery])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-fit shadow-sm">
      <h2 className="font-semibold text-slate-800 flex items-center gap-2">
        <UserPlus size={18} className="text-purple-600" />
        Inviter un parent
      </h2>

      <form action="/api/admin/parents/invite" method="post" className="space-y-4">
        {/* Hidden student_id input for form submission */}
        <input type="hidden" name="student_id" value={selectedStudentId} required />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom complet du parent *</label>
          <input
            id="parent-name-input"
            name="full_name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            placeholder="ex: Marc Dupont"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email du parent *</label>
          <input
            id="parent-email-input"
            type="email"
            name="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="ex: parent@email.fr"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
          />
        </div>

        {/* 🌟 Custom Searchable Select (Combobox) for Student */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Élève associé *</label>
          
          {/* Dropdown Toggle Button */}
          <div
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-white flex items-center justify-between transition cursor-pointer ${
              isOpen
                ? 'border-purple-500 ring-2 ring-purple-500/20 text-slate-900'
                : 'border-slate-200 text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="truncate">
              {selectedStudent
                ? `${selectedStudent.last_name} ${selectedStudent.first_name} ${selectedStudent.classes?.name ? `(${selectedStudent.classes.name})` : ''}`
                : 'Sélectionner un élève...'}
            </span>
            <ChevronDown size={16} className="text-slate-400 flex-shrink-0 ml-2" />
          </div>

          {/* Searchable Dropdown Menu */}
          {isOpen && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Search Bar inside Menu */}
              <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                <Search size={16} className="text-slate-400 ml-1 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tapez le nom de l'élève..."
                  autoFocus
                  className="w-full bg-transparent text-sm text-slate-800 focus:outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Options List */}
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                {filteredStudents.length === 0 ? (
                  <div className="p-3.5 text-center text-xs text-slate-400 font-medium">
                    Aucun élève trouvé
                  </div>
                ) : (
                  filteredStudents.map(s => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedStudentId(s.id)
                        setIsOpen(false)
                        setSearchQuery('')
                      }}
                      className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition ${
                        selectedStudentId === s.id
                          ? 'bg-purple-50 text-purple-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-semibold">{s.last_name} {s.first_name}</span>
                        {s.classes?.name && (
                          <span className="text-slate-400 text-xs font-normal ml-2">({s.classes.name})</span>
                        )}
                      </div>
                      {selectedStudentId === s.id && <Check size={16} className="text-purple-600 flex-shrink-0" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          id="btn-invite-parent"
          type="submit"
          disabled={!selectedStudentId}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition text-sm shadow-sm"
        >
          Envoyer l'invitation
        </button>
      </form>
    </div>
  )
}
