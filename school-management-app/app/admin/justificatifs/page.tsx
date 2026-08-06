import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import JustificatifsManager, { JustificationItem } from '@/components/justificatifs/JustificatifsManager'

export const metadata: Metadata = { title: 'Justificatifs d\'absences — EcoleConnect' }

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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Justificatifs d'absences</h1>
        <p className="text-slate-500 text-sm mt-0.5">Examinez et validez les justificatifs transmis par les parents</p>
      </div>

      <JustificatifsManager initialJustifications={(attendance as unknown as JustificationItem[]) ?? []} />
    </div>
  )
}
