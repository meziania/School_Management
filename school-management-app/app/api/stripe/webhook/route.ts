import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

/**
 * POST /api/stripe/webhook
 * Reçoit les événements Stripe et met à jour les abonnements
 */
export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const schoolId = session.metadata?.school_id

        if (schoolId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          await supabase.from('subscriptions').upsert({
            school_id: schoolId,
            plan: session.metadata?.plan ?? 'starter',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'active',
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          }, { onConflict: 'school_id' })

          await supabase.from('schools').update({
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
          }).eq('id', schoolId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('school_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (existing) {
          const status = subscription.status === 'active' ? 'active' :
            subscription.status === 'past_due' ? 'past_due' : 'canceled'

          await supabase.from('subscriptions').update({
            status,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          }).eq('stripe_subscription_id', subscription.id)

          await supabase.from('schools').update({
            subscription_status: status,
          }).eq('id', existing.school_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('school_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (existing) {
          await supabase.from('subscriptions').update({ status: 'canceled' })
            .eq('stripe_subscription_id', subscription.id)
          await supabase.from('schools').update({ subscription_status: 'canceled' })
            .eq('id', existing.school_id)
        }
        break
      }

      default:
        console.log(`Événement Stripe non géré: ${event.type}`)
    }
  } catch (error) {
    console.error('Erreur traitement webhook:', error)
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
