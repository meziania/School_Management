import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'EcoleConnect — Gestion scolaire SaaS',
    template: '%s | EcoleConnect',
  },
  description: 'Plateforme SaaS de gestion scolaire multi-tenant. Suivi quotidien des élèves, communication parents-direction en temps réel.',
  keywords: ['gestion scolaire', 'école', 'présence', 'notes', 'parents', 'SaaS'],
  authors: [{ name: 'EcoleConnect' }],
  robots: 'noindex, nofollow', // Private SaaS app
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full antialiased">
        {children}
      </body>
    </html>
  )
}
