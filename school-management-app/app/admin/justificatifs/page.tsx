import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { formatDate } from '@/lib/utils'
import { FileText, CheckCircle, XCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Justificatifs — EcoleConnect' }

export default async function AdminJustificatifsPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: attendance } = await supabase
    .from('attendance')
    .select('*, students(first_name, last_name, classes(name))')
    .eq('status', 'absent')
    .not('justification', 'is', null)
    .order('date', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Justificatifs d'absences</h1>
        <p className="text-slate-500 mt-1">Examinez et validez les justificatifs transmis par les parents</p>
      </div>

      {(attendance?.length ?? 0) === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <FileText className="text-slate-300 mx-auto mb-2" size={32} />
          <p className="text-slate-500 text-sm">Aucun justificatif d'absence soumis pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {attendance?.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900">
                    {(item.students as any)?.last_name} {(item.students as any)?.first_name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                    {((item.students as any)?.classes as any)?.name}
                  </span>
                  <span className="text-slate-400 text-xs">Absence du {formatDate(item.date)}</span>
                </div>
                <p className="text-slate-700 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100 italic mt-2">
                  "{item.justification}"
                </p>
                {item.justified_file && (
                  <a
                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/absence-justifications/${item.justified_file}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 font-medium hover:underline inline-block mt-1"
                  >
                    📎 Télécharger le document joint
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {item.is_justified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">
                    <CheckCircle size={14} /> Validé
                  </span>
                ) : (
                  <form action="/api/admin/attendance/justify" method="post" className="flex gap-2">
                    <input type="hidden" name="attendance_id" value={item.id} />
                    <button
                      type="submit"
                      name="status"
                      value="accept"
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-medium transition"
                    >
                      <CheckCircle size={14} /> Accepter
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
