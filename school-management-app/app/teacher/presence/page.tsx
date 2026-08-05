import { requireTeacher } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { formatDate, attendanceStatusLabel, attendanceStatusClasses } from '@/lib/utils'
import Link from 'next/link'

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

  const attendanceMap = Object.fromEntries(attendance.map(a => [a.student_id, a]))

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
          {/* Filtres */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <form method="get" className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Classe</label>
                <select
                  name="class_id"
                  defaultValue={selectedClass}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.level ? `[${c.level}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                <input
                  type="date"
                  name="date"
                  defaultValue={selectedDate}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
              <button type="submit"
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition shadow-sm">
                Afficher
              </button>
            </form>
          </div>

          {/* Formulaire de saisie */}
          {selectedClass && students.length > 0 && (
            <form action="/api/admin/attendance" method="post" className="space-y-4">
              <input type="hidden" name="class_id" value={selectedClass} />
              <input type="hidden" name="date" value={selectedDate} />

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Élève</th>
                      <th className="px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map(student => {
                      const record = attendanceMap[student.id]
                      const currentStatus = record?.status ?? 'present'

                      return (
                        <tr key={student.id} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-4 font-bold text-slate-900 text-sm">
                            {student.last_name} {student.first_name}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              {[
                                { value: 'present', label: 'Présent', color: 'peer-checked:bg-green-600 peer-checked:text-white' },
                                { value: 'absent', label: 'Absent', color: 'peer-checked:bg-red-600 peer-checked:text-white' },
                                { value: 'late', label: 'En retard', color: 'peer-checked:bg-yellow-500 peer-checked:text-white' },
                              ].map(opt => (
                                <label key={opt.value} className="cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`status_${student.id}`}
                                    value={opt.value}
                                    defaultChecked={currentStatus === opt.value}
                                    className="sr-only peer"
                                  />
                                  <span className={`px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 transition block ${opt.color}`}>
                                    {opt.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-sm text-sm transition"
                  >
                    Enregistrer l'appel
                  </button>
                </div>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  )
}
