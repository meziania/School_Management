import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data, error } = await supabase
      .from('announcements')
      .select('*, classes(name)')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let title = ''
    let content = ''
    let targets: string[] = ['all']
    let attachment_url: string | null = null
    let attachment_name: string | null = null
    let isFormData = false

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      isFormData = true
      const formData = await request.formData()
      title = (formData.get('title') as string) || ''
      content = (formData.get('content') as string) || ''
      const rawTargets = formData.get('targets') as string
      if (rawTargets) {
        try { targets = JSON.parse(rawTargets) } catch { targets = [rawTargets] }
      }
      attachment_url = (formData.get('attachment_url') as string) || null
      attachment_name = (formData.get('attachment_name') as string) || null
    } else {
      const body = await request.json()
      title = body.title || ''
      content = body.content || ''
      targets = body.targets || ['all']
      attachment_url = body.attachment_url || null
      attachment_name = body.attachment_name || null
    }

    if (!title.trim() || !content.trim()) {
      if (isFormData) {
        return NextResponse.redirect(new URL('/admin/annonces?error=invalid', request.url), 303)
      }
      return NextResponse.json({ error: 'Titre et contenu requis.' }, { status: 400 })
    }

    const school_id = user.user_metadata?.school_id

    const classTarget = targets.find(t => t.startsWith('class:'))
    const class_id = classTarget ? classTarget.replace('class:', '') : null

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        school_id,
        created_by: user.id,
        title: title.trim(),
        content: content.trim(),
        targets,
        class_id,
        attachment_url,
        attachment_name,
      })
      .select('*, classes(name)')
      .single()

    if (error) {
      console.error('Erreur insertion annonce:', error)
      if (isFormData) {
        return NextResponse.redirect(new URL('/admin/annonces?error=1', request.url), 303)
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Notifications pour les parents
    const { data: parents } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'parent')
      .eq('school_id', school_id)

    if (parents && parents.length > 0) {
      await supabase.from('notifications').insert(
        parents.map(parent => ({
          school_id,
          user_id: parent.id,
          type: 'announcement' as const,
          content: `Nouvelle annonce : ${title.trim()}`,
          link: '/parent/annonces',
        }))
      )
    }

    if (isFormData) {
      return NextResponse.redirect(new URL('/admin/annonces?success=1', request.url), 303)
    }

    return NextResponse.json({ data: announcement, error: null })
  } catch (error) {
    console.error('Erreur API announcements POST:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { id, title, content, targets, attachment_url, attachment_name } = body

    if (!id || !title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'ID, titre et contenu requis.' }, { status: 400 })
    }

    const classTarget = targets?.find((t: string) => t.startsWith('class:'))
    const class_id = classTarget ? classTarget.replace('class:', '') : null

    const { data, error } = await supabase
      .from('announcements')
      .update({
        title: title.trim(),
        content: content.trim(),
        targets: targets || ['all'],
        class_id,
        attachment_url: attachment_url || null,
        attachment_name: attachment_name || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, classes(name)')
      .maybeSingle()

    if (error) {
      console.error('Erreur PUT announcement:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "L'annonce n'existe plus ou a été supprimée." }, { status: 404 })
    }

    return NextResponse.json({ data, error: null })
  } catch (error) {
    console.error('Erreur API announcements PUT:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requis.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur DELETE announcement:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error) {
    console.error('Erreur API announcements DELETE:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
