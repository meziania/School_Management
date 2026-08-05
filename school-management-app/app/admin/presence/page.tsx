import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import AdminAttendanceGrid from '@/components/presence/AdminAttendanceGrid'
import PresenceFilterBar from '@/components/presence/PresenceFilterBar'

export const metadata: Metadata = { title: 'Présence — EcoleConnect' }

export default async function PresencePage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string; date?: string; period?: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()
  const params = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const selectedDate = params.date || today
  const selectedPeriod = params.period || ''

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, level')
    .eq('is_active', true)
    .order('name')

  const selectedClass = params.class_id || classes?.[0]?.id

  let students: any[] = []
  let attendance: any[] = []

  if (selectedClass) {
    const studentsRes = await supabase.from('students').select('id, first_name, last_name')
      .eq('class_id', selectedClass).eq('is_active', true).order('last_name')
    students = studentsRes.data ?? []

    if (students.length > 0) {
      const { data } = await supabase.from('attendance').select('*')
        .eq('date', selectedDate)
        .in('student_id', students.map(s => s.id))
      attendance = data ?? []
    }
  }

  const selectedClassObj = classes?.find(c => c.id === selectedClass)
  const classNameDisplay = selectedClassObj ? `${selectedClassObj.name} ${selectedClassObj.level ? `[${selectedClassObj.level}]` : ''}` : ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Présence & Appel Quotidien</h1>
          <p className="text-slate-500 text-sm mt-0.5">Saisie et suivi de l'assiduité des élèves par classe</p>
        </div>
        <Link
          href="/admin/settings/assiduite"
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition shadow-sm"
        >
          <Settings size={16} />
          Paramètres Assiduité
        </Link>
      </div>

      {/* 🌟 Barre de Filtres en Cascade (1. Niveau -> 2. Classe -> 3. Date -> 4. Période) */}
      <PresenceFilterBar
        classes={classes ?? []}
        selectedClassId={selectedClass!}
        selectedDate={selectedDate}
        selectedPeriod={selectedPeriod}
        baseRoute="/admin/presence"
      />

      {/* Grille Interactive avec Recherche Live, Tout Marquer (Select All) & Pagination */}
      {students.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-slate-500 text-sm">Sélectionnez un niveau puis une classe pour afficher la grille d'appel des élèves.</p>
        </div>
      ) : (
        <AdminAttendanceGrid
          selectedClassId={selectedClass!}
          selectedDate={selectedDate}
          selectedPeriod={selectedPeriod}
          className={classNameDisplay}
          students={students}
          existingAttendance={attendance}
        />
      )}
    </div>
  )
}
