'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Edit, GraduationCap, Users } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'

interface ClassWithCount {
  id: string
  name: string
  level?: string | null
  filiere?: string | null
  students?: { count: number }[]
}

interface ClassesGridProps {
  classes: ClassWithCount[]
}

export default function ClassesGrid({ classes }: ClassesGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCycle, setSelectedCycle] = useState<'all' | 'primary' | 'middle' | 'high'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  // Filter logic
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const q = searchQuery.toLowerCase().trim()
      const nameMatch = cls.name.toLowerCase().includes(q)
      const levelMatch = cls.level?.toLowerCase().includes(q) || false
      const filiereMatch = cls.filiere?.toLowerCase().includes(q) || false
      const matchesSearch = !q || nameMatch || levelMatch || filiereMatch

      if (!matchesSearch) return false

      if (selectedCycle === 'all') return true
      const lvl = (cls.level || '').toUpperCase()

      if (selectedCycle === 'primary') {
        return lvl.includes('AP') || lvl.includes('PRIMAIRE') || lvl.includes('CP') || lvl.includes('CE') || lvl.includes('CM')
      }
      if (selectedCycle === 'middle') {
        return lvl.includes('AC') || lvl.includes('COLLÈGE') || lvl.includes('COLLEGE')
      }
      if (selectedCycle === 'high') {
        return lvl.includes('BAC') || lvl.includes('TC') || lvl.includes('LYCÉE') || lvl.includes('LYCEE')
      }
      return true
    })
  }, [classes, searchQuery, selectedCycle])

  // Pagination Math
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage) || 1
  const paginatedClasses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredClasses.slice(start, start + itemsPerPage)
  }, [filteredClasses, currentPage, itemsPerPage])

  // Cycle Counts
  const counts = useMemo(() => {
    let primary = 0
    let middle = 0
    let high = 0
    classes.forEach(c => {
      const lvl = (c.level || '').toUpperCase()
      if (lvl.includes('AP') || lvl.includes('PRIMAIRE') || lvl.includes('CP') || lvl.includes('CE') || lvl.includes('CM')) {
        primary++
      } else if (lvl.includes('AC') || lvl.includes('COLLÈGE') || lvl.includes('COLLEGE')) {
        middle++
      } else if (lvl.includes('BAC') || lvl.includes('TC') || lvl.includes('LYCÉE') || lvl.includes('LYCEE')) {
        high++
      }
    })
    return { all: classes.length, primary, middle, high }
  }, [classes])

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Live Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Rechercher une classe, niveau ou filière..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Cycle Filter Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'all', label: `Toutes (${counts.all})` },
            { id: 'primary', label: `Primaire (${counts.primary})` },
            { id: 'middle', label: `Collège (${counts.middle})` },
            { id: 'high', label: `Lycée (${counts.high})` },
          ].map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setSelectedCycle(c.id as any)
                setCurrentPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
                selectedCycle === c.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Classes */}
      {filteredClasses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Users size={26} />
          </div>
          <p className="text-slate-800 font-bold text-base">Aucune classe trouvée</p>
          <p className="text-slate-400 text-xs">Aucune classe ne correspond à votre recherche "{searchQuery}".</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedClasses.map(cls => {
              const studentCount = (cls.students as unknown as { count: number }[])?.[0]?.count ?? 0
              return (
                <Link
                  key={cls.id}
                  href={`/admin/classes/${cls.id}`}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition">
                          {cls.name}
                        </h3>
                        {cls.level && (
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                            Niveau : {cls.level}
                          </span>
                        )}
                      </div>
                      <Edit size={16} className="text-slate-400 group-hover:text-blue-500 transition" />
                    </div>

                    {cls.filiere && (
                      <p className="text-purple-700 text-xs font-semibold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 mb-4 inline-block">
                        Filière : {cls.filiere}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 border-t border-slate-100 pt-3">
                    <GraduationCap size={16} className="text-blue-500" />
                    <span>{studentCount} élève{studentCount > 1 ? 's' : ''} inscrits</span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredClasses.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>
      )}
    </div>
  )
}
