import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import AnnouncementsManager from '@/components/announcements/AnnouncementsManager'

export const metadata: Metadata = { title: 'Annonces — EcoleConnect' }

export default async function AdminAnnoncesPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, users(full_name), classes(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Annonces & Communication</h1>
          <p className="text-slate-500 text-sm mt-0.5">Publication et gestion des communiqués officiels</p>
        </div>
      </div>

      {/* Interactive Announcements Manager (Create, Edit Modal, Delete) */}
      <AnnouncementsManager
        classes={classes ?? []}
        initialAnnouncements={(announcements as any[]) ?? []}
      />
    </div>
  )
}
