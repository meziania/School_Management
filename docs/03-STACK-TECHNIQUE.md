# Stack technique

## Choix figés (MVP)

| Couche | Techno | Pourquoi |
| --- | --- | --- |
| Frontend | Next.js 14 App Router + TypeScript + Tailwind | Un seul repo, SSR/RSC, déploiement Vercel simple |
| Backend | Next.js API routes | Suffisant pour CRUD + webhooks Stripe ; FastAPI seulement si logique lourde plus tard |
| DB | PostgreSQL (Supabase) | RLS native, Realtime, Auth intégrée |
| Auth | Supabase Auth | Custom claims `school_id` / `role` |
| Realtime | Supabase Realtime | Notifications / messages in-app |
| Email | Resend | Transactionnels (welcome, reset, alertes) |
| Paiements SaaS | Stripe Subscriptions | Plans Starter / Standard / Enterprise |
| Storage | Supabase Storage | Justificatifs d’absence (fichiers) |
| Hosting | Vercel + Supabase | Aligné stack JS |

## Structure de repo recommandée

```text
SchoolManagement/
  apps/web/          # Next.js (ou racine si single-app)
  docs/              # Cette documentation
  supabase/
    migrations/      # SQL schéma + RLS
    seed.sql         # Données de démo
  public/
  .env.example
  README.md
```

Option simple au démarrage : **single Next.js app** à la racine + dossier `supabase/`.

## Variables d’environnement (attendues)

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # serveur uniquement
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
```

## Couches applicatives

```text
UI (React) → Server Actions / API routes → Supabase client (user JWT)
                                         → Admin client (service role, rares cas)
```

- Client browser : **anon key** + session user
- Server privilégié (signup tenant, Super Admin, webhooks) : **service role**

## Realtime & emails

| Canal | Usage |
| --- | --- |
| Supabase Realtime | Nouveau message, nouvelle annonce, notif in-app |
| Resend | Emails : invitation parent, alerte absence, reset password |

## Stripe (billing SaaS uniquement)

- Client = **école** (pas le parent)
- Webhooks : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Met à jour `subscriptions` + `schools.plan` / `statut_abonnement`

> Le paiement des frais de scolarité (école → parents) est **hors scope v1**.

## Dépendances UI

- Tailwind CSS
- Composants légers (shadcn/ui acceptable si besoin)
- Pas de CSS custom sauf cas particulier

## Hors stack v1

- React Native / Expo
- Microservices
- Kafka / queues complexes
- Database-per-tenant
