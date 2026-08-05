'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { UserPlus, Search, ChevronDown, Check, X, Phone, User } from 'lucide-react'

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
  const [phone, setPhone] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(
    defaultStudentId ? [defaultStudentId] : []
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Find selected student objects
  const selectedStudents = useMemo(() => {
    return students.filter(s => selectedStudentIds.includes(s.id))
  }, [students, selectedStudentIds])

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

  // Toggle student selection for multi-select
  const toggleStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(sId => sId !== id))
    } else {
      setSelectedStudentIds([...selectedStudentIds, id])
    }
  }

  // Remove a student badge
  const removeStudent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setSelectedStudentIds(selectedStudentIds.filter(sId => sId !== id))
  }

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
        {/* Hidden inputs for selected student_ids */}
        {selectedStudentIds.map(id => (
          <input key={id} type="hidden" name="student_ids" value={id} />
        ))}

        {/* Nom complet */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom complet du parent *</label>
          <input
            id="parent-name-input"
            name="full_name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            placeholder="ex: Marc Dupont"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-900"
          />
        </div>

        {/* Email */}
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
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-900"
          />
        </div>

        {/* 🌟 Phone Number Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
            <Phone size={14} className="text-purple-600" />
            Numéro de téléphone *
          </label>
          <input
            id="parent-phone-input"
            type="tel"
            name="phone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            placeholder="ex: 06 61 23 45 67"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-900"
          />
        </div>

        {/* 🌟 Multi-select Searchable Combobox for Children */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center justify-between">
            <span>Élève(s) associé(s) *</span>
            <span className="text-xs text-purple-600 font-normal">
              {selectedStudentIds.length} sélectionné(s)
            </span>
          </label>
          
          {/* Dropdown Trigger Box */}
          <div
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full p-2.5 min-h-[46px] rounded-xl border text-sm font-medium bg-white flex items-center justify-between transition cursor-pointer ${
              isOpen
                ? 'border-purple-500 ring-2 ring-purple-500/20 text-slate-900'
                : 'border-slate-200 text-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex gap-1.5 flex-wrap items-center">
              {selectedStudents.length === 0 ? (
                <span className="text-slate-400 text-sm px-1">Sélectionner un ou plusieurs élèves...</span>
              ) : (
                selectedStudents.map(s => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 animate-fadeIn"
                  >
                    <span>{s.last_name} {s.first_name} {s.classes?.name ? `(${s.classes.name})` : ''}</span>
                    <button
                      type="button"
                      onClick={e => removeStudent(e, s.id)}
                      className="hover:text-purple-950 p-0.5 rounded-full hover:bg-purple-200 transition"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
            <ChevronDown size={16} className="text-slate-400 flex-shrink-0 ml-2" />
          </div>

          {/* Searchable Multi-select Dropdown Menu */}
          {isOpen && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Search Input inside Menu */}
              <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                <Search size={16} className="text-slate-400 ml-1 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom ou classe..."
                  autoFocus
                  className="w-full bg-transparent text-sm text-slate-800 focus:outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Multi-select Options List */}
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                {filteredStudents.length === 0 ? (
                  <div className="p-3.5 text-center text-xs text-slate-400 font-medium">
                    Aucun élève trouvé
                  </div>
                ) : (
                  filteredStudents.map(s => {
                    const isSelected = selectedStudentIds.includes(s.id)
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleStudent(s.id)}
                        className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-purple-50/90 text-purple-900 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                          />
                          <span className="font-semibold">{s.last_name} {s.first_name}</span>
                          {s.classes?.name && (
                            <span className="text-slate-400 text-xs font-normal">({s.classes.name})</span>
                          )}
                        </div>
                        {isSelected && <Check size={16} className="text-purple-600 flex-shrink-0 ml-2" />}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <button
          id="btn-invite-parent"
          type="submit"
          disabled={selectedStudentIds.length === 0}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition text-sm shadow-sm"
        >
          Envoyer l'invitation
        </button>
      </form>
    </div>
  )
}
