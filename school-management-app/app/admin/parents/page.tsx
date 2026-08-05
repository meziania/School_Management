import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, Mail } from 'lucide-react'
import InviteParentForm from '@/components/InviteParentForm'

export const metadata: Metadata = { title: 'Parents — EcoleConnect' }

export default async function ParentsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string }>
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
          <p className="text-slate-500 mt-1 text-sm">Gestion des comptes et liaisons parents-élèves</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Formulaire d'invitation parent avec Searchable Select */}
        <InviteParentForm
          students={(students as any[]) ?? []}
          defaultStudentId={params.student_id || ''}
        />

        {/* Liste des parents */}
        <div className="md:col-span-2 space-y-3">
          <h2 className="font-semibold text-slate-800">Parents inscrits ({parents?.length ?? 0})</h2>

          {(parents?.length ?? 0) === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <Users className="text-slate-300 mx-auto mb-2" size={32} />
              <p className="text-slate-500 text-sm">Aucun parent n'a encore été invité.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-sm">
              {parents?.map(p => (
                <div key={p.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 text-sm font-semibold">{p.full_name?.[0] ?? 'P'}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{p.full_name ?? 'Parent'}</p>
                      <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                        <Mail size={12} /> {p.email}
                      </p>
                      {/* Enfants associés */}
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {(p.parent_students as any[])?.map(ps => ps.students && (
                          <span key={ps.student_id} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                            👶 {ps.students.first_name} {ps.students.last_name} ({(ps.students.classes as any)?.name})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Link href={`/admin/messagerie?with=${p.id}`}
                    className="text-xs text-blue-600 font-medium hover:underline flex-shrink-0">
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
