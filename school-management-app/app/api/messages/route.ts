import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { messageSchema } from '@/lib/validations/schemas'

/**
 * POST /api/messages
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = messageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const school_id = user.user_metadata?.school_id
    const role = user.user_metadata?.role

    // Vérification : parent ne peut contacter que des school_admin de son école
    if (role === 'parent') {
      const { data: receiver } = await supabase
        .from('users')
        .select('role, school_id')
        .eq('id', parsed.data.receiver_id)
        .single()

      if (!receiver || receiver.role !== 'school_admin' || receiver.school_id !== school_id) {
        return NextResponse.json(
          { error: 'Vous ne pouvez contacter que les administrateurs de votre école.' },
          { status: 403 }
        )
      }
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        school_id,
        sender_id: user.id,
        receiver_id: parsed.data.receiver_id,
        content: parsed.data.content,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de l\'envoi.' }, { status: 500 })
    }

    // Créer une notification pour le destinataire
    await supabase.from('notifications').insert({
      school_id,
      user_id: parsed.data.receiver_id,
      type: 'message',
      content: `Nouveau message de ${user.user_metadata?.full_name ?? user.email}`,
      link: '/admin/messagerie',
    })

    return NextResponse.json({ data, error: null })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

/**
 * GET /api/messages?with=user_id
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const withUserId = searchParams.get('with')

    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })

    if (withUserId) {
      query = query.or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${withUserId}),and(sender_id.eq.${withUserId},receiver_id.eq.${user.id})`
      )
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data, error: null })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
