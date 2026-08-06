import { requireAdmin } from '@/lib/auth/get-session'
import type { Metadata } from 'next'
import JustificatifsManager from '@/components/justificatifs/JustificatifsManager'

export const metadata: Metadata = { title: 'Justificatifs d\'absences — EcoleConnect' }

export default async function AdminJustificatifsPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Justificatifs d'absences</h1>
        <p className="text-slate-500 text-sm mt-0.5">Examinez et validez les justificatifs transmis par les parents</p>
      </div>

      <JustificatifsManager />
    </div>
  )
}
