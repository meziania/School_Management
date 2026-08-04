import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Élèves — EcoleConnect',
}

export default async function ElevesPage({
  searchParams,
}: {
  searchParams: Promise<{ class_id?: string; search?: string }>
}) {
  await requireAdmin()
  const supabase = await createClient()
  const params = await searchParams

  // Charger les classes pour le filtre
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, level')
    .eq('is_active', true)
    .order('name')

  // Requête élèves avec filtre
  let query = supabase
    .from('students')
    .select('*, classes(name)')
    .eq('is_active', true)
    .order('last_name')
    .order('first_name')

  if (params.class_id) {
    query = query.eq('class_id', params.class_id)
  }

  const { data: students } = await query

  const filtered = params.search
    ? students?.filter(s =>
        `${s.last_name} ${s.first_name}`.toLowerCase().includes(params.search!.toLowerCase())
      )
    : students

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Élèves</h1>
          <p className="text-slate-500 mt-1">{filtered?.length ?? 0} élève{(filtered?.length ?? 0) > 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/eleves/nouveau"
          id="btn-new-student"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white
                     font-medium rounded-xl transition-all duration-200 shadow-sm"
        >
          <Plus size={18} />
          Nouvel élève
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <form className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            id="search-students"
            name="search"
            defaultValue={params.search}
            placeholder="Rechercher un élève..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white
                       text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </form>

        <div className="flex gap-2 flex-wrap">
          <Link
            href="/admin/eleves"
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
              !params.class_id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            }`}
          >
            Toutes
          </Link>
          {classes?.map(cls => (
            <Link
              key={cls.id}
              href={`/admin/eleves?class_id=${cls.id}`}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition ${
                params.class_id === cls.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              {cls.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      {(filtered?.length ?? 0) === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500">Aucun élève trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nom</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Classe</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Date de naissance</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered?.map(student => (
                <tr key={student.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-xs font-semibold">
                          {student.first_name[0]}{student.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{student.last_name} {student.first_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                      {(student.classes as any)?.name ?? 'Non assigné'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-sm hidden md:table-cell">
                    {student.birth_date ? formatDate(student.birth_date) : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/eleves/${student.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline transition">
                      Détails
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
