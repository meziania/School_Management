'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Pagination from '@/components/ui/Pagination'

interface ClassItem {
  id: string
  name: string
  level?: string
}

interface StudentItem {
  id: string
  first_name: string
  last_name: string
  birth_date?: string
  class_id?: string
  classes?: { name: string }
}

interface StudentsTableProps {
  classes: ClassItem[]
  students: StudentItem[]
  initialClassId?: string
  initialSearch?: string
}

export default function StudentsTable({
  classes,
  students,
  initialClassId = '',
  initialSearch = '',
}: StudentsTableProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [selectedClassId, setSelectedClassId] = useState(initialClassId)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Live filtering on keystroke (onChange)
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const fullName = `${s.last_name} ${s.first_name}`.toLowerCase()
      const searchLower = searchQuery.toLowerCase().trim()
      const matchesSearch = !searchLower || fullName.includes(searchLower)
      const matchesClass = !selectedClassId || s.class_id === selectedClassId

      return matchesSearch && matchesClass
    })
  }, [students, searchQuery, selectedClassId])

  // Pagination Math
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredStudents.slice(start, start + itemsPerPage)
  }, [filteredStudents, currentPage, itemsPerPage])

  return (
    <div className="space-y-4">
      {/* Header Live Search & Class Select Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Live Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            id="search-students-input"
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setCurrentPage(1) // Reset to first page on search typing
            }}
            placeholder="Rechercher un élève par nom ou prénom..."
            autoFocus
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white
                       text-sm font-medium text-slate-900 placeholder:text-slate-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-xs"
          />
        </div>

        {/* 🌟 Class Filter Dropdown Select (Replaces cluttered pill list) */}
        <div className="relative min-w-[200px] sm:w-64">
          <select
            id="filter-class-select"
            value={selectedClassId}
            onChange={e => {
              setSelectedClassId(e.target.value)
              setCurrentPage(1) // Reset to first page on class filter change
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white
                       text-sm font-bold text-slate-800 focus:outline-none focus:ring-2
                       focus:ring-blue-500 focus:border-transparent shadow-xs transition cursor-pointer"
          >
            <option value="">Toutes les classes ({students.length})</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} {cls.level ? `(${cls.level})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-slate-700 font-bold text-base">Aucun élève trouvé</p>
          <p className="text-slate-400 text-xs">Aucun élève ne correspond à vos critères de recherche.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Élève</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Classe</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Date de naissance</th>
                <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedStudents.map((student, idx) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1
                return (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 text-xs font-mono text-slate-400">{globalIdx}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{student.last_name} {student.first_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">
                        {student.classes?.name ?? 'Non assigné'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs hidden md:table-cell font-medium">
                      {student.birth_date ? formatDate(student.birth_date) : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/eleves/${student.id}`}
                        className="text-blue-600 hover:text-blue-800 text-xs font-bold hover:underline transition"
                      >
                        Détails →
                      </Link>
                    </td>
                  </tr>
                )
              })}
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
        </div>
      )}
    </div>
  )
}
