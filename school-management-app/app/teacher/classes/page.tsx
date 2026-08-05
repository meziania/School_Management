import { requireTeacher } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { School, Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Mes Classes — EcoleConnect' }

export default async function TeacherClassesPage() {
  const profile = await requireTeacher()
  const supabase = await createClient()

  const { data: teacherClasses } = await supabase
    .from('teacher_classes')
    .select('*, classes(id, name, level, students(id, first_name, last_name))')
    .eq('teacher_user_id', profile.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mes Classes & Listes d'Élèves</h1>
        <p className="text-slate-500 text-sm mt-0.5">Consultez la liste des élèves inscrits dans vos classes</p>
      </div>

      <div className="space-y-6">
        {teacherClasses?.map((tc: any) => (
          <div key={tc.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                  {tc.classes?.level}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">{tc.classes?.name}</h2>
                <p className="text-slate-500 text-xs font-semibold mt-0.5">Matière : {tc.subject}</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl">
                {tc.classes?.students?.length ?? 0} Élèves
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {tc.classes?.students?.map((st: any, idx: number) => (
                <div key={st.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{st.last_name} {st.first_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
