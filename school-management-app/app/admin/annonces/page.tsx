import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { formatDateTime } from '@/lib/utils'
import { Megaphone, Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Annonces — EcoleConnect' }

export default async function AdminAnnoncesPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: classes } = await supabase.from('classes').select('id, name').eq('is_active', true).order('name')
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, users(full_name), classes(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Annonces</h1>
          <p className="text-slate-500 mt-1">Communiquez avec les parents</p>
        </div>
      </div>

      {/* Formulaire nouvelle annonce */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Megaphone size={18} className="text-blue-600" />
          Publier une annonce
        </h2>
        <form action="/api/admin/announcements" method="post" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Titre *</label>
            <input
              id="announcement-title"
              name="title"
              required
              placeholder="Titre de l'annonce"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contenu *</label>
            <textarea
              id="announcement-content"
              name="content"
              required
              rows={4}
              placeholder="Rédigez votre annonce..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Destinataires</label>
            <select
              id="announcement-target"
              name="class_id"
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toute l'école</option>
              {classes?.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <button
            id="btn-publish-announcement"
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition shadow-sm"
          >
            <Plus size={16} />
            Publier l'annonce
          </button>
        </form>
      </div>

      {/* Liste des annonces */}
      <div className="space-y-3">
        <h2 className="font-semibold text-slate-700">Annonces publiées</h2>
        {(announcements?.length ?? 0) === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500">Aucune annonce publiée</p>
          </div>
        ) : (
          announcements?.map(ann => (
            <article key={ann.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-slate-900">{ann.title}</h3>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs border border-blue-100">
                      {(ann.classes as any)?.name ?? 'Toute l\'école'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm line-clamp-2">{ann.content}</p>
                  <p className="text-slate-400 text-xs mt-2">{formatDateTime(ann.created_at)}</p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
