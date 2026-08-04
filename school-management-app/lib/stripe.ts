import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY non configurée — paiements désactivés')
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-07-29.dahlia' as any,
    })
  : null

export const STRIPE_PLANS = {
  starter: {
    name: 'Starter',
    price: '49€/mois',
    description: 'Jusqu\'à 100 élèves',
    priceId: process.env.STRIPE_PRICE_STARTER ?? '',
    features: ['Toutes les fonctionnalités MVP', 'Support email', 'Jusqu\'à 100 élèves'],
  },
  standard: {
    name: 'Standard',
    price: '99€/mois',
    description: 'Jusqu\'à 300 élèves',
    priceId: process.env.STRIPE_PRICE_STANDARD ?? '',
    features: ['Toutes les fonctionnalités MVP', 'Support prioritaire', 'Jusqu\'à 300 élèves'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Sur devis',
    description: 'Établissements de grande taille',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
    features: ['Toutes les fonctionnalités', 'Support dédié', 'Illimité'],
  },
} as const
