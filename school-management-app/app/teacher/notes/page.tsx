'use client'

import { useState, useEffect } from 'react'
import { Save, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'

export default function TeacherNotesPage() {
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedSemester, setSelectedSemester] = useState<string>('1')

  const [students, setStudents] = useState<any[]>([])
  const [bulkGrades, setBulkGrades] = useState<Record<string, { score: string; coefficient: string; comment: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/teachers')
        const json = await res.json()
        // Format options from user session
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Saisie des Notes d'Évaluations</h1>
        <p className="text-slate-500 text-sm mt-0.5">Saisissez les notes de vos élèves par classe et matière assignée</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <p className="text-slate-600 text-sm">
          💡 En tant qu'enseignant, vous pouvez saisir les notes en masse pour chacune de vos classes. Utilisez le menu rapide ou accédez au module complet de gestion des notes.
        </p>
      </div>
    </div>
  )
}
