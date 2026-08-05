import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/teachers — Liste des professeurs et leurs classes assignées
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const school_id = user.user_metadata?.school_id

    const { data: teachers, error } = await supabase
      .from('users')
      .select('*, teacher_classes(id, class_id, subject, classes(name, level))')
      .eq('school_id', school_id)
      .eq('role', 'teacher')
      .order('full_name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: teachers, error: null })
  } catch {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

/**
 * POST /api/admin/teachers — Ajouter/Inviter un professeur & lui assigner plusieurs classes/matières
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const school_id = user.user_metadata?.school_id
    const contentType = request.headers.get('content-type') || ''
    let isFormData = false
    let email = ''
    let full_name = ''
    let subject = ''
    let class_ids: string[] = []

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      isFormData = true
      const formData = await request.formData()
      email = (formData.get('email') as string) || ''
      full_name = (formData.get('full_name') as string) || ''
      subject = (formData.get('subject') as string) || ''
      
      const rawClassIds = formData.getAll('class_ids')
      if (rawClassIds.length > 0) {
        class_ids = rawClassIds.map(c => c as string).filter(Boolean)
      } else {
        const singleClass = formData.get('class_id') as string
        if (singleClass) class_ids = [singleClass]
      }
    } else {
      const body = await request.json()
      email = body.email || ''
      full_name = body.full_name || ''
      subject = body.subject || ''
      class_ids = body.class_ids || (body.class_id ? [body.class_id] : [])
    }

    if (!email || !full_name) {
      if (isFormData) {
        return NextResponse.redirect(new URL('/admin/enseignants?error=missing_fields', request.url), 303)
      }
      return NextResponse.json({ error: 'Nom et email sont requis.' }, { status: 400 })
    }

    // 1. Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    let teacherUserId = existingUser?.id

    if (!teacherUserId) {
      // Inscription du professeur
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email,
        password: 'Password123!',
        options: {
          data: {
            school_id,
            role: 'teacher',
            full_name,
          },
        },
      })

      if (authError || !authUser?.user) {
        if (isFormData) {
          return NextResponse.redirect(new URL('/admin/enseignants?error=auth_failed', request.url), 303)
        }
        return NextResponse.json({ error: authError?.message || 'Erreur création enseignant.' }, { status: 500 })
      }

      teacherUserId = authUser.user.id

      await supabase.from('users').insert({
        id: teacherUserId,
        school_id,
        role: 'teacher',
        email,
        full_name,
      })
    }

    // 2. Assigner les classes et la matière si renseignées
    if (class_ids.length > 0 && subject) {
      const teacherClassesToInsert = class_ids.map(cId => ({
        school_id,
        teacher_user_id: teacherUserId,
        class_id: cId,
        subject,
      }))

      await supabase.from('teacher_classes').upsert(teacherClassesToInsert, {
        onConflict: 'teacher_user_id,class_id,subject',
      })
    }

    if (isFormData) {
      return NextResponse.redirect(new URL('/admin/enseignants?success=1', request.url), 303)
    }

    return NextResponse.json({ data: { success: true, teacherUserId }, error: null })
  } catch (error) {
    console.error('Erreur ajout enseignant:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
