'use client'

import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function TeacherLogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      id="btn-logout-teacher"
      type="button"
      onClick={handleLogout}
      className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
    >
      <LogOut size={16} />
      Déconnexion
    </button>
  )
}
