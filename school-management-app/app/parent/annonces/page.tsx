import { requireParent } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { formatDateTime } from '@/lib/utils'
import { Megaphone } from 'lucide-react'

export const metadata: Metadata = { title: 'Annonces — EcoleConnect' }

export default async function ParentAnnoncesPage() {
  const profile = await requireParent()
  const supabase = await createClient()

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, users(full_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Annonces</h1>

      {(announcements?.length ?? 0) === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="text-slate-400" size={24} />
          </div>
          <p className="text-slate-500">Aucune annonce publiée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements?.map(ann => (
            <article key={ann.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-sm transition">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="text-blue-600" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-slate-900 mb-1">{ann.title}</h2>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  <p className="text-slate-400 text-xs mt-3">
                    {formatDateTime(ann.created_at)}
                    {ann.users && ` · ${(ann.users as any).full_name}`}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
