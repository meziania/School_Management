import { requireTeacher } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { School, Users, ClipboardList, BarChart3, Megaphone, ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Tableau de bord Enseignant — EcoleConnect' }

export default async function TeacherDashboardPage() {
  const profile = await requireTeacher()
  const supabase = await createClient()

  // Récupérer les classes assignées à ce professeur
  const { data: teacherClasses } = await supabase
    .from('teacher_classes')
    .select('id, subject, class_id, classes(id, name, level, students(id))')
    .eq('teacher_user_id', profile.id)

  const assignedClasses = teacherClasses ?? []
  const totalStudents = assignedClasses.reduce((sum, tc: any) => sum + (tc.classes?.students?.length ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Bonjour, {profile.full_name || 'Professeur'} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Espace de gestion de vos classes, saisie des présences et notes d'évaluations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Classes Assignées</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">{assignedClasses.length}</h2>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
            <School size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Élèves Enseignés</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">{totalStudents}</h2>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actions Rapides</span>
            <div className="flex gap-2 mt-2">
              <Link href="/teacher/presence" className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition border border-emerald-100">
                Présences
              </Link>
              <Link href="/teacher/notes" className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition border border-blue-100">
                Notes
              </Link>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <ClipboardList size={24} />
          </div>
        </div>
      </div>

      {/* Mes Classes Assignées */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Mes Classes & Matières</h2>

        {assignedClasses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <School className="text-slate-300 mx-auto" size={32} />
            <p className="text-slate-500 text-sm">Aucune classe n'a encore été assignée à votre compte par l'administration.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedClasses.map((tc: any) => (
              <div key={tc.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-indigo-200 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                      {tc.classes?.level || 'Niveau non défini'}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-lg mt-1">{tc.classes?.name}</h3>
                    <p className="text-slate-500 text-xs font-semibold mt-0.5">Matière : {tc.subject}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {tc.classes?.students?.length ?? 0} élèves
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <Link href={`/teacher/notes?class_id=${tc.class_id}`} className="text-indigo-600 hover:underline flex items-center gap-1">
                    Saisir notes <ArrowRight size={14} />
                  </Link>
                  <Link href={`/teacher/presence?class_id=${tc.class_id}`} className="text-emerald-600 hover:underline flex items-center gap-1">
                    Présences <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
