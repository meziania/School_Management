# Architecture multi-tenant

## Décision

**Shared database + colonne `school_id` + Row Level Security (RLS).**

Pas de database-per-tenant en v1 (trop cher / complexe opérationnellement pour un MVP).

```text
┌─────────────────────────────────────────────┐
│                 Application                  │
│  Next.js (App Router) + API routes           │
│  JWT contient : user_id, school_id, role     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│              Supabase / Postgres             │
│  Toutes les tables métier : school_id        │
│  RLS : school_id = claim JWT                 │
│  Policies par rôle (admin / parent)          │
└─────────────────────────────────────────────┘
```

## Pourquoi ce modèle

| Critère | Shared DB + RLS | DB par école |
| --- | --- | --- |
| Coût | Faible | Élevé vite |
| Migrations | Une seule | N × écoles |
| Ops | Simple | Complexe |
| Isolation | RLS stricte | Physique |
| Standard SaaS B2B | Notion, Linear… | Rare au début |

## Injection du tenant

1. À l’inscription école → création `schools` row + user `school_admin`
2. Custom claim JWT : `{ school_id, role }`
3. Chaque requête client Supabase : RLS lit `auth.jwt() ->> 'school_id'`
4. Routes API Next.js : **vérifient aussi** `school_id` + `role` (défense en profondeur)

## Règles non-négociables

1. Toute table métier a `school_id` (UUID, FK vers `schools`)
2. Index sur `school_id` (et composites utiles : `(school_id, date)`, etc.)
3. Policy RLS créée **dans le même commit** que la table
4. Aucune query « globale » sans filtre tenant (sauf Super Admin via service role)
5. Le `service_role` Supabase n’est **jamais** exposé au frontend

## Super Admin

Le Super Admin opère hors tenant école :

- Liste / suspend des schools
- Monitoring abonnements Stripe
- Utilise le **service role** côté serveur uniquement (jamais dans le browser)

## Flux typique d’une requête

```text
Parent ouvre dashboard
  → Session Supabase (JWT avec school_id + role=parent)
  → Query students via parent_students
  → RLS : school_id match + parent lié à l’élève
  → Affichage présence / notes / alertes
```

## Ce qu’il faut éviter

- Filtrer seulement côté app sans RLS
- Mettre `school_id` en query string sans vérifier le JWT
- Partager des buckets Storage sans path scoppé par `school_id`
- Utiliser le service role dans des Server Components publics

## Lecture suivante

- Stack : **[03-STACK-TECHNIQUE.md](03-STACK-TECHNIQUE.md)**
- Auth : **[06-AUTH-MULTI-TENANT.md](06-AUTH-MULTI-TENANT.md)**
- RLS détail : **[07-SECURITE-RLS.md](07-SECURITE-RLS.md)**
