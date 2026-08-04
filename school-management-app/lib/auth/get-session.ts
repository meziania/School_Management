import { createClient } from '@/lib/supabase/server'
import type { UserProfile, JWTClaims } from '@/types/app'
import { redirect } from 'next/navigation'

/**
 * Récupère la session utilisateur côté serveur
 * Redirige vers /login si pas de session
 */
export async function getSession() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}

/**
 * Récupère le profil utilisateur complet depuis la table users
 * Redirige vers /login si pas de session ou profil introuvable
 */
export async function getUserProfile(): Promise<UserProfile> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) redirect('/login')

  return profile as UserProfile
}

/**
 * Vérifie que l'utilisateur est un school_admin
 * Redirige si non autorisé
 */
export async function requireAdmin(): Promise<UserProfile> {
  const profile = await getUserProfile()
  if (profile.role !== 'school_admin') redirect('/login')
  return profile
}

/**
 * Vérifie que l'utilisateur est un parent
 * Redirige si non autorisé
 */
export async function requireParent(): Promise<UserProfile> {
  const profile = await getUserProfile()
  if (profile.role !== 'parent') redirect('/login')
  return profile
}

/**
 * Vérifie que l'utilisateur est un super_admin
 * Redirige si non autorisé
 */
export async function requireSuperAdmin(): Promise<UserProfile> {
  const profile = await getUserProfile()
  if (profile.role !== 'super_admin') redirect('/login')
  return profile
}
