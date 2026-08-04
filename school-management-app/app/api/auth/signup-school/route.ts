import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { signupSchoolSchema } from '@/lib/validations/schemas'

/**
 * POST /api/auth/signup-school
 * Crée un nouveau tenant école + admin
 * Utilise le service role (bypasse RLS)
 * 
 * Body: SignupSchoolInput
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = signupSchoolSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      )
    }

    const { school_name, subdomain, admin_email, admin_password, admin_full_name } = parsed.data
    const supabase = createAdminClient()

    // 1. Vérifier que le subdomain n'est pas déjà pris
    const { data: existingSchool } = await supabase
      .from('schools')
      .select('id')
      .eq('subdomain', subdomain)
      .single()

    if (existingSchool) {
      return NextResponse.json(
        { error: 'Ce sous-domaine est déjà utilisé. Choisissez-en un autre.' },
        { status: 409 }
      )
    }

    // 2. Créer l'école (tenant)
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: school_name,
        subdomain,
        plan: 'trial',
        subscription_status: 'trial',
      })
      .select()
      .single()

    if (schoolError || !school) {
      console.error('Erreur création école:', schoolError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de l\'école.' },
        { status: 500 }
      )
    }

    // 3. Créer le compte Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: {
        school_id: school.id,
        role: 'school_admin',
        full_name: admin_full_name,
      },
    })

    if (authError || !authUser.user) {
      // Rollback : supprimer l'école créée
      await supabase.from('schools').delete().eq('id', school.id)
      console.error('Erreur création auth user:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Erreur lors de la création du compte.' },
        { status: 500 }
      )
    }

    // 4. Créer le profil utilisateur dans la table users
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        school_id: school.id,
        role: 'school_admin',
        email: admin_email,
        full_name: admin_full_name,
      })

    if (profileError) {
      console.error('Erreur création profil:', profileError)
      // Pas de rollback critique ici, le compte existe quand même
    }

    // 5. Créer l'abonnement trial
    await supabase.from('subscriptions').insert({
      school_id: school.id,
      plan: 'trial',
      status: 'trial',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    return NextResponse.json({
      data: {
        school_id: school.id,
        message: 'École créée avec succès ! Connectez-vous pour commencer.',
      },
      error: null,
    })

  } catch (error) {
    console.error('Erreur signup-school:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    )
  }
}
