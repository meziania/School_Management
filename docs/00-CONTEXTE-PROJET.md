# School Management SaaS — Contexte projet

Document maître. Tout agent de code (Cursor, Claude Code, etc.) doit s’y aligner.

## Vision

Plateforme SaaS multi-tenant de gestion scolaire. Chaque école (tenant) s’abonne et obtient son propre espace isolé.

Le cœur du produit : **suivi quotidien** de l’élève (présence, notes, comportement) avec **communication temps réel** entre direction et parents, pour que les parents restent rassurés et informés en continu — pas seulement au bulletin trimestriel.

## Rôles (MVP v1)

| Rôle | Qui | Pouvoirs |
| --- | --- | --- |
| **Super Admin** | Propriétaire SaaS | Tenants, facturation, monitoring global |
| **School Admin** | Direction de l’école | Élèves, classes, présence, notes, annonces, messages |
| **Parent** | Parent d’élève(s) | Lecture seule enfants + justifier absences + messagerie admin |

*(Rôle **Prof** = prévu v2, pas dans le MVP)*

## Architecture multi-tenant

**Décision figée : Shared DB + `school_id` sur toutes les tables + Row Level Security (RLS) stricte.**

Raison : simplicité opérationnelle, coût réduit, standard des SaaS B2B (Notion, Linear…). Chaque requête est scopée par `school_id`, injecté dans le JWT via Supabase Auth custom claims. Isolation totale entre écoles garantie côté DB (RLS), pas seulement côté app.

**Règle non-négociable** : toute nouvelle table doit avoir une colonne `school_id` + une policy RLS correspondante dès sa création. Aucune query ne doit pouvoir traverser les tenants.

## Stack technique

| Couche | Choix |
| --- | --- |
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind |
| Backend | Next.js API routes (ou FastAPI si logique lourde séparée) |
| DB | PostgreSQL via Supabase |
| Auth | Supabase Auth + custom claims (`school_id`, `role` dans JWT) |
| Realtime / Notifications | Supabase Realtime (in-app) + Resend (emails transactionnels) |
| Paiement SaaS | Stripe (abonnements écoles) |
| Hosting | Vercel (frontend) + Supabase (DB/backend) |

## Scope MVP (v1) — à construire en premier

1. Auth multi-tenant — signup école (crée tenant + admin), login admin/parent avec `school_id` dans le JWT
2. CRUD Admin — classes, élèves, association parent↔élève
3. Présence quotidienne — saisie admin, historique visible parent
4. Notes — saisie admin, bulletin/moyennes visibles parent
5. Annonces — admin publie, parents reçoivent notification
6. Messagerie simple — parent ↔ admin, 1-to-1
7. Justification d’absence — parent uploade un justificatif
8. Dashboard parent — vue d’ensemble enfant
9. Dashboard admin — vue classe/école

## Hors scope v1

Rôle prof, paiement scolarité (école→parent), transport/cantine, app mobile native, emploi du temps, calendrier scolaire complet.

→ Détail : **[14-HORS-SCOPE.md](14-HORS-SCOPE.md)**

## Sécurité — non-négociable

- RLS Supabase active et testée sur **chaque** table dès sa création
- Un parent ne lit **jamais** les données d’un élève qui n’est pas le sien
- Un admin ne lit **jamais** les données d’une autre école
- Toute route API vérifie `school_id` + `role` avant d’exécuter une query

## Conventions

- TypeScript strict (pas de `any` sauf justifié)
- Composants React fonctionnels + hooks
- Tailwind pour le style
- Tables/colonnes en **anglais** (DB), UI en **français**
- Toute feature qui touche une table inclut sa policy RLS **dans le même commit**

## Priorité de développement

1. Setup Supabase (schéma + RLS) + Auth multi-tenant
2. CRUD écoles/classes/élèves (admin)
3. Présence (saisie + affichage parent)
4. Notes + dashboard parent
5. Annonces + messagerie + notifications
6. Justification absence + polish + tests avec école pilote

→ Détail sprints : **[11-ROADMAP-SPRINTS.md](11-ROADMAP-SPRINTS.md)**
