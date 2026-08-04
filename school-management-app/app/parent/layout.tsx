import { requireParent } from '@/lib/auth/get-session'
import ParentNav from '@/components/layout/ParentNav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Espace Parent — EcoleConnect',
}

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireParent()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <ParentNav userName={profile.full_name ?? profile.email} />
      <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        {children}
      </main>
    </div>
  )
}
