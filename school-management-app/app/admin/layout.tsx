import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/layout/AdminSidebar'
import type { Metadata } from 'next'
import { JustificationsProvider } from '@/lib/store/justifications-context'

export const metadata: Metadata = {
  title: 'Administration — EcoleConnect',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireAdmin()
  const supabase = await createClient()

  const { data: school } = await supabase
    .from('schools')
    .select('name, subscription_status, trial_ends_at')
    .eq('id', profile.school_id!)
    .single()

  const isTrialExpiringSoon = school?.subscription_status === 'trial' &&
    school?.trial_ends_at &&
    new Date(school.trial_ends_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  return (
    <JustificationsProvider>
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar schoolName={school?.name} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Banner trial */}
          {isTrialExpiringSoon && (
            <div className="bg-amber-500 text-white px-4 py-2 text-sm text-center font-medium">
              ⚠️ Votre essai gratuit expire bientôt.{' '}
              <a href="/admin/billing" className="underline hover:text-amber-100">
                Passer à un abonnement
              </a>
            </div>
          )}

          <main className="flex-1 p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </JustificationsProvider>
  )
}
