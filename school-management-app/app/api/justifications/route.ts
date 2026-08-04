import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { justifyAbsenceSchema } from '@/lib/validations/schemas'

/**
 * POST /api/justifications
 * Upload justificatif + mise à jour attendance
 * Supporte multipart/form-data pour le fichier
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'parent') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await request.formData()
    const attendance_id = formData.get('attendance_id') as string
    const justification = formData.get('justification') as string
    const file = formData.get('file') as File | null

    const parsed = justifyAbsenceSchema.safeParse({ attendance_id, justification })
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    // Vérifier que l'absence appartient à un enfant du parent
    const { data: attendance } = await supabase
      .from('attendance')
      .select('id, student_id, school_id, status')
      .eq('id', attendance_id)
      .single()

    if (!attendance || attendance.status !== 'absent') {
      return NextResponse.json({ error: 'Absence introuvable.' }, { status: 404 })
    }

    // Vérifier le lien parent ↔ élève
    const { data: link } = await supabase
      .from('parent_students')
      .select('id')
      .eq('parent_user_id', user.id)
      .eq('student_id', attendance.student_id)
      .single()

    if (!link) {
      return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
    }

    let filePath: string | null = null

    // Upload du fichier si présent
    if (file && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Fichier trop grand (max 5 Mo).' }, { status: 400 })
      }

      const ext = file.name.split('.').pop()
      const fileName = `${attendance.school_id}/${attendance.student_id}/${attendance_id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('absence-justifications')
        .upload(fileName, file, { contentType: file.type, upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        // Ne pas bloquer si l'upload échoue — continuer sans fichier
      } else {
        filePath = fileName
      }
    }

    // Mettre à jour l'absence
    const { error: updateError } = await supabase
      .from('attendance')
      .update({
        justification,
        is_justified: true,
        justified_file: filePath,
      })
      .eq('id', attendance_id)

    if (updateError) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 })
    }

    // Notifier l'admin
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('school_id', attendance.school_id)
      .eq('role', 'school_admin')

    if (admins) {
      await supabase.from('notifications').insert(
        admins.map(admin => ({
          school_id: attendance.school_id,
          user_id: admin.id,
          type: 'justification_submitted' as const,
          content: `Un parent a soumis un justificatif d'absence.`,
          link: '/admin/justificatifs',
        }))
      )
    }

    return NextResponse.json({ data: { success: true }, error: null })
  } catch (error) {
    console.error('Erreur justifications:', error)
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
