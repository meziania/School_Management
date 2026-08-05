import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap, UserPlus, Mail, BookOpen, School } from 'lucide-react'

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
        {/* Formulaire d'ajout d'enseignant */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-fit shadow-sm">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <UserPlus size={18} className="text-indigo-600" />
            Ajouter un professeur
          </h2>

          <form action="/api/admin/teachers" method="post" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom complet du professeur *</label>
              <input
                id="teacher-name-input"
                name="full_name"
                required
                placeholder="ex: Prof. Hassan El Amrani"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email professionnel *</label>
              <input
                id="teacher-email-input"
                type="email"
                name="email"
                required
                placeholder="ex: hassan.elamrani@ecole.ma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Matière enseignée</label>
              <input
                id="teacher-subject-input"
                type="text"
                name="subject"
                placeholder="ex: Mathématiques, Physique-Chimie"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Classe à affecter</label>
              <select
                id="teacher-class-select"
                name="class_id"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">Sélectionner une classe</option>
                {classes?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.level ? `[${c.level}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="btn-add-teacher"
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-sm shadow-sm"
            >
              Enregistrer le professeur
            </button>
          </form>
        </div>

        {/* Liste des professeurs */}
        <div className="md:col-span-2 space-y-3">
          <h2 className="font-semibold text-slate-800">Professeurs actifs ({teachers?.length ?? 0})</h2>

          {(teachers?.length ?? 0) === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <GraduationCap className="text-slate-300 mx-auto mb-2" size={32} />
              <p className="text-slate-500 text-sm">Aucun professeur enregistré pour le moment.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
              {teachers?.map(t => (
                <div key={t.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-700 text-sm font-extrabold">{t.full_name?.[0] ?? 'P'}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{t.full_name ?? 'Professeur'}</p>
                      <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                        <Mail size={12} /> {t.email}
                      </p>

                      {/* Classes et Matières affectées */}
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {(t.teacher_classes as any[])?.length === 0 ? (
                          <span className="text-slate-400 text-xs italic">Aucune classe affectée</span>
                        ) : (
                          (t.teacher_classes as any[])?.map(tc => tc.classes && (
                            <span key={tc.id} className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-800 text-xs font-bold border border-indigo-100 flex items-center gap-1">
                              <BookOpen size={12} /> {tc.subject} ({tc.classes.name})
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <Link href={`/admin/messagerie?with=${t.id}`}
                    className="text-xs text-indigo-600 font-bold hover:underline flex-shrink-0">
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
