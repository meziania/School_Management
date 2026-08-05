import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Configurations par défaut du système marocain
const DEFAULT_CONFIGS = [
  { level: '6AP', cc_weight: 50, provincial_weight: 50, regional_weight: 0, national_weight: 0, passing_grade: 10.0 },
  { level: '3AC', cc_weight: 50, provincial_weight: 0, regional_weight: 50, national_weight: 0, passing_grade: 10.0 },
  { level: '1BAC', cc_weight: 100, provincial_weight: 0, regional_weight: 0, national_weight: 0, passing_grade: 10.0 },
  { level: '2BAC', cc_weight: 25, provincial_weight: 0, regional_weight: 25, national_weight: 50, passing_grade: 10.0 },
]

/**
 * GET /api/admin/exam-config
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const school_id = user.user_metadata?.school_id

    const { data, error } = await supabase
      .from('exam_configurations')
      .select('*')
      .eq('school_id', school_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Si aucune config en base, renvoyer les valeurs par défaut
    if (!data || data.length === 0) {
      return NextResponse.json({ data: DEFAULT_CONFIGS, isDefault: true, error: null })
    }

    return NextResponse.json({ data, isDefault: false, error: null })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}

/**
 * POST /api/admin/exam-config
 * Upsert des poids d'examens par niveau
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const school_id = user.user_metadata?.school_id
    const body = await request.json()

    if (!Array.isArray(body.configs)) {
      return NextResponse.json({ error: 'Format invalide.' }, { status: 400 })
    }

    const rowsToUpsert = body.configs.map((c: any) => ({
      school_id,
      level: c.level,
      cc_weight: Number(c.cc_weight || 0),
      provincial_weight: Number(c.provincial_weight || 0),
      regional_weight: Number(c.regional_weight || 0),
      national_weight: Number(c.national_weight || 0),
      passing_grade: Number(c.passing_grade || 10.0),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from('exam_configurations')
      .upsert(rowsToUpsert, { onConflict: 'school_id,level' })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, error: null })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne.' }, { status: 500 })
  }
}
