import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendParentInvitation } from '@/lib/resend'

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
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

/**
 * POST /api/admin/teachers — Ajouter/Inviter un professeur & lui assigner une classe/matière
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const school_id = user.user_metadata?.school_id
    const formData = await request.formData()
    const email = formData.get('email') as string
    const full_name = formData.get('full_name') as string
    const class_id = formData.get('class_id') as string
    const subject = formData.get('subject') as string

    if (!email || !full_name) {
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

    // 2. Assigner la classe et la matière si renseignées
    if (class_id && subject) {
      await supabase.from('teacher_classes').upsert({
        school_id,
        teacher_user_id: teacherUserId,
        class_id,
        subject,
      }, { onConflict: 'teacher_user_id,class_id,subject' })
    }

    return NextResponse.redirect(new URL('/admin/enseignants', request.url))
  } catch (error) {
    console.error('Erreur ajout enseignant:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
