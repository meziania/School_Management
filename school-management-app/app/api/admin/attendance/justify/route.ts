import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    const attendance_id = formData.get('attendance_id') as string

    if (!attendance_id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    }

    await supabase
      .from('attendance')
      .update({ is_justified: true })
      .eq('id', attendance_id)

    return NextResponse.redirect(new URL('/admin/justificatifs', request.url))
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
