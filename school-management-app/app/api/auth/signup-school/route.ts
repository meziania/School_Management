import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { signupSchoolSchema } from '@/lib/validations/schemas'

/**
 * POST /api/auth/signup-school
 * Crée un nouveau tenant école + admin
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
    
    // Utiliser le client admin si disponible, sinon le client standard avec anon key
    let supabase = createAdminClient()

    // 1. Vérifier que le subdomain n'est pas déjà pris
    let { data: existingSchool, error: checkError } = await supabase
      .from('schools')
      .select('id')
      .eq('subdomain', subdomain)
      .single()

    // Si le client admin échoue à cause de la clé API, utiliser le client standard
    if (checkError && (checkError.message?.includes('API key') || checkError.message?.includes('Unauthorized'))) {
      supabase = await createClient() as any
      const res = await supabase.from('schools').select('id').eq('subdomain', subdomain).single()
      existingSchool = res.data
    }

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
        { error: schoolError?.message || 'Erreur lors de la création de l\'école.' },
        { status: 500 }
      )
    }

    // 3. Créer le compte Supabase Auth
    let authUserUserId: string | null = null

    // Tenter avec auth.admin.createUser
    if (supabase.auth?.admin?.createUser) {
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
      if (!authError && authUser?.user) {
        authUserUserId = authUser.user.id
      }
    }

    // Fallback si admin API indisponible : signUp standard
    if (!authUserUserId) {
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: admin_email,
        password: admin_password,
        options: {
          data: {
            school_id: school.id,
            role: 'school_admin',
            full_name: admin_full_name,
          },
        },
      })

      if (authError || !authUser?.user) {
        await supabase.from('schools').delete().eq('id', school.id)
        console.error('Erreur création auth user:', authError)
        return NextResponse.json(
          { error: authError?.message || 'Erreur lors de la création du compte.' },
          { status: 500 }
        )
      }
      authUserUserId = authUser.user.id
    }

    // 4. Créer le profil utilisateur dans la table users
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUserUserId,
        school_id: school.id,
        role: 'school_admin',
        email: admin_email,
        full_name: admin_full_name,
      })

    if (profileError) {
      console.error('Erreur création profil:', profileError)
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
