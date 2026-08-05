import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendParentInvitation } from '@/lib/resend'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    const email = formData.get('email') as string
    const full_name = formData.get('full_name') as string
    const student_id = formData.get('student_id') as string

    if (!email || !student_id) {
      return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
    }

    const school_id = user.user_metadata?.school_id

    // 1. Tenter d'inscrire le parent ou trouver s'il existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    let parentUserId = existingUser?.id

    if (!parentUserId) {
      // Créer le compte Auth parent
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email,
        password: 'Password123!', // Mot de passe temporaire
        options: {
          data: {
            school_id,
            role: 'parent',
            full_name,
          },
        },
      })

      if (authError || !authUser?.user) {
        return NextResponse.json({ error: authError?.message || 'Erreur création parent.' }, { status: 500 })
      }

      parentUserId = authUser.user.id

      // Créer le profil dans public.users
      await supabase.from('users').insert({
        id: parentUserId,
        school_id,
        role: 'parent',
        email,
        full_name,
      })
    }

    // 2. Lier le parent à l'élève
    await supabase.from('parent_students').upsert({
      parent_user_id: parentUserId,
      student_id,
    }, { onConflict: 'parent_user_id,student_id' })

    // 3. Envoyer l'email d'invitation (Resend)
    const { data: school } = await supabase.from('schools').select('name').eq('id', school_id).single()
    await sendParentInvitation({
      to: email,
      parentName: full_name || email,
      schoolName: school?.name || 'EcoleConnect',
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
    }).catch(() => {})

    return NextResponse.redirect(new URL('/admin/parents', request.url))
  } catch (error) {
    console.error('Erreur invitation parent:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
