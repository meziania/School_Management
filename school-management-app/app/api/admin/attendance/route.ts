import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { attendanceBatchSchema } from '@/lib/validations/schemas'

/**
 * POST /api/admin/attendance
 * Enregistre la présence d'une classe pour une date donnée
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = attendanceBatchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const { class_id, date, entries } = parsed.data

    // Vérifier que tous les élèves appartiennent à la même école
    const school_id = user.user_metadata?.school_id

    // Upsert les présences (update si existe, insert sinon)
    const records = entries.map(entry => ({
      school_id,
      student_id: entry.student_id,
      date,
      status: entry.status,
      created_by: user.id,
    }))

    const { error } = await supabase
      .from('attendance')
      .upsert(records, {
        onConflict: 'student_id,date',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Erreur attendance upsert:', error)
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement.' }, { status: 500 })
    }

    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error) {
    console.error('Erreur API attendance:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

/**
 * GET /api/admin/attendance?class_id=...&date=...
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const class_id = searchParams.get('class_id')
    const date = searchParams.get('date')

    if (!class_id || !date) {
      return NextResponse.json({ error: 'class_id et date sont requis.' }, { status: 400 })
    }

    // Récupérer les élèves de la classe
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('class_id', class_id)
      .eq('is_active', true)

    const studentIds = students?.map(s => s.id) ?? []

    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', date)
      .in('student_id', studentIds)

    return NextResponse.json({ data: attendance, error: null })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
