import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { studentSchema } from '@/lib/validations/schemas'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const class_id = searchParams.get('class_id')
    let query = supabase.from('students').select('*, classes(name, level, filiere)').eq('is_active', true).order('last_name')
    if (class_id) query = query.eq('class_id', class_id)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, error: null })
  } catch { return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const body = await request.json()
    const parsed = studentSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    const school_id = user.user_metadata?.school_id
    const { data, error } = await supabase.from('students').insert({ ...parsed.data, school_id }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, error: null })
  } catch { return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 }) }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })
    const body = await request.json()
    const parsed = studentSchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    const { data, error } = await supabase.from('students').update(parsed.data).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, error: null })
  } catch { return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 }) }
}
