import { requireParent } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDate, attendanceStatusLabel, attendanceStatusClasses } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Présence — EcoleConnect' }

export default async function ParentPresencePage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string; month?: string }>
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

  let attendance: any[] = []
  if (activeChild) {
    // 30 derniers jours par défaut
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', activeChild.id)
      .gte('date', from)
      .order('date', { ascending: false })
    attendance = data ?? []
  }

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    unjustified: attendance.filter(a => a.status === 'absent' && !a.is_justified).length,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Présence</h1>

      {/* Sélecteur enfant */}
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map(c => c && (
            <Link key={c.id} href={`/parent/presence?student_id=${c.id}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                activeChild?.id === c.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
              }`}>
              {c.first_name} {c.last_name}
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      {activeChild && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.present}</p>
            <p className="text-green-600 text-sm">Présences</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
            <p className="text-red-600 text-sm">Absences</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{stats.late}</p>
            <p className="text-yellow-600 text-sm">Retards</p>
          </div>
        </div>
      )}

      {/* Alerte absences non justifiées */}
      {stats.unjustified > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-800 font-medium text-sm">
            {stats.unjustified} absence{stats.unjustified > 1 ? 's' : ''} non justifiée{stats.unjustified > 1 ? 's' : ''} — pensez à les justifier
          </p>
        </div>
      )}

      {/* Historique */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Historique (30 derniers jours)</h2>
        </div>

        {attendance.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500">Aucune donnée de présence</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attendance.map(a => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{formatDate(a.date)}</p>
                  {a.justification && (
                    <p className="text-slate-500 text-sm mt-0.5">📄 {a.justification}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg border text-sm font-medium ${attendanceStatusClasses(a.status)}`}>
                    {attendanceStatusLabel(a.status)}
                  </span>

                  {a.status === 'absent' && !a.is_justified && (
                    <Link
                      href={`/parent/absences/${a.id}/justifier`}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
                    >
                      Justifier
                    </Link>
                  )}
                  {a.is_justified && (
                    <span className="text-green-600 text-xs font-medium">✓ Justifiée</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
