import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vnpyrpakmeztyvsaduhw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_HCwUQvEdt1SuDmHg0byIrg_R7iyufHi'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function setupAccounts() {
  const school_id = 'd2311654-ca87-41ba-830c-3fd67e20a869'

  const accounts = [
    { email: 'admin@ecole.ma', password: 'Password123!', role: 'school_admin', name: 'Administrateur Principal' },
    { email: 'prof.hassan@ecole.ma', password: 'Password123!', role: 'teacher', name: 'Prof. Hassan El Amrani' },
    { email: 'parent.salma@ecole.ma', password: 'Password123!', role: 'parent', name: 'Salma Berrada (Parent)' },
  ]

  for (const acc of accounts) {
    console.log(`Registering ${acc.email} (${acc.role})...`)
    const { data, error } = await supabase.auth.signUp({
      email: acc.email,
      password: acc.password,
      options: {
        data: {
          school_id,
          role: acc.role,
          full_name: acc.name,
        },
      },
    })

    if (error) {
      console.log(`User ${acc.email} signup note:`, error.message)
    } else {
      console.log(`User ${acc.email} registered successfully with ID:`, data.user?.id)
    }
  }
}

setupAccounts()
