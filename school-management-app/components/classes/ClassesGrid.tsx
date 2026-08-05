'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Edit, GraduationCap, Users, X, CheckCircle2, BookOpen } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'
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

export default function ClassesGrid({ classes: initialClasses }: ClassesGridProps) {
  const router = useRouter()
  const [classesList, setClassesList] = useState<ClassWithCount[]>(initialClasses)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCycle, setSelectedCycle] = useState<'all' | 'primary' | 'middle' | 'high'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)

  // Edit Modal State
  const [editingClass, setEditingClass] = useState<ClassWithCount | null>(null)
  const [editName, setEditName] = useState('')
  const [editLevel, setEditLevel] = useState('2BAC')
  const [editFiliere, setEditFiliere] = useState<string>('Sciences Mathématiques A')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Filter logic
  const filteredClasses = useMemo(() => {
    return classesList.filter(cls => {
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
  }, [classesList, searchQuery, selectedCycle])

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
    classesList.forEach(c => {
      const lvl = (c.level || '').toUpperCase()
      if (lvl.includes('AP') || lvl.includes('PRIMAIRE') || lvl.includes('CP') || lvl.includes('CE') || lvl.includes('CM')) {
        primary++
      } else if (lvl.includes('AC') || lvl.includes('COLLÈGE') || lvl.includes('COLLEGE')) {
        middle++
      } else if (lvl.includes('BAC') || lvl.includes('TC') || lvl.includes('LYCÉE') || lvl.includes('LYCEE')) {
        high++
      }
    })
    return { all: classesList.length, primary, middle, high }
  }, [classesList])

  // Open Edit Modal
  const handleOpenEdit = (e: React.MouseEvent, cls: ClassWithCount) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingClass(cls)
    setEditName(cls.name)
    setEditLevel(cls.level || '2BAC')
    setEditFiliere(cls.filiere || 'Sciences Mathématiques A')
    setError(null)
  }

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

  // Handle Edit Submit
  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClass) return
    if (!editName.trim()) {
      setError('Le nom de la classe est obligatoire.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingClass.id,
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

      // Update local state
      setClassesList(prev => prev.map(c => c.id === editingClass.id ? {
        ...c,
        name: editName.trim(),
        level: editLevel,
        filiere: isHighSchoolCycle ? editFiliere : null,
      } : c))

      setSuccessMsg('Classe mise à jour avec succès !')
      setTimeout(() => setSuccessMsg(null), 4000)
      setEditingClass(null)
      router.refresh()
    } catch {
      setError('Erreur réseau lors de la mise à jour.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}

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
                <div
                  key={cls.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <Link href={`/admin/classes/${cls.id}`} className="group-hover:text-blue-600 transition">
                        <h3 className="font-extrabold text-slate-900 text-base">
                          {cls.name}
                        </h3>
                        {cls.level && (
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-bold">
                            Niveau : {cls.level}
                          </span>
                        )}
                      </Link>
                      
                      {/* Edit Class Button */}
                      <button
                        type="button"
                        onClick={e => handleOpenEdit(e, cls)}
                        title="Modifier le nom, niveau ou filière"
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                      >
                        <Edit size={16} />
                      </button>
                    </div>

                    {cls.filiere && (
                      <p className="text-purple-700 text-xs font-semibold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 mb-4 inline-block">
                        Filière : {cls.filiere}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <GraduationCap size={16} className="text-blue-500" />
                      <span>{studentCount} élève{studentCount > 1 ? 's' : ''} inscrits</span>
                    </div>

                    <Link href={`/admin/classes/${cls.id}`} className="text-xs font-bold text-blue-600 hover:underline">
                      Voir détails →
                    </Link>
                  </div>
                </div>
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

      {/* 🌟 EDIT CLASS MODAL */}
      {editingClass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden space-y-4">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-extrabold text-slate-900 text-lg">Modifier la classe</h3>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
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
                  onClick={() => setEditingClass(null)}
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
