import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/attendance
 * Accepts JSON or FormData submission for batch attendance registration
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let class_id = ''
    let date = ''
    let period = ''
    let isFormData = false

    const records: Array<{
      school_id: string | null
      student_id: string
      date: string
      status: 'present' | 'absent'
      is_justified: boolean
      justification: string | null
      created_by: string
    }> = []

    const school_id = user.user_metadata?.school_id || null

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      isFormData = true
      const formData = await request.formData()
      class_id = (formData.get('class_id') as string) || ''
      date = (formData.get('date') as string) || ''
      period = (formData.get('period') as string) || ''

      // Extract all status_{student_id} fields
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('status_')) {
          const student_id = key.replace('status_', '')
          const status = (value as string) === 'absent' ? 'absent' : 'present'
          const is_justified = formData.get(`is_justified_${student_id}`) === 'true'
          const motif = (formData.get(`motif_${student_id}`) as string) || null

          records.push({
            school_id,
            student_id,
            date,
            status,
            is_justified: status === 'absent' ? is_justified : false,
            justification: status === 'absent' ? motif : null,
            created_by: user.id,
          })
        }
      }
    } else {
      // JSON Payload
      const body = await request.json()
      class_id = body.class_id || ''
      date = body.date || ''

      if (Array.isArray(body.entries)) {
        for (const entry of body.entries) {
          records.push({
            school_id,
            student_id: entry.student_id,
            date,
            status: entry.status === 'absent' ? 'absent' : 'present',
            is_justified: entry.is_justified ?? false,
            justification: entry.motif || entry.justification || null,
            created_by: user.id,
          })
        }
      }
    }

    if (!class_id || !date || records.length === 0) {
      if (isFormData) {
        return NextResponse.redirect(new URL(`/admin/presence?class_id=${class_id}&date=${date}`, request.url))
      }
      return NextResponse.json({ error: 'Données invalides.' }, { status: 400 })
    }

    // Upsert attendance records
    const { error } = await supabase
      .from('attendance')
      .upsert(records, {
        onConflict: 'student_id,date',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Erreur attendance upsert:', error)
      if (isFormData) {
        return NextResponse.redirect(new URL(`/admin/presence?class_id=${class_id}&date=${date}&error=1`, request.url))
      }
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement.' }, { status: 500 })
    }

    if (isFormData) {
      const isTeacher = user.user_metadata?.role === 'teacher'
      const redirectPath = isTeacher ? '/teacher/presence' : '/admin/presence'
      return NextResponse.redirect(new URL(`${redirectPath}?class_id=${class_id}&date=${date}&period=${encodeURIComponent(period)}&success=1`, request.url))
    }

    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error) {
    console.error('Erreur API attendance:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

/**
 * GET /api/admin/attendance?class_id=...&date=...
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const class_id = searchParams.get('class_id')
    const date = searchParams.get('date')

    if (!class_id || !date) {
      return NextResponse.json({ error: 'class_id et date sont requis.' }, { status: 400 })
    }

    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('class_id', class_id)
      .eq('is_active', true)

    const studentIds = students?.map(s => s.id) ?? []

    const { data: attendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', date)
      .in('student_id', studentIds)

    return NextResponse.json({ data: attendance, error: null })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
