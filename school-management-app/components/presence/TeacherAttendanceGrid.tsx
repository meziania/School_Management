'use client'

import { useState, useMemo } from 'react'
import { Search, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'

interface StudentItem {
  id: string
  first_name: string
  last_name: string
}

interface AttendanceRecord {
  student_id: string
  status: 'present' | 'absent' | 'late'
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
      map[s.id] = rec?.status || 'present'
    })
    return map
  }, [students, existingAttendance])

  const [statusMap, setStatusMap] = useState<Record<string, string>>(initialMap)

  // Live Search & Filter
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const fullName = `${s.last_name} ${s.first_name}`.toLowerCase()
      const matchesSearch = fullName.includes(searchQuery.toLowerCase())
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

  return (
    <form action="/api/admin/attendance" method="post" className="space-y-4">
      <input type="hidden" name="class_id" value={selectedClassId} />
      <input type="hidden" name="date" value={selectedDate} />

      {/* Hidden inputs to pass all status values upon submission */}
      {Object.entries(statusMap).map(([stId, stVal]) => (
        <input key={stId} type="hidden" name={`status_${stId}`} value={stVal} />
      ))}

      {/* Controls: Search & Quick Status Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
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

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Filtre :</span>
          {[
            { id: 'all', label: `Tous (${students.length})` },
            { id: 'present', label: `Présents (${Object.values(statusMap).filter(v => v === 'present').length})` },
            { id: 'absent', label: `Absents (${Object.values(statusMap).filter(v => v === 'absent').length})` },
            { id: 'late', label: `Retards (${Object.values(statusMap).filter(v => v === 'late').length})` },
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
                  Aucun élève ne correspond à votre recherche.
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student, idx) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1
                const currentStatus = statusMap[student.id] || 'present'

                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 text-xs font-mono text-slate-400">{globalIndex}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">
                      {student.last_name} {student.first_name}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end sm:justify-start gap-2">
                        {[
                          { value: 'present', label: 'Présent', color: 'bg-emerald-600 text-white' },
                          { value: 'absent', label: 'Absent', color: 'bg-red-600 text-white' },
                          { value: 'late', label: 'En retard', color: 'bg-amber-500 text-white' },
                        ].map(opt => {
                          const isSelected = currentStatus === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setStatusMap({ ...statusMap, [student.id]: opt.value })}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                                isSelected
                                  ? `${opt.color} border-transparent shadow-sm scale-105`
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
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
