'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface ClassItem {
  id: string
  name: string
  level?: string
}

interface PresenceFilterBarProps {
  classes: ClassItem[]
  selectedClassId: string
  selectedDate: string
  selectedPeriod?: string
  baseRoute?: string // '/admin/presence' or '/teacher/presence'
}

export default function PresenceFilterBar({
  classes,
  selectedClassId,
  selectedDate,
  selectedPeriod = '',
  baseRoute = '/admin/presence',
}: PresenceFilterBarProps) {
  const router = useRouter()

  // Find initial selected class
  const initialClassObj = useMemo(() => {
    return classes.find(c => c.id === selectedClassId) || classes[0]
  }, [classes, selectedClassId])

  // Extract unique levels
  const availableLevels = useMemo(() => {
    const set = new Set<string>()
    classes.forEach(c => {
      if (c.level) set.add(c.level)
    })
    return Array.from(set)
  }, [classes])

  const [selectedLevel, setSelectedLevel] = useState<string>(initialClassObj?.level || availableLevels[0] || '')
  const [currentClassId, setCurrentClassId] = useState<string>(selectedClassId || initialClassObj?.id || '')
  const [currentDate, setCurrentDate] = useState<string>(selectedDate)

  // Determine if selected level is Primary (1AP - 6AP)
  const isPrimaryLevel = useMemo(() => {
    if (!selectedLevel) return false
    const lvl = selectedLevel.toUpperCase()
    return lvl.includes('AP') || lvl.includes('PRIMAIRE') || lvl.includes('CP') || lvl.includes('CE') || lvl.includes('CM')
  }, [selectedLevel])

  // Dynamic period options based on primary vs secondary
  const periodOptions = useMemo(() => {
    if (isPrimaryLevel) {
      return [
        { id: 'matin', label: 'Matin (08h30 - 12h00)' },
        { id: 'apres_midi', label: 'Après-midi (14h30 - 17h30)' },
      ]
    }
    return [
      { id: 's1', label: 'Séance 1 (08h00 - 10h00)' },
      { id: 's2', label: 'Séance 2 (10h00 - 12h00)' },
      { id: 's3', label: 'Séance 3 (14h00 - 16h00)' },
      { id: 's4', label: 'Séance 4 (16h00 - 18h00)' },
    ]
  }, [isPrimaryLevel])

  const [currentPeriod, setCurrentPeriod] = useState<string>(selectedPeriod || periodOptions[0]?.id || '')

  // Classes filtered by selected level
  const filteredClasses = useMemo(() => {
    if (!selectedLevel) return classes
    return classes.filter(c => c.level === selectedLevel)
  }, [classes, selectedLevel])

  // Handle level selection change -> update available classes and pre-select first class & period
  const handleLevelChange = (newLevel: string) => {
    setSelectedLevel(newLevel)
    const matchingClasses = classes.filter(c => c.level === newLevel)
    if (matchingClasses.length > 0) {
      setCurrentClassId(matchingClasses[0].id)
    } else {
      setCurrentClassId('')
    }
  }

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentClassId) return
    router.push(`${baseRoute}?class_id=${currentClassId}&date=${currentDate}&period=${encodeURIComponent(currentPeriod)}`)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <form onSubmit={handleApply} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* 1. NIVEAU PÉDAGOGIQUE */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            1. Niveau *
          </label>
          <select
            id="filter-level-select"
            value={selectedLevel}
            onChange={e => handleLevelChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="">Sélectionner un niveau</option>
            {availableLevels.map(lvl => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        {/* 2. CLASSE (Dépendante du niveau sélectionné) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            2. Classe *
          </label>
          <select
            id="filter-class-select"
            value={currentClassId}
            onChange={e => setCurrentClassId(e.target.value)}
            disabled={!selectedLevel || filteredClasses.length === 0}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold bg-white transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !selectedLevel
                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed font-normal'
                : 'text-slate-900 border-slate-200'
            }`}
          >
            {!selectedLevel ? (
              <option value="">Choisissez d'abord un niveau</option>
            ) : filteredClasses.length === 0 ? (
              <option value="">Aucune classe dans ce niveau</option>
            ) : (
              filteredClasses.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* 3. DATE DE L'APPEL */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            3. Date *
          </label>
          <input
            id="filter-date-input"
            type="date"
            value={currentDate}
            onChange={e => setCurrentDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 4. PÉRIODE / SÉANCE (Dépendante Primaire vs Collège/Lycée) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            4. Période / Séance *
          </label>
          <select
            id="filter-period-select"
            value={currentPeriod}
            onChange={e => setCurrentPeriod(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            {periodOptions.map(p => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bouton Afficher la classe */}
        <div>
          <button
            id="btn-apply-presence-filter"
            type="submit"
            disabled={!currentClassId}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2"
          >
            Afficher la classe
          </button>
        </div>
      </form>
    </div>
  )
}
