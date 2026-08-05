import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vnpyrpakmeztyvsaduhw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_HCwUQvEdt1SuDmHg0byIrg_R7iyufHi'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const school_id = 'd2311654-ca87-41ba-830c-3fd67e20a869'

const firstNames = [
  'Amine', 'Salma', 'Youssef', 'Sarah', 'Adam', 'Hiba', 'Mohamed', 'Aya', 'Omar', 'Yasmine',
  'Reda', 'Kenza', 'Hamza', 'Lina', 'Mehdi', 'Meriem', 'Zakaria', 'Rania', 'Karim', 'Ines',
  'Sami', 'Nour', 'Othmane', 'Malak', 'Anas', 'Rim', 'Walid', 'Ghita', 'Nizar', 'Zineb'
]

const lastNames = [
  'El Mansouri', 'Berrada', 'Benjelloun', 'Alaoui', 'Bennani', 'Chraibi', 'Cherkaoui', 'Tazi',
  'Fassi', 'Filali', 'Chaoui', 'Idrissi', 'Kettani', 'Lazrak', 'Oudghiri', 'Tahiri',
  'Sefrioui', 'Naciri', 'Lahlou', 'Squalli', 'Zerrad', 'Kabbaj', 'Guessous', 'Touzani',
  'Zemmouri', 'Belkacem', 'Benchekroun', 'Slassi', 'Bouzid', 'Amrani'
]

const classesToCreate = [
  // Primary Cycle
  { name: '1AP A', level: '1AP', filiere: null },
  { name: '2AP A', level: '2AP', filiere: null },
  { name: '3AP A', level: '3AP', filiere: null },
  { name: '4AP A', level: '4AP', filiere: null },
  { name: '5AP A', level: '5AP', filiere: null },
  { name: '6AP A', level: '6AP', filiere: null },

  // Middle School (Collège)
  { name: '1AC G1', level: '1AC', filiere: null },
  { name: '2AC G1', level: '2AC', filiere: null },
  { name: '3AC G1', level: '3AC', filiere: null },

  // High School (Lycée)
  { name: 'TCS 1', level: 'TCS', filiere: 'Tronc Commun Scientifique' },
  { name: 'TCL 1', level: 'TCL', filiere: 'Tronc Commun Lettres et Sciences Humaines' },

  // 1BAC Branches
  { name: '1BAC SM A', level: '1BAC', filiere: 'Sciences Mathématiques A' },
  { name: '1BAC Sc. Exp', level: '1BAC', filiere: 'Sciences Physiques' },
  { name: '1BAC Eco', level: '1BAC', filiere: 'Sciences Économiques et Gestion' },
  { name: '1BAC Lettres', level: '1BAC', filiere: 'Lettres et Sciences Humaines' },

  // 2BAC Branches
  { name: '2BAC SM A', level: '2BAC', filiere: 'Sciences Mathématiques A' },
  { name: '2BAC PC 1', level: '2BAC', filiere: 'Sciences Physiques' },
  { name: '2BAC SVT 1', level: '2BAC', filiere: 'SVT (Sciences de la Vie et de la Terre)' },
  { name: '2BAC Eco 1', level: '2BAC', filiere: 'Sciences Économiques et Gestion' },
  { name: '2BAC Lettres 1', level: '2BAC', filiere: 'Lettres et Sciences Humaines' },
]

async function seed() {
  console.log('🚀 Seeding classes and students for all levels and branches...')

  for (const c of classesToCreate) {
    // 1. Check or Insert Class
    let { data: existing } = await supabase
      .from('classes')
      .select('id')
      .eq('school_id', school_id)
      .eq('name', c.name)
      .maybeSingle()

    let classId = existing?.id

    if (!classId) {
      const { data: created, error } = await supabase
        .from('classes')
        .insert({
          school_id,
          name: c.name,
          level: c.level,
          filiere: c.filiere,
          is_active: true,
        })
        .select('id')
        .single()

      if (error) {
        console.error(`Error creating class ${c.name}:`, error.message)
        continue
      }
      classId = created.id
      console.log(`✓ Created class: ${c.name} (${c.level} ${c.filiere ? `[${c.filiere}]` : ''})`)
    } else {
      console.log(`ℹ Class ${c.name} already exists.`)
    }

    // 2. Count existing students in class
    const { count } = await supabase
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', classId)

    const currentCount = count || 0
    const targetCount = 27 // Target 27 students per class

    if (currentCount < targetCount) {
      const needed = targetCount - currentCount
      console.log(`  Adding ${needed} students to ${c.name}...`)

      const newStudents = []
      for (let i = 0; i < needed; i++) {
        const fn = firstNames[(currentCount + i) % firstNames.length]
        const ln = lastNames[(currentCount + i) % lastNames.length]
        
        // Random birth date between 2008 and 2018 depending on level
        const birthYear = c.level.includes('AP') ? 2015 + Math.floor(Math.random() * 3)
          : c.level.includes('AC') ? 2011 + Math.floor(Math.random() * 3)
          : 2007 + Math.floor(Math.random() * 3)

        const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
        const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')

        newStudents.push({
          school_id,
          class_id: classId,
          first_name: fn,
          last_name: ln,
          birth_date: `${birthYear}-${birthMonth}-${birthDay}`,
          is_active: true,
        })
      }

      const { error: stError } = await supabase.from('students').insert(newStudents)
      if (stError) {
        console.error(`Error inserting students for ${c.name}:`, stError.message)
      } else {
        console.log(`  ✓ Successfully added ${needed} students to ${c.name}. Total now: ${targetCount}`)
      }
    } else {
      console.log(`  ✓ ${c.name} already has ${currentCount} students.`)
    }
  }

  console.log('🎉 Seeding complete for all levels & branches!')
}

seed()
