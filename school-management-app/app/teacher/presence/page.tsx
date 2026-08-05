import { requireTeacher } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import TeacherAttendanceGrid from '@/components/presence/TeacherAttendanceGrid'

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
          {/* Filtres de classe & date */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <form method="get" className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">1. Classe & Niveau</label>
                <select
                  name="class_id"
                  defaultValue={selectedClass}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.level ? `[${c.level}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">2. Date de l'appel</label>
                <input
                  type="date"
                  name="date"
                  defaultValue={selectedDate}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                />
              </div>

              <button type="submit"
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition shadow-sm">
                Afficher
              </button>
            </form>
          </div>

          {/* Grille dynamique avec Recherche, Filtres & Pagination */}
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
