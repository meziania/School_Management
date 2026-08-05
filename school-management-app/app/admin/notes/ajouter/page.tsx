'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, ChevronDown, Check, BookOpen, Award } from 'lucide-react'

interface StudentData {
  id: string
  first_name: string
  last_name: string
  classes?: {
    name?: string
    level?: string
    filiere?: string
  } | null
}

export default function AjouterNotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultStudentId = searchParams.get('student_id') || ''

  const [students, setStudents] = useState<StudentData[]>([])
  const [studentId, setStudentId] = useState(defaultStudentId)
  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [subject, setSubject] = useState('')
  const [evalType, setEvalType] = useState('')
  const [score, setScore] = useState('')
  const [coefficient, setCoefficient] = useState('1')
  const [term, setTerm] = useState('1')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [comment, setComment] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch students
  useEffect(() => {
    fetch('/api/admin/students')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setStudents(data.data)
          if (!studentId && data.data.length > 0) {
            setStudentId(data.data[0].id)
          }
        }
      })
      .catch(() => {})
  }, [studentId])

  // Close student dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsStudentDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Selected Student Object
  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === studentId)
  }, [students, studentId])

  // Filtered Students for Combobox
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return students
    const q = studentSearchQuery.toLowerCase()
    return students.filter(s => {
      const fn = `${s.last_name} ${s.first_name}`.toLowerCase()
      const cls = (s.classes?.name || '').toLowerCase()
      return fn.includes(q) || cls.includes(q)
    })
  }, [students, studentSearchQuery])

  // Level & Filière of Selected Student's Class
  const currentLevel = (selectedStudent?.classes?.level || '').toUpperCase()
  const currentFiliere = selectedStudent?.classes?.filiere || ''

  // 🌟 DYNAMIC SUBJECTS DEPENDING ON CLASS LEVEL & FILIÈRE
  const availableSubjects = useMemo(() => {
    if (currentFiliere.includes('Économique') || currentFiliere.includes('Eco')) {
      return [
        'Mathématiques',
        'Économie Générale & Statistique',
        'Comptabilité & Organisation',
        'Économie d’Entreprise',
        'Droit',
        'Langue Arabe',
        'Langue Française',
        'Langue Anglaise',
        'Philosophie',
        'Éducation Islamique',
      ]
    }

    if (currentFiliere.includes('Lettres') || currentFiliere.includes('Humaines')) {
      return [
        'Langue Arabe',
        'Langue Française',
        'Langue Anglaise',
        'Histoire-Géographie',
        'Philosophie',
        'Éducation Islamique',
        'Mathématiques',
      ]
    }

    if (currentLevel.includes('AP') || currentLevel.includes('PRIMAIRE')) {
      return [
        'Mathématiques',
        'Langue Arabe',
        'Langue Française',
        'Éducation Islamique',
        'Activités Scientifiques',
        'Éducation Artistique',
        'Éducation Physique',
      ]
    }

    if (currentLevel.includes('AC') || currentLevel.includes('COLLÈGE')) {
      return [
        'Mathématiques',
        'Physique-Chimie',
        'SVT (Sciences de la Vie et de la Terre)',
        'Langue Arabe',
        'Langue Française',
        'Langue Anglaise',
        'Histoire-Géographie',
        'Éducation Islamique',
        'Technologie',
        'Éducation Physique',
      ]
    }

    // Default High School Scientific / General
    return [
      'Mathématiques',
      'Physique-Chimie',
      'SVT (Sciences de la Vie et de la Terre)',
      'Langue Arabe',
      'Langue Française',
      'Langue Anglaise',
      'Histoire-Géographie',
      'Éducation Islamique',
      'Philosophie',
      'Informatique',
    ]
  }, [currentLevel, currentFiliere])

  // Reset subject when student changes
  useEffect(() => {
    if (availableSubjects.length > 0) {
      setSubject(availableSubjects[0])
    }
  }, [availableSubjects])

  // 🌟 DYNAMIC EVALUATION TYPES DEPENDING ON CLASS LEVEL
  const availableEvalTypes = useMemo(() => {
    if (currentLevel.includes('2BAC')) {
      return [
        'Contrôle Continu 1',
        'Contrôle Continu 2',
        'Devoir de Synthèse',
        'Examen National (Baccalauréat)',
      ]
    }

    if (currentLevel.includes('1BAC')) {
      return [
        'Contrôle Continu 1',
        'Contrôle Continu 2',
        'Devoir de Synthèse',
        'Examen Régional',
      ]
    }

    if (currentLevel.includes('3AC')) {
      return [
        'Contrôle Continu 1',
        'Contrôle Continu 2',
        'Examen Normalisé Régional',
      ]
    }

    if (currentLevel.includes('6AP')) {
      return [
        'Contrôle Continu 1',
        'Contrôle Continu 2',
        'Examen Normalisé Provincial',
      ]
    }

    return [
      'Contrôle Continu 1',
      'Contrôle Continu 2',
      'Devoir de Synthèse',
    ]
  }, [currentLevel])

  // Reset evalType when student level changes
  useEffect(() => {
    if (availableEvalTypes.length > 0) {
      setEvalType(availableEvalTypes[0])
    }
  }, [availableEvalTypes])

  // 🌟 AUTO-FILL COEFFICIENT ON SUBJECT OR EVAL TYPE CHANGE
  useEffect(() => {
    if (!subject) return

    let defaultCoeff = '1'

    if (currentFiliere.includes('Math') || currentFiliere.includes('SM')) {
      if (subject === 'Mathématiques' || subject === 'Physique-Chimie') defaultCoeff = '7'
      else if (subject.includes('SVT')) defaultCoeff = '3'
      else defaultCoeff = '2'
    } else if (currentFiliere.includes('Physique') || currentFiliere.includes('PC')) {
      if (subject === 'Physique-Chimie' || subject === 'Mathématiques') defaultCoeff = '7'
      else if (subject.includes('SVT')) defaultCoeff = '5'
      else defaultCoeff = '2'
    } else if (currentFiliere.includes('SVT')) {
      if (subject.includes('SVT')) defaultCoeff = '7'
      else if (subject === 'Physique-Chimie' || subject === 'Mathématiques') defaultCoeff = '5'
      else defaultCoeff = '2'
    } else if (currentFiliere.includes('Éco') || currentFiliere.includes('Eco')) {
      if (subject.includes('Économie') || subject.includes('Comptabilité')) defaultCoeff = '6'
      else if (subject === 'Mathématiques') defaultCoeff = '3'
      else defaultCoeff = '2'
    } else if (currentLevel.includes('AC')) {
      if (subject === 'Mathématiques' || subject === 'Langue Arabe' || subject === 'Langue Française') defaultCoeff = '5'
      else defaultCoeff = '3'
    } else if (currentLevel.includes('AP')) {
      if (subject === 'Mathématiques' || subject === 'Langue Arabe' || subject === 'Langue Française') defaultCoeff = '4'
      else defaultCoeff = '2'
    } else {
      if (subject === 'Mathématiques' || subject === 'Physique-Chimie') defaultCoeff = '4'
      else defaultCoeff = '2'
    }

    // Special weight for regional or national exam
    if (evalType.includes('Examen National') || evalType.includes('Examen Régional')) {
      defaultCoeff = String(Math.max(parseInt(defaultCoeff), 4))
    }

    setCoefficient(defaultCoeff)
  }, [subject, evalType, currentFiliere, currentLevel])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !score || !studentId) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }

    const numScore = parseFloat(score)
    if (isNaN(numScore) || numScore < 0 || numScore > 20) {
      setError('La note doit être comprise entre 0 et 20.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          subject: subject.trim(),
          score: numScore,
          coefficient: parseFloat(coefficient) || 1,
          term: parseInt(term) as 1 | 2 | 3,
          date,
          eval_type: evalType,
          comment: comment.trim() || undefined,
        }),
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error || 'Erreur lors de l\'ajout de la note.')
        return
      }

      router.push(`/admin/notes?student_id=${studentId}`)
      router.refresh()
    } catch {
      setError('Erreur réseau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/notes" className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ajouter une note</h1>
          <p className="text-slate-500 text-sm">Saisir une évaluation officielle pour un élève</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
        {/* 🌟 1. SEARCHABLE COMBOBOX FOR STUDENT */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">Élève *</label>

          <div
            onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-bold bg-white flex items-center justify-between transition cursor-pointer ${
              isStudentDropdownOpen
                ? 'border-blue-500 ring-2 ring-blue-500/20 text-slate-900'
                : 'border-slate-200 text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="truncate">
              {selectedStudent
                ? `${selectedStudent.last_name} ${selectedStudent.first_name} ${selectedStudent.classes?.name ? `— (${selectedStudent.classes.name})` : ''}`
                : 'Sélectionner un élève...'}
            </span>
            <ChevronDown size={16} className="text-slate-400 flex-shrink-0 ml-2" />
          </div>

          {isStudentDropdownOpen && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                <Search size={16} className="text-slate-400 ml-1 flex-shrink-0" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={e => setStudentSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom d'élève ou classe..."
                  autoFocus
                  className="w-full bg-transparent text-sm font-medium text-slate-800 focus:outline-none placeholder:text-slate-400"
                />
              </div>

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
                        setStudentId(s.id)
                        setIsStudentDropdownOpen(false)
                        setStudentSearchQuery('')
                      }}
                      className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between transition ${
                        studentId === s.id
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-bold">{s.last_name} {s.first_name}</span>
                        {s.classes?.name && (
                          <span className="text-slate-400 text-xs font-normal ml-2">({s.classes.name})</span>
                        )}
                      </div>
                      {studentId === s.id && <Check size={16} className="text-blue-600 flex-shrink-0" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 🌟 2. DEPENDENT MATIÈRE DROPDOWN */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen size={16} className="text-blue-600" />
              Matière *
            </span>
            <span className="text-xs text-slate-400 font-normal">Adaptée à la classe</span>
          </label>
          <select
            id="grade-subject-select"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableSubjects.map(sub => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* 🌟 3. TYPE D'ÉVALUATION DROPDOWN */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Award size={16} className="text-purple-600" />
            Type d'évaluation *
          </label>
          <select
            id="grade-eval-type-select"
            value={evalType}
            onChange={e => setEvalType(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {availableEvalTypes.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* SCORE & COEFFICIENT */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">Note sur 20 *</label>
            <input
              id="grade-score-input"
              type="number"
              step="0.25"
              min="0"
              max="20"
              value={score}
              onChange={e => setScore(e.target.value)}
              placeholder="ex: 15.5"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 🌟 4. AUTO-FILLED EDITABLE COEFFICIENT */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span>Coeff. *</span>
              <span className="text-xs text-emerald-600 font-normal">Auto-calculé</span>
            </label>
            <input
              id="grade-coeff-input"
              type="number"
              min="0.5"
              step="0.5"
              value={coefficient}
              onChange={e => setCoefficient(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">Semestre</label>
            <select
              id="grade-term-select"
              value={term}
              onChange={e => setTerm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Semestre 1</option>
              <option value="2">Semestre 2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1.5">Date</label>
            <input
              id="grade-date-input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1.5">Commentaire (optionnel)</label>
          <input
            id="grade-comment-input"
            type="text"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="ex: Bon travail, à poursuivre"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/notes"
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-bold rounded-xl transition text-sm">
            Annuler
          </Link>
          <button
            id="btn-submit-grade"
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md text-sm"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer la note'}
          </button>
        </div>
      </form>
    </div>
  )
}
