import { requireTeacher } from '@/lib/auth/get-session'
import Link from 'next/link'
import {
  LayoutDashboard,
  School,
  ClipboardList,
  BarChart3,
  Megaphone,
  MessageSquare,
  LogOut,
  GraduationCap,
} from 'lucide-react'

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireTeacher()

  const navItems = [
    { href: '/teacher/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/teacher/classes', label: 'Mes Classes', icon: School },
    { href: '/teacher/presence', label: 'Présences', icon: ClipboardList },
    { href: '/teacher/notes', label: 'Notes & Examens', icon: BarChart3 },
    { href: '/teacher/annonces', label: 'Annonces', icon: Megaphone },
    { href: '/teacher/messagerie', label: 'Messagerie', icon: MessageSquare },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Enseignant */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between flex-shrink-0 min-h-screen">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
              <GraduationCap size={20} />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block">ESPACE PROF</span>
              <span className="text-xs text-indigo-400 font-medium truncate block max-w-[140px]">
                {profile.full_name || profile.email}
              </span>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-white transition text-slate-400"
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Déconnexion */}
        <div className="p-4 border-t border-slate-800">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
