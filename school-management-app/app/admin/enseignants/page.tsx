import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap, Mail, BookOpen } from 'lucide-react'
import InviteTeacherForm from '@/components/InviteTeacherForm'

export const metadata: Metadata = { title: 'Enseignants — EcoleConnect' }

export default async function EnseignantsAdminPage() {
  await requireAdmin()
  const supabase = await createClient()

  const { data: teachers } = await supabase
    .from('users')
    .select('*, teacher_classes(id, class_id, subject, classes(name, level))')
    .eq('role', 'teacher')
    .order('full_name')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, level')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Corps Enseignant</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestion des comptes professeurs et affectation des classes & matières</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Formulaire d'ajout d'enseignant avec Multi-Sélection Classes & Dropdown Matière */}
        <InviteTeacherForm classes={(classes as any[]) ?? []} />

        {/* Liste des professeurs */}
        <div className="md:col-span-2 space-y-3">
          <h2 className="font-extrabold text-slate-800 text-base">Professeurs actifs ({teachers?.length ?? 0})</h2>

          {(teachers?.length ?? 0) === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <GraduationCap className="text-slate-300 mx-auto mb-2" size={32} />
              <p className="text-slate-500 text-sm font-medium">Aucun professeur enregistré pour le moment.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
              {teachers?.map(t => (
                <div key={t.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-700 text-sm font-extrabold">{t.full_name?.[0] ?? 'P'}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900 text-sm">{t.full_name ?? 'Professeur'}</p>
                      <p className="text-slate-500 text-xs flex items-center gap-1 font-medium">
                        <Mail size={12} className="text-slate-400" /> {t.email}
                      </p>

                      {/* Classes et Matières affectées */}
                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {(t.teacher_classes as any[])?.length === 0 ? (
                          <span className="text-slate-400 text-xs italic">Aucune classe affectée</span>
                        ) : (
                          (t.teacher_classes as any[])?.map(tc => tc.classes && (
                            <span key={tc.id} className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-900 text-xs font-bold border border-indigo-100 flex items-center gap-1">
                              <BookOpen size={12} className="text-indigo-600" /> {tc.subject} ({tc.classes.name})
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 🌟 Contacter link pointing to contactId query param */}
                  <Link
                    href={`/admin/messagerie?contactId=${t.id}`}
                    className="text-xs text-indigo-600 font-bold hover:underline flex-shrink-0 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition"
                  >
                    Contacter →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
