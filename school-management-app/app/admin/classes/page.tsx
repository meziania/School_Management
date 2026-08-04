import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Users, Edit } from 'lucide-react'

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
          <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
          <p className="text-slate-500 mt-1">{classes?.length ?? 0} classe{(classes?.length ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/classes/nouveau"
          id="btn-new-class"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white
                     font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Plus size={18} />
          Nouvelle classe
        </Link>
      </div>

      {classes?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users className="text-slate-400" size={28} />
          </div>
          <h3 className="text-slate-700 font-semibold mb-2">Aucune classe créée</h3>
          <p className="text-slate-500 text-sm mb-4">Commencez par créer vos classes.</p>
          <Link href="/admin/classes/nouveau"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition">
            <Plus size={16} />
            Créer une classe
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes?.map(cls => {
            const studentCount = (cls.students as unknown as { count: number }[])?.[0]?.count ?? 0
            return (
              <Link key={cls.id} href={`/admin/classes/${cls.id}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition">{cls.name}</h3>
                    {cls.level && <p className="text-slate-500 text-sm">{cls.level}</p>}
                  </div>
                  <Edit size={16} className="text-slate-400 group-hover:text-blue-500 transition" />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCapIcon />
                  <span className="text-slate-600">{studentCount} élève{studentCount > 1 ? 's' : ''}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function GraduationCapIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  )
}
