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
    const email = (formData.get('email') as string)?.trim()
    const full_name = (formData.get('full_name') as string)?.trim()
    const phone = (formData.get('phone') as string)?.trim()
    
    // Support multiple student_ids (either multiple entries or comma-separated)
    const rawStudentIds = formData.getAll('student_ids') as string[]
    const singleStudentIds = (formData.get('student_ids') as string)?.split(',') || []
    
    const student_ids = Array.from(new Set([
      ...rawStudentIds.filter(Boolean),
      ...singleStudentIds.map(s => s.trim()).filter(Boolean)
    ]))

    if (!email || student_ids.length === 0) {
      return NextResponse.json({ error: 'Veuillez saisir un email et sélectionner au moins un élève.' }, { status: 400 })
    }

    const school_id = user.user_metadata?.school_id

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    let parentUserId = existingUser?.id

    if (!parentUserId) {
      // Create Auth user
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email,
        password: 'Password123!', // Temporary default password
        options: {
          data: {
            school_id,
            role: 'parent',
            full_name,
            phone,
          },
        },
      })

      if (authError || !authUser?.user) {
        return NextResponse.json({ error: authError?.message || 'Erreur lors de la création du compte parent.' }, { status: 500 })
      }

      parentUserId = authUser.user.id

      // Insert profile in public.users
      await supabase.from('users').insert({
        id: parentUserId,
        school_id,
        role: 'parent',
        email,
        full_name,
        phone,
      })
    } else {
      // Update phone & full_name if existing
      await supabase.from('users').update({
        full_name: full_name || undefined,
        phone: phone || undefined,
      }).eq('id', parentUserId)
    }

    // 2. Link parent to all selected students
    const links = student_ids.map(stId => ({
      parent_user_id: parentUserId,
      student_id: stId,
    }))

    await supabase.from('parent_students').upsert(links, {
      onConflict: 'parent_user_id,student_id',
    })

    // 3. Send email invitation
    const { data: school } = await supabase.from('schools').select('name').eq('id', school_id).single()
    await sendParentInvitation({
      to: email,
      parentName: full_name || email,
      schoolName: school?.name || 'EcoleConnect',
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
    }).catch(() => {})

    return NextResponse.redirect(new URL('/admin/parents?success=1', request.url), 303)
  } catch (error) {
    console.error('Erreur invitation parent:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
