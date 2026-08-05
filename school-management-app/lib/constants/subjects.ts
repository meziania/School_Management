export interface Subject {
  id: string
  name: string
  code: string
  defaultCoefficient: number
  applicableLevels: string[] // Ex: ['6AP', '1AC', '2AC', '3AC', '1BAC', '2BAC'] ou ['ALL']
}

export const MOROCCAN_SUBJECTS_CATALOG: Subject[] = [
  // ── Matières Scientifiques
  { id: 'maths', name: 'Mathématiques', code: 'MATH', defaultCoefficient: 4, applicableLevels: ['ALL'] },
  { id: 'pc', name: 'Physique-Chimie', code: 'PC', defaultCoefficient: 4, applicableLevels: ['1AC', '2AC', '3AC', 'TCS', '1BAC', '2BAC'] },
  { id: 'svt', name: 'Sciences de la Vie et de l\'Terre (SVT)', code: 'SVT', defaultCoefficient: 3, applicableLevels: ['1AC', '2AC', '3AC', 'TCS', '1BAC', '2BAC'] },
  { id: 'act_sci', name: 'Activités Scientifiques', code: 'ACT_SCI', defaultCoefficient: 2, applicableLevels: ['1AP', '2AP', '3AP', '4AP', '5AP', '6AP'] },
  
  // ── Langues & Littérature
  { id: 'arabe', name: 'Langue Arabe', code: 'ARA', defaultCoefficient: 3, applicableLevels: ['ALL'] },
  { id: 'francais', name: 'Langue Française', code: 'FR', defaultCoefficient: 3, applicableLevels: ['ALL'] },
  { id: 'anglais', name: 'Langue Anglaise', code: 'ENG', defaultCoefficient: 2, applicableLevels: ['3AC', 'TCS', '1BAC', '2BAC'] },
  { id: 'espagnol', name: 'Langue Espagnole', code: 'ESP', defaultCoefficient: 2, applicableLevels: ['1BAC', '2BAC'] },
  { id: 'allemand', name: 'Langue Allemande', code: 'ALL', defaultCoefficient: 2, applicableLevels: ['1BAC', '2BAC'] },

  // ── Sciences Humaines & Sociales
  { id: 'hist_geo', name: 'Histoire-Géographie', code: 'HG', defaultCoefficient: 2, applicableLevels: ['1AC', '2AC', '3AC', 'TCS', '1BAC', '2BAC'] },
  { id: 'philo', name: 'Philosophie', code: 'PHIL', defaultCoefficient: 2, applicableLevels: ['TCS', '1BAC', '2BAC'] },
  { id: 'edu_islam', name: 'Éducation Islamique', code: 'EI', defaultCoefficient: 2, applicableLevels: ['ALL'] },

  // ── Matières Techniques & Diverses
  { id: 'info', name: 'Informatique & Technologie', code: 'INFO', defaultCoefficient: 2, applicableLevels: ['1AC', '2AC', '3AC', 'TCS', '1BAC', '2BAC'] },
  { id: 'traduction', name: 'Traduction', code: 'TRAD', defaultCoefficient: 2, applicableLevels: ['1BAC', '2BAC'] },
  { id: 'eps', name: 'Éducation Physique (EPS)', code: 'EPS', defaultCoefficient: 2, applicableLevels: ['ALL'] },
  { id: 'art', name: 'Éducation Artistique', code: 'ART', defaultCoefficient: 1, applicableLevels: ['1AP', '2AP', '3AP', '4AP', '5AP', '6AP'] },
]

/**
 * Filtre la liste des matières applicables à un niveau donné (ex: '1BAC', '6AP')
 */
export function getSubjectsForLevel(level?: string): Subject[] {
  if (!level) return MOROCCAN_SUBJECTS_CATALOG
  const lvlUpper = level.toUpperCase()

  return MOROCCAN_SUBJECTS_CATALOG.filter(s =>
    s.applicableLevels.includes('ALL') ||
    s.applicableLevels.some(l => lvlUpper.includes(l))
  )
}
