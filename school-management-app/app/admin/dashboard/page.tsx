import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, GraduationCap, ClipboardList, MessageSquare, AlertCircle, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tableau de bord Admin — EcoleConnect',
  description: 'Vue d\'ensemble de votre école',
}

export default async function AdminDashboardPage() {
  const profile = await requireAdmin()
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Requêtes parallèles pour les KPIs
  const [
    { count: totalStudents },
    { count: totalClasses },
    { data: todayAttendance },
    { count: unreadMessages },
    { count: pendingJustifications },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('classes').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('attendance').select('status').eq('date', today),
    supabase.from('messages').select('*', { count: 'exact', head: true })
      .eq('receiver_id', profile.id).eq('is_read', false),
    supabase.from('attendance').select('*', { count: 'exact', head: true })
      .eq('status', 'absent').eq('is_justified', false).not('justification', 'is', null),
  ])

  const absentToday = todayAttendance?.filter(a => a.status === 'absent').length ?? 0
  const lateToday = todayAttendance?.filter(a => a.status === 'late').length ?? 0

  const kpis = [
    {
      label: 'Élèves inscrits',
      value: totalStudents ?? 0,
      icon: GraduationCap,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      href: '/admin/eleves',
    },
    {
      label: 'Classes actives',
      value: totalClasses ?? 0,
      icon: Users,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      href: '/admin/classes',
    },
    {
      label: 'Absents aujourd\'hui',
      value: absentToday,
      icon: ClipboardList,
      color: absentToday > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100',
      href: '/admin/presence',
    },
    {
      label: 'Messages non lus',
      value: unreadMessages ?? 0,
      icon: MessageSquare,
      color: (unreadMessages ?? 0) > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-600 border-slate-100',
      href: '/admin/messagerie',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}
            className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <div className={`inline-flex p-2.5 rounded-xl border ${color} mb-3`}>
              <Icon size={20} />
            </div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <p className="text-slate-500 text-sm mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Alertes */}
      {((pendingJustifications ?? 0) > 0 || lateToday > 0) && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Alertes</h2>
          <div className="grid gap-3">
            {(pendingJustifications ?? 0) > 0 && (
              <Link href="/admin/justificatifs"
                className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition">
                <FileText className="text-amber-600 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-amber-900">
                    {pendingJustifications} justificatif{(pendingJustifications ?? 0) > 1 ? 's' : ''} en attente
                  </p>
                  <p className="text-amber-700 text-sm">Cliquez pour examiner</p>
                </div>
              </Link>
            )}
            {lateToday > 0 && (
              <Link href="/admin/presence"
                className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-yellow-900">{lateToday} élève{lateToday > 1 ? 's' : ''} en retard aujourd'hui</p>
                  <p className="text-yellow-700 text-sm">Voir la feuille de présence</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Raccourcis */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Accès rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { href: '/admin/presence', label: 'Saisir la présence', desc: `Pour aujourd'hui` },
            { href: '/admin/notes', label: 'Ajouter des notes', desc: 'Saisie par élève' },
            { href: '/admin/eleves/nouveau', label: 'Nouvel élève', desc: 'Inscrire un élève' },
            { href: '/admin/parents', label: 'Inviter un parent', desc: 'Par email' },
            { href: '/admin/annonces', label: 'Publier une annonce', desc: 'Toute l\'école' },
            { href: '/admin/classes', label: 'Gérer les classes', desc: 'Niveaux et groupes' },
          ].map(({ href, label, desc }) => (
            <Link key={href} href={href}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200 group">
              <p className="font-medium text-slate-900 group-hover:text-blue-600 transition">{label}</p>
              <p className="text-slate-500 text-sm mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
