import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vnpyrpakmeztyvsaduhw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_HCwUQvEdt1SuDmHg0byIrg_R7iyufHi'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function createParent() {
  const email = 'parent.salma@ecole.ma'
  const password = 'Password123!'
  const school_id = 'd2311654-ca87-41ba-830c-3fd67e20a869'
  const full_name = 'Salma Berrada (Parent)'

  console.log('Registering parent user...')
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        school_id,
        role: 'parent',
        full_name,
      },
    },
  })

  if (error) {
    console.error('Error creating parent:', error.message)
    return
  }

  console.log('Parent registered with ID:', data.user?.id)
}

createParent()
