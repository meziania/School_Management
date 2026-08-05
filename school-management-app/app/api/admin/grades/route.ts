import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gradeSchema } from '@/lib/validations/schemas'

/**
 * POST /api/admin/grades
 * Supporte 1 note (objet) OU saisie en masse (tableau de notes dans `entries`)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const school_id = user.user_metadata?.school_id

    // Saisie en masse (Class Mode)
    if (Array.isArray(body.entries)) {
      const validEntries = body.entries
        .filter((e: any) => e.score !== '' && e.score !== null && !isNaN(parseFloat(e.score)))
        .map((e: any) => ({
          school_id,
          created_by: user.id,
          student_id: e.student_id,
          subject: e.subject,
          score: parseFloat(e.score),
          coefficient: parseFloat(e.coefficient || 1),
          term: parseInt(e.term || 1),
          date: e.date || new Date().toISOString().split('T')[0],
          comment: e.comment || null,
        }))

      if (validEntries.length === 0) {
        return NextResponse.json({ error: 'Aucune note valide à enregistrer.' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('grades')
        .insert(validEntries)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data, error: null })
    }

    // Saisie individuelle
    const parsed = gradeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('grades')
      .insert({
        ...parsed.data,
        school_id,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de l\'ajout de la note.' }, { status: 500 })
    }

    return NextResponse.json({ data, error: null })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

/**
 * GET /api/admin/grades?student_id=...&class_id=...&subject=...&term=...
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const student_id = searchParams.get('student_id')
    const class_id = searchParams.get('class_id')
    const subject = searchParams.get('subject')
    const term = searchParams.get('term')

    let query = supabase.from('grades').select('*, students(first_name, last_name, class_id)').order('date', { ascending: false })

    if (student_id) query = query.eq('student_id', student_id)
    if (subject) query = query.eq('subject', subject)
    if (term) query = query.eq('term', parseInt(term))

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Si filtré par classe, filtrer en mémoire
    let filteredData = data ?? []
    if (class_id) {
      filteredData = filteredData.filter((g: any) => g.students?.class_id === class_id)
    }

    return NextResponse.json({ data: filteredData, error: null })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/grades?id=...
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const { error } = await supabase.from('grades').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
