import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, Calendar, BarChart3, ClipboardList, UserPlus } from 'lucide-react'
import { formatDate, gradeColor, attendanceStatusLabel, attendanceStatusClasses } from '@/lib/utils'

export const metadata: Metadata = { title: 'Détail Élève — EcoleConnect' }

export default async function DetailElevePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()
  const { id } = await params

  const { data: student } = await supabase
    .from('students')
    .select('*, classes(name)')
    .eq('id', id)
    .single()

  if (!student) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold text-slate-800">Élève introuvable</h2>
        <Link href="/admin/eleves" className="text-blue-600 hover:underline mt-2 inline-block text-sm">
          ← Retour à la liste des élèves
        </Link>
      </div>
    )
  }

  const [
    { data: grades },
    { data: attendance },
    { data: parentLinks },
  ] = await Promise.all([
    supabase.from('grades').select('*').eq('student_id', id).order('date', { ascending: false }),
    supabase.from('attendance').select('*').eq('student_id', id).order('date', { ascending: false }).limit(10),
    supabase.from('parent_students').select('*, users(full_name, email)').eq('student_id', id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/eleves" className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 text-lg font-bold">
                {student.first_name[0]}{student.last_name[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{student.last_name} {student.first_name}</h1>
              <p className="text-slate-500 text-sm">
                Classe : {(student.classes as any)?.name ?? 'Non assigné'}
                {student.birth_date && ` · Né(e) le ${formatDate(student.birth_date)}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/admin/notes/ajouter?student_id=${student.id}`}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition shadow-sm">
            + Ajouter une note
          </Link>
          <Link href={`/admin/parents?student_id=${student.id}`}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-medium transition shadow-sm">
            <UserPlus size={14} /> Link Parent
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Dernières notes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              Notes & Évaluations
            </h2>
            <Link href={`/admin/notes?student_id=${student.id}`} className="text-blue-600 text-xs font-medium hover:underline">
              Voir tout →
            </Link>
          </div>

          {(grades?.length ?? 0) === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">Aucune note enregistrée</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {grades?.slice(0, 5).map(g => (
                <div key={g.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{g.subject}</p>
                    <p className="text-slate-400 text-xs">{formatDate(g.date)} · Trimestre {g.term}</p>
                  </div>
                  <span className={`text-base font-bold ${gradeColor(g.score)}`}>{g.score}/20</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historique présence */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <ClipboardList size={18} className="text-green-600" />
              Présences récentes
            </h2>
          </div>

          {(attendance?.length ?? 0) === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">Aucune donnée de présence</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {attendance?.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2.5">
                  <span className="text-slate-700 text-sm">{formatDate(a.date)}</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${attendanceStatusClasses(a.status)}`}>
                    {attendanceStatusLabel(a.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
