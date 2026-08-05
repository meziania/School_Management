import { requireTeacher } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import AdminAnnouncementsPage from '@/app/admin/annonces/page'

export const metadata: Metadata = { title: 'Annonces — EcoleConnect' }

export default async function TeacherAnnoncesPage() {
  await requireTeacher()
  return <AdminAnnouncementsPage />
}
