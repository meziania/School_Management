import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let attendance_id = ''
    let action = 'accept'
    let isFormData = false

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      isFormData = true
      const formData = await request.formData()
      attendance_id = (formData.get('attendance_id') as string) || ''
      action = (formData.get('status') as string) || (formData.get('action') as string) || 'accept'
    } else {
      const body = await request.json()
      attendance_id = body.attendance_id || body.id || ''
      action = body.action || body.status || 'accept'
    }

    if (!attendance_id) {
      return NextResponse.json({ error: 'ID de présence requis.' }, { status: 400 })
    }

    const isAccepted = action === 'accept' || action === 'validate' || action === 'valider'

    if (isAccepted) {
      const { error } = await supabase
        .from('attendance')
        .update({
          is_justified: true,
        })
        .eq('id', attendance_id)

      if (error) {
        console.error('Erreur validation justificatif:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // If rejected, set is_justified to false and clear justification
      const { error } = await supabase
        .from('attendance')
        .update({
          is_justified: false,
          justification: null,
          justified_file: null,
        })
        .eq('id', attendance_id)

      if (error) {
        console.error('Erreur refus justificatif:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    if (isFormData) {
      return NextResponse.redirect(new URL('/admin/justificatifs', request.url), 303)
    }

    return NextResponse.json({ success: true, action: isAccepted ? 'accepted' : 'rejected' })
  } catch (error) {
    console.error('Erreur API justify attendance:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
