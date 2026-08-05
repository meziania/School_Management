'use client'

import { useState, useMemo } from 'react'
import { Search, CheckCircle2, UserCheck, UserX, Paperclip, FileText, Upload } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'

interface StudentItem {
  id: string
  first_name: string
  last_name: string
}

interface AttendanceRecord {
  student_id: string
  status: 'present' | 'absent'
  justification_path?: string
  notes?: string
}

interface AdminAttendanceGridProps {
  selectedClassId: string
  selectedDate: string
  selectedPeriod?: string
  className?: string
  students: StudentItem[]
  existingAttendance: AttendanceRecord[]
}

export default function AdminAttendanceGrid({
  selectedClassId,
  selectedDate,
  selectedPeriod = '',
  className = '',
  students,
  existingAttendance,
}: AdminAttendanceGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Map student_id -> status ('present' | 'absent')
  const initialMap = useMemo(() => {
    const map: Record<string, string> = {}
    students.forEach(s => {
      const rec = existingAttendance.find(a => a.student_id === s.id)
      map[s.id] = rec?.status === 'absent' ? 'absent' : 'present'
    })
    return map
  }, [students, existingAttendance])

  const [statusMap, setStatusMap] = useState<Record<string, string>>(initialMap)

  // Justification data per student: { motif: string, fileName: string }
  const [justifications, setJustifications] = useState<Record<string, { motif: string; fileName: string }>>(() => {
    const map: Record<string, { motif: string; fileName: string }> = {}
    students.forEach(s => {
      const rec = existingAttendance.find(a => a.student_id === s.id)
      if (rec?.notes || rec?.justification_path) {
        map[s.id] = {
          motif: rec.notes || '',
          fileName: rec.justification_path ? rec.justification_path.split('/').pop() || 'justificatif.pdf' : '',
        }
      }
    })
    return map
  })

  // Quick Bulk Actions (Select All / Tout Marquer)
  const markAllAs = (status: 'present' | 'absent') => {
    const updated = { ...statusMap }
    filteredStudents.forEach(s => {
      updated[s.id] = status
    })
    setStatusMap(updated)
  }

  // Live Typing Search & Status Filter
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const fullName = `${s.last_name} ${s.first_name}`.toLowerCase()
      const matchesSearch = !searchQuery.trim() || fullName.includes(searchQuery.toLowerCase().trim())
      const currentStat = statusMap[s.id] || 'present'
      const matchesStatus = filterStatus === 'all' || currentStat === filterStatus

      return matchesSearch && matchesStatus
    })
  }, [students, searchQuery, filterStatus, statusMap])

  // Pagination Math
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredStudents.slice(start, start + itemsPerPage)
  }, [filteredStudents, currentPage, itemsPerPage])

  // Real-time Summary Counters
  const presentCount = useMemo(() => Object.values(statusMap).filter(v => v === 'present').length, [statusMap])
  const absentCount = useMemo(() => Object.values(statusMap).filter(v => v === 'absent').length, [statusMap])

  // Period label formatter
  const formattedPeriod = useMemo(() => {
    if (!selectedPeriod) return ''
    if (selectedPeriod === 'matin') return '· Matin'
    if (selectedPeriod === 'apres_midi') return '· Après-midi'
    if (selectedPeriod.startsWith('s')) {
      const num = selectedPeriod.replace('s', '')
      return `· Séance ${num}`
    }
    return `· ${selectedPeriod}`
  }, [selectedPeriod])

  return (
    <form action="/api/admin/attendance" method="post" encType="multipart/form-data" className="space-y-4">
      <input type="hidden" name="class_id" value={selectedClassId} />
      <input type="hidden" name="date" value={selectedDate} />
      <input type="hidden" name="period" value={selectedPeriod} />

      {/* Hidden inputs to preserve full class attendance state */}
      {Object.entries(statusMap).map(([stId, stVal]) => (
        <input key={stId} type="hidden" name={`status_${stId}`} value={stVal} />
      ))}

      {/* Summary Header & Bulk Action Buttons */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* 🌟 Dynamic Title Syncing with selected Class, Level, Date, and Period */}
            <h2 className="font-extrabold text-slate-900 text-lg tracking-tight">
              {className || 'Classe'} — {new Date(selectedDate).toLocaleDateString('fr-FR')} {formattedPeriod}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-xs font-bold">
              <span className="text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                {presentCount} présent(s)
              </span>
              <span className="text-red-600 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-100">
                {absentCount} absent(s)
              </span>
            </div>
          </div>

          {/* 🌟 Bulk Actions (Tout Marquer: Présents / Absents) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tout marquer :</span>
            <button
              type="button"
              onClick={() => markAllAs('present')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition border border-emerald-200 flex items-center gap-1.5"
            >
              <UserCheck size={14} /> Tous Présents
            </button>
            <button
              type="button"
              onClick={() => markAllAs('absent')}
              className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition border border-red-200 flex items-center gap-1.5"
            >
              <UserX size={14} /> Tous Absents
            </button>
          </div>
        </div>

        {/* Live Search & Filter Options */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Rechercher un élève..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Filtre :</span>
            {[
              { id: 'all', label: `Tous (${students.length})` },
              { id: 'present', label: `Présents (${presentCount})` },
              { id: 'absent', label: `Absents (${absentCount})` },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilterStatus(f.id)
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  filterStatus === f.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Élève</th>
              <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right sm:text-left">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedStudents.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-xs text-slate-400">
                  Aucun élève trouvé.
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student, idx) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1
                const currentStatus = statusMap[student.id] || 'present'
                const isAbsent = currentStatus === 'absent'
                const justif = justifications[student.id] || { motif: '', fileName: '' }

                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition">
                    <td colSpan={3} className="p-0">
                      {/* Main Row */}
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-400 w-6">{globalIdx}</span>
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                          <span className="font-bold text-slate-900 text-sm">
                            {student.last_name} {student.first_name}
                          </span>
                        </div>

                        {/* 🌟 Status Buttons: ONLY Présent vs Absent */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setStatusMap({ ...statusMap, [student.id]: 'present' })}
                            className={`px-4 py-1.5 rounded-xl border text-xs font-extrabold transition-all duration-150 ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Présent
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatusMap({ ...statusMap, [student.id]: 'absent' })}
                            className={`px-4 py-1.5 rounded-xl border text-xs font-extrabold transition-all duration-150 ${
                              currentStatus === 'absent'
                                ? 'bg-red-600 text-white border-red-600 shadow-sm scale-105'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>

                      {/* 🌟 Conditional File Upload & Reason Section (Revealed ONLY when Absent) */}
                      {isAbsent && (
                        <div className="px-5 py-3.5 bg-red-50/40 border-t border-red-100/70 border-b border-slate-100 animate-fadeIn space-y-3">
                          <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
                            <Paperclip size={14} />
                            <span>Justification de l'absence (Optionnel)</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Motif Input */}
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Motif / Certificat Médical :
                              </label>
                              <input
                                type="text"
                                name={`motif_${student.id}`}
                                value={justif.motif}
                                onChange={e => setJustifications({
                                  ...justifications,
                                  [student.id]: { ...justif, motif: e.target.value },
                                })}
                                placeholder="ex: Certificat médical, Raison familiale..."
                                className="w-full px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-400"
                              />
                            </div>

                            {/* File Upload Input */}
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Joindre un document (PDF, Image) :
                              </label>
                              <div className="relative flex items-center">
                                <input
                                  type="file"
                                  name={`justification_file_${student.id}`}
                                  accept=".pdf,image/*"
                                  onChange={e => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      setJustifications({
                                        ...justifications,
                                        [student.id]: { ...justif, fileName: file.name },
                                      })
                                    }
                                  }}
                                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-100 file:text-red-700 hover:file:bg-red-200 cursor-pointer bg-white border border-red-200 rounded-lg py-1 px-2"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredStudents.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />

        {/* Save Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            id="btn-save-admin-attendance"
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition text-sm flex items-center gap-2"
          >
            <CheckCircle2 size={18} />
            Enregistrer l'appel
          </button>
        </div>
      </div>
    </form>
  )
}
