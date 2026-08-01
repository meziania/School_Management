# Auth multi-tenant

## Objectif

Signup école → tenant + admin. Login admin/parent avec `school_id` + `role` dans le JWT.

## Flux 1 — Inscription école (signup tenant)

```text
Formulaire public
  → nom école, subdomain, email admin, mot de passe
  → API serveur (service role) :
      1. Créer row schools (trial 30j)
      2. Créer auth.users + profile users (role=school_admin)
      3. Set custom claims { school_id, role }
      4. (optionnel) Créer Stripe customer + checkout trial
  → Redirect dashboard admin
```

## Flux 2 — Invitation parent

```text
Admin saisit email parent + lie élève(s)
  → Invite Supabase / magic link / temp password
  → Parent crée session
  → Claims { school_id, role: parent }
  → Rows parent_students
```

## Flux 3 — Login

```text
Email + password
  → Supabase Auth
  → Session avec JWT claims
  → Middleware Next.js :
      - pas de session → /login
      - role=school_admin → /admin/*
      - role=parent → /parent/*
      - role=super_admin → /super-admin/*
```

## Custom claims

À synchroniser dès création / changement de rôle :

| Claim | Source |
| --- | --- |
| `school_id` | `users.school_id` |
| `role` | `users.role` |

Mécanisme typique Supabase : Auth Hook / trigger sur `users` → `auth.set_claim` (ou JWT template).

**Important** : si `school_id` ou `role` change, forcer refresh session.

## Middleware & guards

Toute route protégée vérifie :

1. Session valide
2. `role` autorisé pour le segment d’URL
3. (API) `school_id` du body/params == claim (jamais faire confiance au client)

## Mots de passe & emails

- Reset password via Supabase + email Resend (ou SMTP Supabase)
- Emails en français

## Trial

- À la création school : `subscription_status = trial`, `trial_ends_at = now() + 30 days`
- Middleware soft : avertissement UI si trial bientôt fini
- Blocage hard features (sauf lecture) après expiration sans abo — à définir en sprint billing

## Cas d’erreur à gérer

| Cas | Comportement |
| --- | --- |
| Subdomain déjà pris | Erreur claire à l’inscription |
| Parent sans `parent_students` | Accès dashboard vide + message « contactez l’école » |
| Compte désactivé | Login refusé |
| JWT sans `school_id` (non super) | Logout + erreur |

## Lecture suivante

- RLS : **[07-SECURITE-RLS.md](07-SECURITE-RLS.md)**
- Features : **[08-FEATURES-MVP.md](08-FEATURES-MVP.md)**
