import { requireAdmin } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { STRIPE_PLANS } from '@/lib/stripe'
import type { Metadata } from 'next'
import { CreditCard, Check } from 'lucide-react'

export const metadata: Metadata = { title: 'Abonnement — EcoleConnect' }

export default async function AdminBillingPage() {
  const profile = await requireAdmin()
  const supabase = await createClient()

  const { data: school } = await supabase
    .from('schools')
    .select('*')
    .eq('id', profile.school_id!)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('school_id', profile.school_id!)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Abonnement & Facturation</h1>
        <p className="text-slate-500 mt-1">Gérez la formule de votre établissement</p>
      </div>

      {/* Statut actuel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
            <CreditCard className="text-blue-600" size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-lg">Formule {school?.plan?.toUpperCase()}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                school?.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                school?.subscription_status === 'trial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
              }`}>
                {school?.subscription_status === 'trial' ? 'Période d\'essai' : school?.subscription_status}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              {school?.subscription_status === 'trial' && school.trial_ends_at
                ? `Essai gratuit valide jusqu'au ${new Date(school.trial_ends_at).toLocaleDateString('fr-FR')}`
                : 'Abonnement actif'}
            </p>
          </div>
        </div>
      </div>

      {/* Grille des offres */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(STRIPE_PLANS).map(([key, plan]) => {
          const isCurrent = school?.plan === key
          return (
            <div
              key={key}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition ${
                isCurrent ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md' : 'border-slate-200 hover:border-blue-200'
              }`}
            >
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                <p className="text-slate-500 text-xs mt-1">{plan.description}</p>
                <div className="my-4">
                  <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <Check size={16} className="text-green-500 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                disabled={isCurrent}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition ${
                  isCurrent
                    ? 'bg-slate-100 text-slate-400 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                }`}
              >
                {isCurrent ? 'Offre actuelle' : 'Choisir cette offre'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
