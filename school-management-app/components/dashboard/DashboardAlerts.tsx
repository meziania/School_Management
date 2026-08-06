'use client'

import Link from 'next/link'
import { FileText, CheckCircle2 } from 'lucide-react'
import { useJustifications } from '@/lib/store/justifications-context'

export default function DashboardAlerts() {
  const { pendingCount } = useJustifications()

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900 tracking-tight">Alertes</h2>
      <div className="grid gap-3">
        {pendingCount > 0 ? (
          <Link
            href="/admin/justificatifs"
            className="flex items-center gap-3.5 p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100/80 transition shadow-2xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold">
              <FileText size={20} />
            </div>
            <div>
              <p className="font-extrabold text-amber-950 text-sm">
                {pendingCount} justificatif{pendingCount > 1 ? 's' : ''} en attente
              </p>
              <p className="text-amber-800 text-xs font-semibold mt-0.5 group-hover:underline">
                Cliquez pour examiner et valider →
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3.5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="font-extrabold text-emerald-950 text-sm">
                Tous les justificatifs d'absence ont été examinés.
              </p>
              <p className="text-emerald-800 text-xs font-semibold mt-0.5">
                Aucun justificatif en attente pour le moment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
