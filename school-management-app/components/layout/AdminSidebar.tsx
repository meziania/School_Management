'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, GraduationCap, ClipboardList,
  BarChart3, Megaphone, MessageSquare, BookOpen, LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/classes', label: 'Classes', icon: BookOpen },
  { href: '/admin/eleves', label: 'Élèves', icon: GraduationCap },
  { href: '/admin/parents', label: 'Parents', icon: Users },
  { href: '/admin/presence', label: 'Présence', icon: ClipboardList },
  { href: '/admin/notes', label: 'Notes', icon: BarChart3 },
  { href: '/admin/annonces', label: 'Annonces', icon: Megaphone },
  { href: '/admin/messagerie', label: 'Messagerie', icon: MessageSquare },
]

export default function AdminSidebar({ schoolName }: { schoolName?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 border-r border-slate-800">
      {/* Logo & École */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Administration</p>
            <p className="text-white font-semibold text-sm truncate max-w-[140px]">{schoolName || 'Mon École'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          id="btn-logout-admin"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
                     text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-200"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
