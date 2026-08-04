import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gradeSchema } from '@/lib/validations/schemas'
import { z } from 'zod'

/**
 * POST /api/admin/grades
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = gradeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const school_id = user.user_metadata?.school_id

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
 * GET /api/admin/grades?student_id=...&term=...
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
    const term = searchParams.get('term')

    let query = supabase.from('grades').select('*').order('date', { ascending: false })

    if (student_id) query = query.eq('student_id', student_id)
    if (term) query = query.eq('term', parseInt(term))

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data, error: null })
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
