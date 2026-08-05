import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import ClassesGrid from '@/components/classes/ClassesGrid'

export const metadata: Metadata = {
  title: 'Classes — EcoleConnect',
  description: 'Gestion des classes de votre école',
}

export default async function ClassesPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('*, students(count)')
    .eq('is_active', true)
    .order('level')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Classes & Filières</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Gestion du répertoire des classes ({classes?.length ?? 0} au total)
          </p>
        </div>
        <Link
          href="/admin/classes/nouveau"
          id="btn-new-class"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white
                     font-bold text-sm rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus size={18} />
          Nouvelle classe
        </Link>
      </div>

      {/* Interactive Grid with Live Typing Search, Cycle Filters & Pagination */}
      <ClassesGrid classes={classes ?? []} />
    </div>
  )
}
