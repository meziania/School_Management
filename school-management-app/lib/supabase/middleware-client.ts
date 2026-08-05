import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Client Supabase pour le middleware Next.js
 * Gère le refresh de session et le routing par rôle
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Routes publiques — pas de protection
  const publicRoutes = ['/login', '/signup', '/api/auth/signup-school', '/api/stripe/webhook']
  const isPublic = publicRoutes.some(r => pathname.startsWith(r))

  if (isPublic) {
    return supabaseResponse
  }

  // Pas de session → login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Extraire le rôle des custom claims
  const role = user.user_metadata?.role as string | undefined

  // Routing par rôle — routes protégées
  if (pathname.startsWith('/admin/') && role !== 'school_admin' && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/parent/') && role !== 'parent' && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/teacher/') && role !== 'teacher' && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/super-admin') && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirection depuis la racine
  if (pathname === '/') {
    if (role === 'school_admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    if (role === 'teacher') return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
    if (role === 'parent') return NextResponse.redirect(new URL('/parent/dashboard', request.url))
    if (role === 'super_admin') return NextResponse.redirect(new URL('/super-admin', request.url))
  }

  return supabaseResponse
}
