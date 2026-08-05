import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import StudentsTable from '@/components/eleves/StudentsTable'

export const metadata: Metadata = { title: 'Élèves — EcoleConnect' }

export default async function ElevesPage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string; search?: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()
  const params = await searchParams

  // Charger les classes pour le filtre
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, level')
    .eq('is_active', true)
    .order('name')

  // Requête tous les élèves actifs de l'école
  const { data: students } = await supabase
    .from('students')
    .select('*, classes(name)')
    .eq('is_active', true)
    .order('last_name')
    .order('first_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Élèves</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Gestion du répertoire des élèves ({students?.length ?? 0} au total)
          </p>
        </div>
        <Link
          href="/admin/eleves/nouveau"
          id="btn-new-student"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white
                     font-bold text-sm rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus size={18} />
          Nouvel élève
        </Link>
      </div>

      {/* Interactive Table with Live Typing Search & Pagination */}
      <StudentsTable
        classes={classes ?? []}
        students={students ?? []}
        initialClassId={params.class_id}
        initialSearch={params.search}
      />
    </div>
  )
}
