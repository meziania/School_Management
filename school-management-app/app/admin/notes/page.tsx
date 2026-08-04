import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { formatDate, gradeColor, termLabel } from '@/lib/utils'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Notes — EcoleConnect',
}

export default async function NotesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string; term?: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()
  const params = await searchParams

  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, classes(name)')
    .eq('is_active', true)
    .order('last_name')

  let grades: any[] = []
  if (params.student_id) {
    let query = supabase
      .from('grades')
      .select('*')
      .eq('student_id', params.student_id)
      .order('date', { ascending: false })

    if (params.term) {
      query = query.eq('term', parseInt(params.term))
    }

    const { data } = await query
    grades = data ?? []
  }

  const selectedStudent = students?.find(s => s.id === params.student_id)

  // Calcul moyennes par matière
  const subjectAverages = grades.reduce((acc, grade) => {
    if (!acc[grade.subject]) acc[grade.subject] = []
    acc[grade.subject].push(grade)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notes</h1>
          <p className="text-slate-500 mt-1">Saisie et consultation par élève</p>
        </div>
        {params.student_id && (
          <Link
            href={`/admin/notes/ajouter?student_id=${params.student_id}`}
            id="btn-add-grade"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition shadow-sm"
          >
            <Plus size={18} />
            Ajouter une note
          </Link>
        )}
      </div>

      {/* Sélecteur élève */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <form method="get" className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Élève</label>
            <select
              id="select-student"
              name="student_id"
              defaultValue={params.student_id}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un élève</option>
              {students?.map(s => (
                <option key={s.id} value={s.id}>
                  {s.last_name} {s.first_name} — {(s.classes as any)?.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Trimestre</label>
            <select
              id="select-term"
              name="term"
              defaultValue={params.term}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous</option>
              <option value="1">Trimestre 1</option>
              <option value="2">Trimestre 2</option>
              <option value="3">Trimestre 3</option>
            </select>
          </div>
          <button type="submit"
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition">
            Afficher
          </button>
        </form>
      </div>

      {/* Notes */}
      {selectedStudent && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-sm font-semibold">
                {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">{selectedStudent.last_name} {selectedStudent.first_name}</h2>
              <p className="text-slate-500 text-sm">{(selectedStudent.classes as any)?.name}</p>
            </div>
          </div>

          {grades.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500">Aucune note saisie pour cet élève</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Matière</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Note</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Coeff.</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trimestre</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grades.map(grade => (
                    <tr key={grade.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 font-medium text-slate-900">{grade.subject}</td>
                      <td className="px-5 py-4">
                        <span className={`text-lg font-bold ${gradeColor(grade.score)}`}>
                          {grade.score}/20
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500">×{grade.coefficient}</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                          {termLabel(grade.term as 1 | 2 | 3)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-sm hidden md:table-cell">{formatDate(grade.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
