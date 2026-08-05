import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import AdminAttendanceGrid from '@/components/presence/AdminAttendanceGrid'

export const metadata: Metadata = { title: 'Présence — EcoleConnect' }

export default async function PresencePage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string; date?: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()
  const params = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const selectedDate = params.date || today

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Présence & Appel Quotidien</h1>
        <p className="text-slate-500 text-sm mt-0.5">Saisie et suivi de l'assiduité des élèves par classe</p>
      </div>

      {/* Selecteur de classe & date */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <form method="get" className="flex gap-4 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">1. Classe & Niveau</label>
            <select
              id="select-class"
              name="class_id"
              defaultValue={selectedClass}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classes?.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.level ? `[${cls.level}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">2. Date de l'appel</label>
            <input
              id="date-picker"
              type="date"
              name="date"
              defaultValue={selectedDate}
              max={today}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button type="submit"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition shadow-sm">
            Afficher
          </button>
        </form>
      </div>

      {/* Grille Interactive avec Recherche Live, Tout Marquer (Select All) & Pagination */}
      {students.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <p className="text-slate-500 text-sm">Sélectionnez une classe pour afficher la grille d'appel des élèves.</p>
        </div>
      ) : (
        <AdminAttendanceGrid
          selectedClassId={selectedClass!}
          selectedDate={selectedDate}
          className={classNameDisplay}
          students={students}
          existingAttendance={attendance}
        />
      )}
    </div>
  )
}
