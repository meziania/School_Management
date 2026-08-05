import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Users, Plus, Edit } from 'lucide-react'

export const metadata: Metadata = { title: 'Détail Classe — EcoleConnect' }

export default async function DetailClassePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()
  const { id } = await params

  const { data: cls } = await supabase
    .from('classes')
    .select('*')
    .eq('id', id)
    .single()

  if (!cls) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-semibold text-slate-800">Classe introuvable</h2>
        <Link href="/admin/classes" className="text-blue-600 hover:underline mt-2 inline-block text-sm">
          ← Retour aux classes
        </Link>
      </div>
    )
  }

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', id)
    .eq('is_active', true)
    .order('last_name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/classes" className="p-2 rounded-xl hover:bg-slate-200 text-slate-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{cls.name}</h1>
            {cls.level && <p className="text-slate-500 text-sm">Niveau : {cls.level}</p>}
          </div>
        </div>

        <Link
          href={`/admin/eleves/nouveau?class_id=${cls.id}`}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition shadow-sm text-sm"
        >
          <Plus size={16} />
          Ajouter un élève
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Users size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{students?.length ?? 0} élève{(students?.length ?? 0) > 1 ? 's' : ''}</p>
            <p className="text-slate-500 text-xs">Inscrits dans cette classe</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 font-semibold text-slate-800">
          Liste des élèves
        </div>

        {(students?.length ?? 0) === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">Aucun élève dans cette classe</p>
            <Link
              href={`/admin/eleves/nouveau?class_id=${cls.id}`}
              className="mt-3 inline-flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:underline"
            >
              <Plus size={16} /> Ajouter le premier élève
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {students?.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-semibold">{s.first_name[0]}{s.last_name[0]}</span>
                  </div>
                  <p className="font-medium text-slate-900 text-sm">{s.last_name} {s.first_name}</p>
                </div>
                <Link href={`/admin/eleves/${s.id}`} className="text-blue-600 text-xs font-medium hover:underline">
                  Voir profil →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
