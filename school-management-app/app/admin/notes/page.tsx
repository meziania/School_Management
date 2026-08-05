'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  User,
  Users,
  Plus,
  Search,
  Check,
  ChevronDown,
  RefreshCw,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Award,
  Calculator,
  BookOpen,
} from 'lucide-react'
import { formatDate, gradeColor, calculateAverage } from '@/lib/utils'
import { Subject, getSubjectsForLevel, MOROCCAN_SUBJECTS_CATALOG } from '@/lib/constants/subjects'

interface ClassItem {
  id: string
  name: string
  level?: string
}

interface StudentItem {
  id: string
  first_name: string
  last_name: string
  class_id?: string
}

interface GradeItem {
  id: string
  student_id: string
  subject: string
  score: number
  coefficient: number
  term: number
  date: string
  exam_type?: string
  comment?: string
  students?: { first_name: string; last_name: string }
}

export default function NotesAdminPage() {
  const [mode, setMode] = useState<'individual' | 'class'>('individual')

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [allStudents, setAllStudents] = useState<StudentItem[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [selectedSemester, setSelectedSemester] = useState<string>('1')
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathématiques')
  const [selectedExamType, setSelectedExamType] = useState<string>('controle_continu')

  // Searchable Select State for Student
  const [studentSearch, setStudentSearch] = useState('')
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false)
  const studentDropdownRef = useRef<HTMLDivElement>(null)

  // Searchable Select State for Subject (Matière)
  const [subjectSearch, setSubjectSearch] = useState('')
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false)
  const subjectDropdownRef = useRef<HTMLDivElement>(null)

  const [grades, setGrades] = useState<GradeItem[]>([])
  const [isFetchingGrades, setIsFetchingGrades] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [bulkGrades, setBulkGrades] = useState<Record<string, { score: string; coefficient: string; comment: string }>>({})
  const [isSavingBulk, setIsSavingBulk] = useState(false)

  // 1. Initial Load of Classes and Students
  useEffect(() => {
    async function loadInitialData() {
      setDataLoading(true)
      try {
        const [resClasses, resStudents] = await Promise.all([
          fetch('/api/admin/classes').then(r => r.json()),
          fetch('/api/admin/students').then(r => r.json()),
        ])
        if (resClasses.data) setClasses(resClasses.data)
        if (resStudents.data) setAllStudents(resStudents.data)
      } catch (err) {
        console.error('Erreur chargement données:', err)
      } finally {
        setDataLoading(false)
      }
    }
    loadInitialData()
  }, [])

  const selectedClassObj = useMemo(() => {
    return classes.find(c => c.id === selectedClassId)
  }, [classes, selectedClassId])

  const selectedClassLevel = selectedClassObj?.level || ''

  // 2. Dynamic Level-Filtered Subjects Catalog
  const availableSubjects = useMemo(() => {
    return getSubjectsForLevel(selectedClassLevel)
  }, [selectedClassLevel])

  const filteredSubjectOptions = useMemo(() => {
    if (!subjectSearch.trim()) return availableSubjects
    const query = subjectSearch.toLowerCase()
    return availableSubjects.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query)
    )
  }, [availableSubjects, subjectSearch])

  // 3. Available Exam Types based on Moroccan Level
  const availableExamTypes = useMemo(() => {
    const list = [{ id: 'controle_continu', label: 'Contrôle Continu' }]
    if (selectedClassLevel === '6AP') {
      list.push({ id: 'examen_normalise_provincial', label: 'Examen Normalisé Provincial' })
    } else if (selectedClassLevel === '3AC') {
      list.push({ id: 'examen_normalise_regional', label: 'Examen Normalisé Régional' })
    } else if (selectedClassLevel === '1BAC') {
      list.push({ id: 'examen_regional', label: 'Examen Régional' })
    } else if (selectedClassLevel === '2BAC') {
      list.push({ id: 'examen_regional', label: 'Examen Régional' })
      list.push({ id: 'examen_national', label: 'Examen National' })
    }
    return list
  }, [selectedClassLevel])

  const classStudents = useMemo(() => {
    if (!selectedClassId) return []
    return allStudents.filter(s => s.class_id === selectedClassId)
  }, [selectedClassId, allStudents])

  // Reset student and subject choices when class changes
  useEffect(() => {
    setSelectedStudentId('')
    setStudentSearch('')
    setSubjectSearch('')
    setSelectedExamType('controle_continu')

    // Pre-select first available subject if current subject not in level catalog
    if (availableSubjects.length > 0) {
      setSelectedSubject(availableSubjects[0].name)
    }
  }, [selectedClassId, availableSubjects])

  const filteredStudentOptions = useMemo(() => {
    if (!studentSearch.trim()) return classStudents
    const query = studentSearch.toLowerCase()
    return classStudents.filter(s =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(query) ||
      `${s.last_name} ${s.first_name}`.toLowerCase().includes(query)
    )
  }, [classStudents, studentSearch])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(e.target as Node)) {
        setIsStudentDropdownOpen(false)
      }
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(e.target as Node)) {
        setIsSubjectDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedStudentObj = useMemo(() => {
    return allStudents.find(s => s.id === selectedStudentId)
  }, [allStudents, selectedStudentId])

  // Auto-Fetch Individual
  useEffect(() => {
    if (mode === 'individual' && selectedStudentId) {
      fetchGradesForIndividual(selectedStudentId, selectedSemester)
    }
  }, [mode, selectedStudentId, selectedSemester])

  // Auto-Fetch Class Mode
  useEffect(() => {
    if (mode === 'class' && selectedClassId && selectedSubject) {
      fetchGradesForClassMode(selectedClassId, selectedSubject, selectedSemester, selectedExamType)
    }
  }, [mode, selectedClassId, selectedSubject, selectedSemester, selectedExamType, classStudents])

  async function fetchGradesForIndividual(studentId: string, semester: string) {
    setIsFetchingGrades(true)
    try {
      let url = `/api/admin/grades?student_id=${studentId}`
      if (semester) url += `&term=${semester}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.data) setGrades(json.data)
    } catch (err) {
      console.error('Erreur chargement notes:', err)
    } finally {
      setIsFetchingGrades(false)
    }
  }

  async function fetchGradesForClassMode(classId: string, subject: string, semester: string, examType: string) {
    setIsFetchingGrades(true)
    try {
      let url = `/api/admin/grades?class_id=${classId}`
      if (subject) url += `&subject=${encodeURIComponent(subject)}`
      if (semester) url += `&term=${semester}`
      const res = await fetch(url)
      const json = await res.json()
      const existingGrades: GradeItem[] = json.data ?? []

      // Get default coefficient for selected subject
      const activeSubjObj = MOROCCAN_SUBJECTS_CATALOG.find((s: Subject) => s.name === subject)
      const defaultCoeff = activeSubjObj ? String(activeSubjObj.defaultCoefficient) : '1'

      const initialBulkState: Record<string, { score: string; coefficient: string; comment: string }> = {}
      classStudents.forEach(st => {
        const gradeObj = existingGrades.find(g => g.student_id === st.id && (g.exam_type || 'controle_continu') === examType)
        initialBulkState[st.id] = {
          score: gradeObj ? String(gradeObj.score) : '',
          coefficient: gradeObj ? String(gradeObj.coefficient) : defaultCoeff,
          comment: gradeObj?.comment || '',
        }
      })
      setBulkGrades(initialBulkState)
      setGrades(existingGrades)
    } catch (err) {
      console.error('Erreur chargement notes classe:', err)
    } finally {
      setIsFetchingGrades(false)
    }
  }

  function handleManualRefresh() {
    if (mode === 'individual' && selectedStudentId) {
      fetchGradesForIndividual(selectedStudentId, selectedSemester)
    } else if (mode === 'class' && selectedClassId) {
      fetchGradesForClassMode(selectedClassId, selectedSubject, selectedSemester, selectedExamType)
    }
  }

  async function handleSaveBulkGrades(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClassId) {
      setSaveError('Veuillez sélectionner une classe.')
      return
    }

    const entriesToSave = Object.entries(bulkGrades)
      .filter(([_, val]) => val.score !== '' && !isNaN(parseFloat(val.score)))
      .map(([studentId, val]) => ({
        student_id: studentId,
        subject: selectedSubject,
        score: parseFloat(val.score),
        coefficient: parseFloat(val.coefficient) || 1,
        term: parseInt(selectedSemester || '1'),
        exam_type: selectedExamType,
        date: new Date().toISOString().split('T')[0],
        comment: val.comment || undefined,
      }))

    if (entriesToSave.length === 0) {
      setSaveError('Veuillez saisir au moins une note valide.')
      return
    }

    setIsSavingBulk(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const res = await fetch('/api/admin/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: entriesToSave }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        setSaveError(json.error || 'Erreur lors de l\'enregistrement des notes.')
        return
      }

      setSaveSuccess(`Succès ! ${entriesToSave.length} note(s) enregistrée(s) avec succès.`)
      fetchGradesForClassMode(selectedClassId, selectedSubject, selectedSemester, selectedExamType)
      setTimeout(() => setSaveSuccess(null), 4000)
    } catch {
      setSaveError('Erreur réseau.')
    } finally {
      setIsSavingBulk(false)
    }
  }

  async function handleDeleteGrade(gradeId: string) {
    if (!confirm('Voulez-vous vraiment supprimer cette note ?')) return
    try {
      const res = await fetch(`/api/admin/grades?id=${gradeId}`, { method: 'DELETE' })
      if (res.ok) {
        if (mode === 'individual' && selectedStudentId) {
          fetchGradesForIndividual(selectedStudentId, selectedSemester)
        }
      }
    } catch (err) {
      console.error('Erreur suppression note:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestion des Notes & Examens</h1>
          <p className="text-slate-500 text-sm mt-0.5">Saisie continue et examens de certification du système marocain</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/simulator"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
          >
            <Calculator size={15} /> Simulateur What-If
          </Link>
          <Link
            href="/admin/settings/exams"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition"
          >
            <Award size={15} /> Config Examens
          </Link>

          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 shadow-inner">
            <button
              onClick={() => setMode('individual')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mode === 'individual'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User size={15} /> Mode Individuel
            </button>
            <button
              onClick={() => setMode('class')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mode === 'class'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={15} /> Mode Classe (En Masse)
            </button>
          </div>
        </div>
      </div>

      {/* Cascading Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* 1. Classe & Niveau */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Classe & Niveau *
            </label>
            <select
              id="filter-class-select"
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              disabled={dataLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.level ? `[${c.level}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. MODE INDIVIDUEL (Student Combobox) vs MODE CLASSE (Subject Combobox) */}
          {mode === 'individual' ? (
            /* Student Searchable Select */
            <div className="relative" ref={studentDropdownRef}>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Élève (Recherche)
              </label>
              <div
                onClick={() => selectedClassId && setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-white flex items-center justify-between transition cursor-pointer ${
                  !selectedClassId
                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                    : isStudentDropdownOpen
                    ? 'border-blue-500 ring-2 ring-blue-500/20 text-slate-900'
                    : 'border-slate-200 text-slate-800 hover:border-slate-300'
                }`}
              >
                <span className="truncate">
                  {!selectedClassId
                    ? 'Choisissez d\'abord une classe'
                    : selectedStudentObj
                    ? `${selectedStudentObj.last_name} ${selectedStudentObj.first_name}`
                    : 'Sélectionner un élève...'}
                </span>
                <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
              </div>

              {isStudentDropdownOpen && selectedClassId && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                    <Search size={16} className="text-slate-400 ml-1 flex-shrink-0" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={e => setStudentSearch(e.target.value)}
                      placeholder="Tapez le nom de l'élève..."
                      autoFocus
                      className="w-full bg-transparent text-sm text-slate-800 focus:outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                    {filteredStudentOptions.length === 0 ? (
                      <div className="p-3.5 text-center text-xs text-slate-400">Aucun élève trouvé</div>
                    ) : (
                      filteredStudentOptions.map(s => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedStudentId(s.id)
                            setIsStudentDropdownOpen(false)
                            setStudentSearch('')
                          }}
                          className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition ${
                            selectedStudentId === s.id
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{s.last_name} {s.first_name}</span>
                          {selectedStudentId === s.id && <Check size={16} className="text-blue-600" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 🌟 2. MATIÈRE (Searchable Select / Combobox Dependent on Class) */
            <div className="relative" ref={subjectDropdownRef}>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Matière (Programme Oficial) *
              </label>
              <div
                onClick={() => selectedClassId && setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-white flex items-center justify-between transition cursor-pointer ${
                  !selectedClassId
                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                    : isSubjectDropdownOpen
                    ? 'border-blue-500 ring-2 ring-blue-500/20 text-slate-900'
                    : 'border-slate-200 text-slate-800 hover:border-slate-300'
                }`}
              >
                <span className="truncate flex items-center gap-2">
                  <BookOpen size={16} className="text-slate-400 flex-shrink-0" />
                  {!selectedClassId
                    ? 'Choisissez d\'abord une classe'
                    : selectedSubject
                    ? selectedSubject
                    : 'Sélectionner une matière...'}
                </span>
                <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
              </div>

              {isSubjectDropdownOpen && selectedClassId && (
                <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                    <Search size={16} className="text-slate-400 ml-1 flex-shrink-0" />
                    <input
                      type="text"
                      value={subjectSearch}
                      onChange={e => setSubjectSearch(e.target.value)}
                      placeholder="Tapez le nom de la matière..."
                      autoFocus
                      className="w-full bg-transparent text-sm text-slate-800 focus:outline-none placeholder:text-slate-400 font-medium"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
                    {filteredSubjectOptions.length === 0 ? (
                      <div className="p-3.5 text-center text-xs text-slate-400">Aucune matière trouvée</div>
                    ) : (
                      filteredSubjectOptions.map(sub => (
                        <div
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubject(sub.name)
                            setIsSubjectDropdownOpen(false)
                            setSubjectSearch('')
                          }}
                          className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition ${
                            selectedSubject === sub.name
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{sub.name}</span>
                            <span className="text-slate-400 text-xs font-normal">({sub.code})</span>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            Coeff. ×{sub.defaultCoefficient}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Semestre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Semestre
            </label>
            <select
              id="filter-semester-select"
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les semestres</option>
              <option value="1">Semestre 1</option>
              <option value="2">Semestre 2</option>
            </select>
          </div>

          {/* Refresh Button */}
          <div className="flex gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isFetchingGrades}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition shadow-sm"
            >
              <RefreshCw size={16} className={isFetchingGrades ? 'animate-spin' : ''} />
              {isFetchingGrades ? 'Chargement...' : 'Actualiser'}
            </button>

            {mode === 'individual' && selectedStudentId && (
              <Link
                href={`/admin/notes/ajouter?student_id=${selectedStudentId}`}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-sm flex-shrink-0"
              >
                <Plus size={16} /> Saisir
              </Link>
            )}
          </div>
        </div>

        {/* Dynamic Exam Tabs */}
        {selectedClassId && availableExamTypes.length > 1 && mode === 'class' && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap animate-in fade-in">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Type d'examen :</span>
            {availableExamTypes.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedExamType(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition border ${
                  selectedExamType === t.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MODE INDIVIDUEL */}
      {mode === 'individual' && (
        <div className="space-y-4">
          {!selectedStudentId ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <User size={24} />
              </div>
              <h3 className="font-bold text-slate-800">Aucun élève sélectionné</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Choisissez une classe, puis utilisez la recherche d'élève ci-dessus.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                    {selectedStudentObj?.first_name[0]}{selectedStudentObj?.last_name[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedStudentObj?.last_name} {selectedStudentObj?.first_name}
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {selectedClassObj?.name} {selectedClassLevel ? `[${selectedClassLevel}]` : ''} · {selectedSemester ? `Semestre ${selectedSemester}` : 'Toutes périodes'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Moyenne générale :</span>
                  <span className={`text-2xl font-extrabold ${gradeColor(calculateAverage(grades) ?? 0)}`}>
                    {calculateAverage(grades) !== null ? `${calculateAverage(grades)}/20` : '—'}
                  </span>
                </div>
              </div>

              {grades.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <p className="text-slate-500 text-sm">Aucune note enregistrée pour cet élève.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Matière</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Note sur 20</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Coeff.</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Type / Semestre</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {grades.map(g => (
                        <tr key={g.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {g.subject}
                            {g.comment && <p className="text-slate-400 text-xs font-normal mt-0.5">{g.comment}</p>}
                          </td>
                          <td className="px-5 py-4 font-bold text-base">
                            <span className={gradeColor(g.score)}>{g.score}/20</span>
                          </td>
                          <td className="px-5 py-4 text-slate-500 font-medium">×{g.coefficient}</td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                              {g.exam_type && g.exam_type !== 'controle_continu' ? g.exam_type.replace(/_/g, ' ') : `S${g.term}`}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs hidden sm:table-cell">{formatDate(g.date)}</td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleDeleteGrade(g.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MODE CLASSE DATA GRID */}
      {mode === 'class' && (
        <div className="space-y-4">
          {!selectedClassId ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>
              <h3 className="font-bold text-slate-800">Sélectionnez une classe</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Choisissez une classe dans le filtre ci-dessus pour ouvrir la grille de saisie en masse.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSaveBulkGrades} className="space-y-4">
              {saveSuccess && (
                <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <span>{saveSuccess}</span>
                </div>
              )}
              {saveError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">Grille de Saisie en Masse : {selectedClassObj?.name}</h2>
                  <p className="text-blue-200 text-xs mt-0.5">
                    Matière : <span className="font-semibold text-white">{selectedSubject}</span> · {selectedSemester ? `Semestre ${selectedSemester}` : 'Semestre 1'} · Examen : <span className="font-bold text-amber-300">{selectedExamType.replace(/_/g, ' ')}</span>
                  </p>
                </div>

                <button
                  id="btn-save-bulk-grades"
                  type="submit"
                  disabled={isSavingBulk || classStudents.length === 0}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition text-sm flex-shrink-0"
                >
                  <Save size={18} />
                  {isSavingBulk ? 'Enregistrement...' : 'Enregistrer la classe'}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {classStudents.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    Aucun élève inscrit dans cette classe.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">#</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Élève</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-36">Note sur 20 *</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Coeff.</th>
                        <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Appréciation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {classStudents.map((st, idx) => {
                        const rowVal = bulkGrades[st.id] || { score: '', coefficient: '1', comment: '' }
                        return (
                          <tr key={st.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-5 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                            <td className="px-5 py-3 font-bold text-slate-900">
                              {st.last_name} {st.first_name}
                            </td>
                            <td className="px-5 py-3">
                              <input
                                id={`score-input-${st.id}`}
                                type="number"
                                step="0.25"
                                min="0"
                                max="20"
                                placeholder="/20"
                                value={rowVal.score}
                                onChange={e => setBulkGrades({
                                  ...bulkGrades,
                                  [st.id]: { ...rowVal, score: e.target.value },
                                })}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input
                                id={`coeff-input-${st.id}`}
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={rowVal.coefficient}
                                onChange={e => setBulkGrades({
                                  ...bulkGrades,
                                  [st.id]: { ...rowVal, coefficient: e.target.value },
                                })}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                            </td>
                            <td className="px-5 py-3">
                              <input
                                id={`comment-input-${st.id}`}
                                type="text"
                                placeholder="ex: Bon travail"
                                value={rowVal.comment}
                                onChange={e => setBulkGrades({
                                  ...bulkGrades,
                                  [st.id]: { ...rowVal, comment: e.target.value },
                                })}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
