import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const profile = await requireAdmin()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('school_settings')
      .select('*')
      .eq('school_id', profile.school_id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data || {
        deduction_unjustified: 0.5,
        deduction_justified: 0.0,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur d\'accès' }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireAdmin()
    const supabase = await createClient()
    const body = await request.json()

    const deduction_unjustified = parseFloat(body.deduction_unjustified ?? 0.5)

    const { data, error } = await supabase
      .from('school_settings')
      .upsert(
        {
          school_id: profile.school_id,
          deduction_unjustified,
          deduction_justified: 0.0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'school_id' }
      )
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur enregistrement' }, { status: 400 })
  }
}
