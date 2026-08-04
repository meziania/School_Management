import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { formatDate, attendanceStatusLabel, attendanceStatusClasses } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Présence — EcoleConnect',
}

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
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const selectedClass = params.class_id || classes?.[0]?.id

  let students: any[] = []
  let attendance: any[] = []

  if (selectedClass) {
    const [studentsRes, attendanceRes] = await Promise.all([
      supabase.from('students').select('id, first_name, last_name')
        .eq('class_id', selectedClass).eq('is_active', true).order('last_name'),
      supabase.from('attendance').select('*')
        .eq('date', selectedDate)
        .in('student_id', []),
    ])
    students = studentsRes.data ?? []

    if (students.length > 0) {
      const { data } = await supabase.from('attendance').select('*')
        .eq('date', selectedDate)
        .in('student_id', students.map(s => s.id))
      attendance = data ?? []
    }
  }

  const attendanceMap = Object.fromEntries(attendance.map(a => [a.student_id, a]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Présence</h1>
        <p className="text-slate-500 mt-1">Saisie quotidienne par classe</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <form method="get" className="flex gap-4 flex-wrap items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Classe</label>
            <select
              id="select-class"
              name="class_id"
              defaultValue={selectedClass}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classes?.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
            <input
              id="date-picker"
              type="date"
              name="date"
              defaultValue={selectedDate}
              max={today}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button type="submit"
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition">
            Afficher
          </button>
        </form>
      </div>

      {/* Grille de présence */}
      {students.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500">Sélectionnez une classe pour afficher les élèves</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              {classes?.find(c => c.id === selectedClass)?.name} — {formatDate(selectedDate)}
            </h2>
            <div className="flex gap-4 text-sm text-slate-500">
              <span className="text-green-600 font-medium">
                {attendance.filter(a => a.status === 'present').length} présents
              </span>
              <span className="text-red-600 font-medium">
                {attendance.filter(a => a.status === 'absent').length} absents
              </span>
              {attendance.filter(a => a.status === 'late').length > 0 && (
                <span className="text-yellow-600 font-medium">
                  {attendance.filter(a => a.status === 'late').length} retards
                </span>
              )}
            </div>
          </div>

          <AttendanceForm
            students={students}
            attendanceMap={attendanceMap}
            classId={selectedClass!}
            date={selectedDate}
          />
        </div>
      )}
    </div>
  )
}

function AttendanceForm({
  students,
  attendanceMap,
  classId,
  date,
}: {
  students: any[]
  attendanceMap: Record<string, any>
  classId: string
  date: string
}) {
  const statuses = [
    { value: 'present', label: 'Présent', classes: 'bg-green-50 border-green-300 text-green-700' },
    { value: 'absent', label: 'Absent', classes: 'bg-red-50 border-red-300 text-red-700' },
    { value: 'late', label: 'Retard', classes: 'bg-yellow-50 border-yellow-300 text-yellow-700' },
  ]

  return (
    <form action="/api/admin/attendance" method="post">
      <input type="hidden" name="class_id" value={classId} />
      <input type="hidden" name="date" value={date} />

      <div className="divide-y divide-slate-100">
        {students.map((student) => {
          const current = attendanceMap[student.id]
          return (
            <div key={student.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-xs font-semibold">
                    {student.first_name[0]}{student.last_name[0]}
                  </span>
                </div>
                <p className="font-medium text-slate-900 truncate">
                  {student.last_name} {student.first_name}
                </p>
              </div>

              <div className="flex gap-2">
                {statuses.map(({ value, label, classes }) => (
                  <label key={value} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-sm font-medium transition ${
                    current?.status === value ? classes : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name={`status_${student.id}`}
                      value={value}
                      defaultChecked={current?.status === value}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
        <button
          id="btn-save-attendance"
          type="submit"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition shadow-sm"
        >
          Enregistrer la présence
        </button>
      </div>
    </form>
  )
}
