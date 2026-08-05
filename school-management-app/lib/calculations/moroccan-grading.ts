import { ExamConfig } from '@/types/app'

export interface GradeInputValues {
  ccScore?: number | null
  provincialScore?: number | null
  regionalScore?: number | null
  nationalScore?: number | null
}

export type MoroccanMention = 'Ajourné' | 'Passable' | 'Assez Bien' | 'Bien' | 'Très Bien'

export interface MoroccanGradeResult {
  finalAverage: number | null
  isPassed: boolean
  mention: MoroccanMention
  breakdown: {
    ccContribution: number
    provincialContribution: number
    regionalContribution: number
    nationalContribution: number
  }
}

/**
 * Calculateur dynamique de moyenne pour le système éducatif marocain.
 * Accepte les coefficients configurés en base de données sans rien harcoder.
 */
export function calculateMoroccanFinalGrade(
  config: ExamConfig,
  scores: GradeInputValues
): MoroccanGradeResult {
  const ccWeight = config.cc_weight || 0
  const provincialWeight = config.provincial_weight || 0
  const regionalWeight = config.regional_weight || 0
  const nationalWeight = config.national_weight || 0
  const passingGrade = config.passing_grade || 10.0

  let totalWeight = 0
  let weightedSum = 0

  let ccContrib = 0
  let provContrib = 0
  let regContrib = 0
  let natContrib = 0

  if (ccWeight > 0 && scores.ccScore !== undefined && scores.ccScore !== null) {
    ccContrib = (scores.ccScore * ccWeight) / 100
    weightedSum += ccContrib
    totalWeight += ccWeight
  }

  if (provincialWeight > 0 && scores.provincialScore !== undefined && scores.provincialScore !== null) {
    provContrib = (scores.provincialScore * provincialWeight) / 100
    weightedSum += provContrib
    totalWeight += provincialWeight
  }

  if (regionalWeight > 0 && scores.regionalScore !== undefined && scores.regionalScore !== null) {
    regContrib = (scores.regionalScore * regionalWeight) / 100
    weightedSum += regContrib
    totalWeight += regionalWeight
  }

  if (nationalWeight > 0 && scores.nationalScore !== undefined && scores.nationalScore !== null) {
    natContrib = (scores.nationalScore * nationalWeight) / 100
    weightedSum += natContrib
    totalWeight += nationalWeight
  }

  if (totalWeight === 0) {
    return {
      finalAverage: null,
      isPassed: false,
      mention: 'Ajourné',
      breakdown: {
        ccContribution: 0,
        provincialContribution: 0,
        regionalContribution: 0,
        nationalContribution: 0,
      },
    }
  }

  // Normalisation si seulement une partie des examens est saisie
  const finalAverage = Math.round((weightedSum / (totalWeight / 100)) * 100) / 100
  const isPassed = finalAverage >= passingGrade

  let mention: MoroccanMention = 'Ajourné'
  if (finalAverage >= 16.0) mention = 'Très Bien'
  else if (finalAverage >= 14.0) mention = 'Bien'
  else if (finalAverage >= 12.0) mention = 'Assez Bien'
  else if (finalAverage >= 10.0) mention = 'Passable'

  return {
    finalAverage,
    isPassed,
    mention,
    breakdown: {
      ccContribution: Math.round(ccContrib * 100) / 100,
      provincialContribution: Math.round(provContrib * 100) / 100,
      regionalContribution: Math.round(regContrib * 100) / 100,
      nationalContribution: Math.round(natContrib * 100) / 100,
    },
  }
}

/**
 * Calculateur "What-If" (Simulateur) :
 * Calcule la note minimale requise à l'Examen National (ou Régional) pour atteindre une moyenne cible.
 */
export function calculateRequiredExamScore(
  config: ExamConfig,
  currentScores: Omit<GradeInputValues, 'nationalScore'>,
  targetAverage: number
): number | null {
  const ccWeight = config.cc_weight || 0
  const regWeight = config.regional_weight || 0
  const natWeight = config.national_weight || 0

  if (natWeight <= 0) return null

  const ccContrib = currentScores.ccScore ? (currentScores.ccScore * ccWeight) / 100 : 0
  const regContrib = currentScores.regionalScore ? (currentScores.regionalScore * regWeight) / 100 : 0

  const remainingNeeded = targetAverage - (ccContrib + regContrib)
  const requiredScore = (remainingNeeded * 100) / natWeight

  return Math.round(Math.max(0, Math.min(20, requiredScore)) * 100) / 100
}
