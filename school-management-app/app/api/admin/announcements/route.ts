import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { announcementSchema } from '@/lib/validations/schemas'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    const { data, error } = await supabase.from('announcements').select('*, users(full_name)').order('created_at', { ascending: false })
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
    const parsed = announcementSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })

    const school_id = user.user_metadata?.school_id

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({ ...parsed.data, school_id, created_by: user.id })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Créer des notifications pour les parents concernés
    let parentsQuery = supabase.from('users').select('id').eq('role', 'parent').eq('school_id', school_id)
    const { data: parents } = await parentsQuery

    if (parents && parents.length > 0) {
      await supabase.from('notifications').insert(
        parents.map(parent => ({
          school_id,
          user_id: parent.id,
          type: 'announcement' as const,
          content: `Nouvelle annonce : ${parsed.data.title}`,
          link: '/parent/annonces',
        }))
      )
    }

    return NextResponse.json({ data: announcement, error: null })
  } catch { return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 }) }
}
