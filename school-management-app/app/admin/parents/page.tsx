import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, Mail, Phone, GraduationCap } from 'lucide-react'
import InviteParentForm from '@/components/InviteParentForm'

export const metadata: Metadata = { title: 'Parents — EcoleConnect' }

export default async function ParentsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string; success?: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()
  const params = await searchParams

  const { data: parents } = await supabase
    .from('users')
    .select('*, parent_students(student_id, students(first_name, last_name, classes(name)))')
    .eq('role', 'parent')
    .order('full_name')

  const { data: students } = await supabase
    .from('students')
    .select('id, first_name, last_name, classes(name)')
    .eq('is_active', true)
    .order('last_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Parents</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Gestion des comptes et liaisons parents-élèves</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Formulaire d'invitation parent */}
        <InviteParentForm
          students={(students as any[]) ?? []}
          defaultStudentId={params.student_id || ''}
        />

        {/* Liste des parents */}
        <div className="md:col-span-2 space-y-3">
          <h2 className="font-extrabold text-slate-800 text-base">Parents inscrits ({parents?.length ?? 0})</h2>

          {(parents?.length ?? 0) === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Users className="text-slate-300 mx-auto mb-2" size={32} />
              <p className="text-slate-500 text-sm font-medium">Aucun parent n'a encore été invité.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
              {parents?.map(p => (
                <div key={p.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      {p.full_name?.[0] ?? 'P'}
                    </div>
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900 text-sm">{p.full_name ?? 'Parent'}</p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Mail size={12} className="text-slate-400" /> {p.email}
                        </span>
                        {p.phone && (
                          <span className="flex items-center gap-1 text-slate-700 font-bold">
                            <Phone size={12} className="text-purple-600" /> {p.phone}
                          </span>
                        )}
                      </div>

                      {/* Associated Children List Badges */}
                      <div className="pt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <GraduationCap size={13} className="text-purple-600" />
                          Enfants :
                        </span>
                        {(p.parent_students as any[])?.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Aucun élève lié</span>
                        ) : (
                          (p.parent_students as any[])?.map(ps => ps.students && (
                            <span key={ps.student_id} className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 text-xs font-bold border border-purple-200 inline-flex items-center gap-1">
                              👶 {ps.students.first_name} {ps.students.last_name}
                              {(ps.students.classes as any)?.name && (
                                <span className="text-purple-600 font-normal">({(ps.students.classes as any).name})</span>
                              )}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 🌟 Contacter link pointing to contactId query param */}
                  <Link
                    href={`/admin/messagerie?contactId=${p.id}`}
                    className="text-xs text-blue-600 font-bold hover:underline flex-shrink-0 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition"
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
