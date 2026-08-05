import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formate une date en format français
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calcule la moyenne pondérée des notes
 */
export function calculateAverage(grades: { score: number; coefficient: number }[]): number | null {
  if (grades.length === 0) return null
  const totalWeight = grades.reduce((sum, g) => sum + g.coefficient, 0)
  const weightedSum = grades.reduce((sum, g) => sum + g.score * g.coefficient, 0)
  return Math.round((weightedSum / totalWeight) * 100) / 100
}

/**
 * Label français pour le statut de présence
 */
export function attendanceStatusLabel(status: 'present' | 'absent' | 'late'): string {
  const labels = {
    present: 'Présent',
    absent: 'Absent',
    late: 'En retard',
  }
  return labels[status]
}

/**
 * Badge CSS classes par statut de présence
 */
export function attendanceStatusClasses(status: 'present' | 'absent' | 'late'): string {
  const classes = {
    present: 'bg-green-100 text-green-700 border-green-200',
    absent: 'bg-red-100 text-red-700 border-red-200',
    late: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  }
  return classes[status]
}

/**
 * Label semestre
 */
export function termLabel(term: 1 | 2 | 3 | number): string {
  return `Semestre ${term}`
}

/**
 * Couleur selon la note (sur 20)
 */
export function gradeColor(score: number): string {
  if (score >= 16) return 'text-green-600'
  if (score >= 12) return 'text-blue-600'
  if (score >= 10) return 'text-yellow-600'
  return 'text-red-600'
}
