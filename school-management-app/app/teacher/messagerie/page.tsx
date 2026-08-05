import { requireTeacher } from '@/lib/auth/get-session'
import type { Metadata } from 'next'
import AdminMessageriePage from '@/app/admin/messagerie/page'

export const metadata: Metadata = { title: 'Messagerie — EcoleConnect' }

export default async function TeacherMessageriePage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>
}) {
  await requireTeacher()
  return <AdminMessageriePage searchParams={searchParams} />
}
