import { requireParent } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDate, attendanceStatusLabel, attendanceStatusClasses, gradeColor, calculateAverage, termLabel } from '@/lib/utils'

export const metadata: Metadata = { title: 'Notes — EcoleConnect' }

export default async function ParentNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string; term?: string }>
}) {
  const profile = await requireParent()
  const supabase = await createClient()
  const params = await searchParams

  const parentStudentsResult = await supabase
    .from('parent_students')
    .select('student_id, students(id, first_name, last_name, classes(name))')
    .eq('parent_user_id', profile.id)
  const parentStudents = parentStudentsResult.data as any[] | null

  const children = (parentStudents as any[])?.map((ps: any) => ps.students).filter(Boolean) ?? []
  const activeChild = children.find(c => c?.id === params.student_id) ?? children[0]

  let grades: any[] = []
  if (activeChild) {
    let query = supabase.from('grades').select('*')
      .eq('student_id', activeChild.id)
      .order('date', { ascending: false })

    if (params.term) query = query.eq('term', parseInt(params.term))
    const { data } = await query
    grades = data ?? []
  }

  // Grouper par matière
  const bySubject = grades.reduce<Record<string, any[]>>((acc, grade) => {
    if (!acc[grade.subject]) acc[grade.subject] = []
    acc[grade.subject].push(grade)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Notes</h1>

      {/* Sélecteur */}
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map(c => c && (
            <Link key={c.id} href={`/parent/notes?student_id=${c.id}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                activeChild?.id === c.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
              }`}>
              {c.first_name} {c.last_name}
            </Link>
          ))}
        </div>
      )}

      {/* Filtre trimestre */}
      <div className="flex gap-2">
        {[{ v: '', l: 'Tous les trimestres' }, { v: '1', l: 'Trimestre 1' }, { v: '2', l: 'Trimestre 2' }, { v: '3', l: 'Trimestre 3' }].map(({ v, l }) => (
          <Link key={v}
            href={`/parent/notes?student_id=${activeChild?.id ?? ''}&term=${v}`}
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
              (params.term ?? '') === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            }`}>
            {l}
          </Link>
        ))}
      </div>

      {/* Par matière */}
      {Object.entries(bySubject).map(([subject, subjectGrades]) => {
        const avg = calculateAverage(subjectGrades)
        return (
          <div key={subject} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{subject}</h3>
              {avg !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">Moyenne :</span>
                  <span className={`text-xl font-bold ${gradeColor(avg)}`}>{avg}/20</span>
                </div>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {subjectGrades.map((grade: any) => (
                <div key={grade.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1">
                    <p className="text-slate-500 text-sm">{formatDate(grade.date)}</p>
                    {grade.comment && <p className="text-slate-600 text-xs mt-0.5">{grade.comment}</p>}
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-bold ${gradeColor(grade.score)}`}>{grade.score}</span>
                    <span className="text-slate-400">/20</span>
                    <p className="text-slate-400 text-xs">coeff. ×{grade.coefficient}</p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs border border-slate-100">
                    T{grade.term}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {grades.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500">Aucune note disponible</p>
        </div>
      )}
    </div>
  )
}
