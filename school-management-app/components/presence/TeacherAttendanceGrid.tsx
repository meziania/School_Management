'use client'

import { useState, useMemo } from 'react'
import { Search, CheckCircle2, UserCheck, UserX, Paperclip } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'

interface StudentItem {
  id: string
  first_name: string
  last_name: string
}

interface AttendanceRecord {
  student_id: string
  status: 'present' | 'absent'
}

interface TeacherAttendanceGridProps {
  selectedClassId: string
  selectedDate: string
  students: StudentItem[]
  existingAttendance: AttendanceRecord[]
}

export default function TeacherAttendanceGrid({
  selectedClassId,
  selectedDate,
  students,
  existingAttendance,
}: TeacherAttendanceGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Map of student_id -> status
  const initialMap = useMemo(() => {
    const map: Record<string, string> = {}
    students.forEach(s => {
      const rec = existingAttendance.find(a => a.student_id === s.id)
      map[s.id] = rec?.status === 'absent' ? 'absent' : 'present'
    })
    return map
  }, [students, existingAttendance])

  const [statusMap, setStatusMap] = useState<Record<string, string>>(initialMap)
  const [motifs, setMotifs] = useState<Record<string, string>>({})

  // Quick Bulk Actions (Select All / Tout Marquer)
  const markAllAs = (status: 'present' | 'absent') => {
    const updated = { ...statusMap }
    filteredStudents.forEach(s => {
      updated[s.id] = status
    })
    setStatusMap(updated)
  }

  // Live Search & Filter
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const fullName = `${s.last_name} ${s.first_name}`.toLowerCase()
      const matchesSearch = fullName.includes(searchQuery.toLowerCase().trim())
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

  const presentCount = useMemo(() => Object.values(statusMap).filter(v => v === 'present').length, [statusMap])
  const absentCount = useMemo(() => Object.values(statusMap).filter(v => v === 'absent').length, [statusMap])

  return (
    <form action="/api/admin/attendance" method="post" className="space-y-4">
      <input type="hidden" name="class_id" value={selectedClassId} />
      <input type="hidden" name="date" value={selectedDate} />

      {/* Hidden inputs to pass all status values upon submission */}
      {Object.entries(statusMap).map(([stId, stVal]) => (
        <input key={stId} type="hidden" name={`status_${stId}`} value={stVal} />
      ))}

      {/* Header bar with Tout Marquer & Live Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Bulk Buttons */}
          <div className="flex items-center gap-2">
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

        {/* Filter Pills */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
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
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
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
                const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1
                const currentStatus = statusMap[student.id] || 'present'
                const isAbsent = currentStatus === 'absent'

                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition">
                    <td colSpan={3} className="p-0">
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-400 w-6">{globalIndex}</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {student.last_name} {student.first_name}
                          </span>
                        </div>

                        {/* Status Buttons: ONLY Présent vs Absent */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setStatusMap({ ...statusMap, [student.id]: 'present' })}
                            className={`px-4 py-1.5 rounded-xl border text-xs font-bold transition ${
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
                            className={`px-4 py-1.5 rounded-xl border text-xs font-bold transition ${
                              currentStatus === 'absent'
                                ? 'bg-red-600 text-white border-red-600 shadow-sm scale-105'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>

                      {/* Optional Note for Absence */}
                      {isAbsent && (
                        <div className="px-5 py-2.5 bg-red-50/40 border-t border-red-100/70">
                          <input
                            type="text"
                            name={`motif_${student.id}`}
                            value={motifs[student.id] || ''}
                            onChange={e => setMotifs({ ...motifs, [student.id]: e.target.value })}
                            placeholder="Motif ou remarque d'absence..."
                            className="w-full px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
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

        {/* Submit Button Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            id="btn-save-teacher-attendance"
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition text-sm flex items-center gap-2"
          >
            <CheckCircle2 size={18} />
            Enregistrer l'appel
          </button>
        </div>
      </div>
    </form>
  )
}
