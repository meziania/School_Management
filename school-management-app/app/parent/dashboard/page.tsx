import { requireParent } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDate, attendanceStatusLabel, attendanceStatusClasses, gradeColor } from '@/lib/utils'
import { AlertCircle, CheckCircle, Clock, MessageSquare, Megaphone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tableau de bord — EcoleConnect',
  description: 'Suivi de vos enfants en temps réel',
}

export default async function ParentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string }>
}) {
  const profile = await requireParent()
  const supabase = await createClient()
  const params = await searchParams

  // Récupérer les enfants du parent
  const parentStudentsResult = await supabase
    .from('parent_students')
    .select('student_id, students(id, first_name, last_name, classes(name))')
    .eq('parent_user_id', profile.id)
  const parentStudents = parentStudentsResult.data as any[] | null

  const children = (parentStudents as any[])?.map((ps: any) => ps.students).filter(Boolean) ?? []
  const activeChild = children.find(c => c?.id === params.student_id) ?? children[0]

  if (!activeChild) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-slate-400" size={28} />
          </div>
          <h2 className="text-slate-700 font-semibold mb-2">Aucun enfant lié</h2>
          <p className="text-slate-500 text-sm">Contactez l'administration de l'école pour vous associer à vos enfants.</p>
        </div>
      </div>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Données en parallèle
  const [
    { data: recentAttendance },
    { data: recentGrades },
    { data: unreadNotifications },
    { data: announcements },
  ] = await Promise.all([
    supabase.from('attendance').select('*')
      .eq('student_id', activeChild.id)
      .gte('date', sevenDaysAgo)
      .order('date', { ascending: false }),
    supabase.from('grades').select('*')
      .eq('student_id', activeChild.id)
      .order('date', { ascending: false })
      .limit(5),
    supabase.from('notifications').select('*')
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false }),
    supabase.from('announcements').select('*')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const presentDays = recentAttendance?.filter(a => a.status === 'present').length ?? 0
  const totalDays = recentAttendance?.length ?? 0
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : null
  const todayAttendance = recentAttendance?.find(a => a.date === today)
  const unjustifiedAbsences = recentAttendance?.filter(a => a.status === 'absent' && !a.is_justified) ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bonjour{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋</h1>
        <p className="text-slate-500 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Sélecteur enfant */}
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map(child => child && (
            <Link
              key={child.id}
              href={`/parent/dashboard?student_id=${child.id}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                activeChild.id === child.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              {child.first_name} {child.last_name}
            </Link>
          ))}
        </div>
      )}

      {/* Enfant actif */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">
              {activeChild.first_name[0]}{activeChild.last_name[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900">{activeChild.first_name} {activeChild.last_name}</h2>
            <p className="text-slate-500 text-sm">{(activeChild.classes as any)?.name}</p>
          </div>

          {/* Statut du jour */}
          {todayAttendance && (
            <div className={`px-3 py-1.5 rounded-xl border text-sm font-medium ${attendanceStatusClasses(todayAttendance.status)}`}>
              {todayAttendance.status === 'present' && <CheckCircle size={14} className="inline mr-1.5" />}
              {todayAttendance.status === 'absent' && <AlertCircle size={14} className="inline mr-1.5" />}
              {todayAttendance.status === 'late' && <Clock size={14} className="inline mr-1.5" />}
              {attendanceStatusLabel(todayAttendance.status)} aujourd'hui
            </div>
          )}
        </div>
      </div>

      {/* Alertes urgentes */}
      {unjustifiedAbsences.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <h3 className="font-semibold text-red-900">
              {unjustifiedAbsences.length} absence{unjustifiedAbsences.length > 1 ? 's' : ''} non justifiée{unjustifiedAbsences.length > 1 ? 's' : ''}
            </h3>
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            {unjustifiedAbsences.slice(0, 3).map(a => (
              <Link
                key={a.id}
                href={`/parent/absences/${a.id}/justifier`}
                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-lg border border-red-200 transition"
              >
                {formatDate(a.date)} — Justifier
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Grille de stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Assiduité */}
        <Link href="/parent/presence"
          className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition">
          <p className="text-slate-500 text-sm mb-1">Assiduité (7j)</p>
          <p className="text-3xl font-bold text-slate-900">
            {attendanceRate !== null ? `${attendanceRate}%` : '—'}
          </p>
          <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                (attendanceRate ?? 0) >= 90 ? 'bg-green-500' :
                (attendanceRate ?? 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${attendanceRate ?? 0}%` }}
            />
          </div>
        </Link>

        {/* Notifications */}
        <Link href="/parent/messagerie"
          className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition">
          <p className="text-slate-500 text-sm mb-1">Non lus</p>
          <p className="text-3xl font-bold text-slate-900">{unreadNotifications?.length ?? 0}</p>
          <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-sm">
            <MessageSquare size={14} />
            <span>messages & alertes</span>
          </div>
        </Link>
      </div>

      {/* Dernières notes */}
      {(recentGrades?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Dernières notes</h3>
            <Link href="/parent/notes" className="text-blue-600 hover:text-blue-700 text-sm font-medium transition">
              Voir toutes →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentGrades?.map(grade => (
              <div key={grade.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="font-medium text-slate-700 text-sm">{grade.subject}</p>
                <p className={`text-2xl font-bold mt-1 ${gradeColor(grade.score)}`}>
                  {grade.score}/20
                </p>
                <p className="text-slate-400 text-xs mt-1">{formatDate(grade.date)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Annonces récentes */}
      {(announcements?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Annonces</h3>
            <Link href="/parent/annonces" className="text-blue-600 hover:text-blue-700 text-sm font-medium transition">
              Voir toutes →
            </Link>
          </div>
          <div className="space-y-3">
            {announcements?.map(ann => (
              <div key={ann.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Megaphone className="text-blue-600" size={15} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{ann.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{ann.content}</p>
                    <p className="text-slate-400 text-xs mt-1">{formatDate(ann.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
