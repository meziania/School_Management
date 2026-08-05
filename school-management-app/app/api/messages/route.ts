import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/messages
 * Supports FormData and JSON submissions
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let receiver_id = ''
    let content = ''
    let isFormData = false

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      isFormData = true
      const formData = await request.formData()
      receiver_id = (formData.get('receiver_id') as string) || ''
      content = (formData.get('content') as string) || ''
    } else {
      const body = await request.json()
      receiver_id = body.receiver_id || ''
      content = body.content || ''
    }

    if (!receiver_id || !content?.trim()) {
      if (isFormData) {
        return NextResponse.redirect(new URL(`/admin/messagerie?contactId=${receiver_id}`, request.url), 303)
      }
      return NextResponse.json({ error: 'Message ou destinataire manquant.' }, { status: 400 })
    }

    const school_id = user.user_metadata?.school_id
    const role = user.user_metadata?.role

    // Verification: parent can only contact school_admin from their school
    if (role === 'parent') {
      const { data: receiver } = await supabase
        .from('users')
        .select('role, school_id')
        .eq('id', receiver_id)
        .single()

      if (!receiver || receiver.role !== 'school_admin' || receiver.school_id !== school_id) {
        if (isFormData) {
          return NextResponse.redirect(new URL(`/parent/messagerie?error=unauthorized`, request.url), 303)
        }
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
        receiver_id,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur insertion message:', error)
      if (isFormData) {
        return NextResponse.redirect(new URL(`/admin/messagerie?contactId=${receiver_id}&error=1`, request.url), 303)
      }
      return NextResponse.json({ error: 'Erreur lors de l\'envoi.' }, { status: 500 })
    }

    // Create notification for recipient
    await supabase.from('notifications').insert({
      school_id,
      user_id: receiver_id,
      type: 'message',
      content: `Nouveau message de ${user.user_metadata?.full_name ?? user.email}`,
      link: role === 'parent' ? `/admin/messagerie?contactId=${user.id}` : `/parent/messagerie?contactId=${user.id}`,
    })

    if (isFormData) {
      const basePath = role === 'parent' ? '/parent/messagerie' : role === 'teacher' ? '/teacher/messagerie' : '/admin/messagerie'
      return NextResponse.redirect(new URL(`${basePath}?contactId=${receiver_id}`, request.url), 303)
    }

    return NextResponse.json({ data, error: null })
  } catch (error) {
    console.error('Erreur API messages:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

/**
 * GET /api/messages?with=user_id OR ?contactId=user_id
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const withUserId = searchParams.get('contactId') || searchParams.get('with')

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
