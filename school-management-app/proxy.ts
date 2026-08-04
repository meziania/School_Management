import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware-client'

// Next.js 16 uses "proxy" as the exported function name
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation images)
     * - favicon.ico
     * - Fichiers publics avec extension
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
