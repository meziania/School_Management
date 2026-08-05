import { requireTeacher } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import TeacherAttendanceGrid from '@/components/presence/TeacherAttendanceGrid'
import PresenceFilterBar from '@/components/presence/PresenceFilterBar'

export const metadata: Metadata = { title: 'Présences — EcoleConnect' }

export default async function TeacherPresencePage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string; date?: string }>
}) {
  const profile = await requireTeacher()
  const supabase = await createClient()
  const params = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const selectedDate = params.date || today

  // Récupérer les classes de l'enseignant
  const { data: teacherClasses } = await supabase
    .from('teacher_classes')
    .select('class_id, subject, classes(id, name, level)')
    .eq('teacher_user_id', profile.id)

  const classes = teacherClasses?.map((tc: any) => tc.classes).filter(Boolean) ?? []
  const selectedClass = params.class_id || classes[0]?.id

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appel & Saisie des Présences</h1>
        <p className="text-slate-500 text-sm mt-0.5">Faites l'appel quotidien pour les élèves de vos classes</p>
      </div>

      {classes.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
          Aucune classe ne vous est assignée.
        </div>
      ) : (
        <>
          {/* 🌟 Barre de Filtres en Cascade pour l'enseignant (1. Niveau -> 2. Classe -> 3. Date) */}
          <PresenceFilterBar
            classes={classes}
            selectedClassId={selectedClass!}
            selectedDate={selectedDate}
            baseRoute="/teacher/presence"
          />

          {/* Grille Interactive avec Recherche Live, Tout Marquer & Pagination */}
          {selectedClass && students.length > 0 && (
            <TeacherAttendanceGrid
              selectedClassId={selectedClass}
              selectedDate={selectedDate}
              students={students}
              existingAttendance={attendance}
            />
          )}
        </>
      )}
    </div>
  )
}
