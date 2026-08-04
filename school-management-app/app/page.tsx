import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Page racine — redirige selon le rôle
 */
export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const role = user.user_metadata?.role
  if (role === 'school_admin') redirect('/admin/dashboard')
  if (role === 'parent') redirect('/parent/dashboard')
  if (role === 'super_admin') redirect('/super-admin')

  redirect('/login')
}
