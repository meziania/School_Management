import { z } from 'zod'

/**
 * Helper pour extraire le premier message d'erreur d'un SafeParseReturnType
 */
export function getZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Erreur de validation'
}
