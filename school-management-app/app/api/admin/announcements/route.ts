import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const contentType = request.headers.get('content-type') || ''
    let title = ''
    let content = ''
    let class_id: string | null = null
    let isFormData = false

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      isFormData = true
      const formData = await request.formData()
      title = (formData.get('title') as string) || ''
      content = (formData.get('content') as string) || ''
      const rawClassId = formData.get('class_id') as string
      class_id = rawClassId && rawClassId.trim() ? rawClassId.trim() : null
    } else {
      const body = await request.json()
      title = body.title || ''
      content = body.content || ''
      class_id = body.class_id || null
    }

    if (!title.trim() || !content.trim()) {
      if (isFormData) {
        return NextResponse.redirect(new URL('/admin/annonces?error=invalid', request.url), 303)
      }
      return NextResponse.json({ error: 'Titre et contenu requis.' }, { status: 400 })
    }

    const school_id = user.user_metadata?.school_id

    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        school_id,
        created_by: user.id,
        title: title.trim(),
        content: content.trim(),
        class_id,
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur insertion annonce:', error)
      if (isFormData) {
        return NextResponse.redirect(new URL('/admin/annonces?error=1', request.url), 303)
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Créer des notifications pour les parents concernés
    let parentsQuery = supabase.from('users').select('id').eq('role', 'parent').eq('school_id', school_id)
    const { data: parents } = await parentsQuery

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
    console.error('Erreur API announcements:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
