# Roadmap sprints

## Philosophie

Construire **incrémentalement**. Chaque sprint livre quelque chose d’utilisable par une école pilote.

```text
Auth + tenant → Structure (classes/élèves) → Présence → Notes
  → Dashboards → Annonces/Notifs → Messagerie → Justificatifs → Billing polish
```

## Sprint 0 — Fondation

- [ ] Repo Next.js 14 + TypeScript + Tailwind
- [ ] Projet Supabase + dossier `supabase/migrations`
- [ ] `.env.example`
- [ ] Helpers RLS (`request_school_id`, `request_role`)
- [ ] CI lint basique (optionnel)

## Sprint 1 — Auth multi-tenant

- [ ] Tables `schools`, `users` (+ link auth)
- [ ] Signup école (tenant + admin + claims)
- [ ] Login + middleware roles
- [ ] Seed 1 école de démo

## Sprint 2 — CRUD structure

- [ ] Classes, students, parent_students
- [ ] UI admin CRUD
- [ ] Invitation / création parent + liaison élèves
- [ ] RLS parent ne voit que ses élèves

## Sprint 3 — Présence

- [ ] Table `attendance` + RLS
- [ ] Saisie admin par classe/date
- [ ] Historique parent
- [ ] Notif absence (in-app minimum)

## Sprint 4 — Notes + dashboard parent

- [ ] Table `grades` + RLS
- [ ] Saisie admin
- [ ] Vue parent + moyennes simples
- [ ] Dashboard parent (assiduité + dernières notes + alertes)

## Sprint 5 — Annonces, messagerie, notifications

- [ ] `announcements`, `messages`, `notifications`
- [ ] Publication annonces + ciblage
- [ ] Messagerie 1-to-1 parent ↔ admin
- [ ] Dashboard admin (KPIs absences / messages)

## Sprint 6 — Justificatifs + polish + pilote

- [ ] Upload Storage justificatifs
- [ ] Parcours parent + revue admin
- [ ] Stripe trial / checkout Starter (si temps)
- [ ] Tests isolation RLS
- [ ] Recette avec une vraie école pilote

## Critères MVP « shippable »

- [ ] École s’inscrit seule
- [ ] Admin gère classes/élèves/parents
- [ ] Présence + notes visibles parents
- [ ] Annonces + messages
- [ ] Justificatif absence
- [ ] Deux dashboards utiles
- [ ] Aucune fuite cross-tenant (tests)

## Après MVP (v2+)

Rôle prof, calendrier, paiements scolarité, app mobile, Enterprise multi-établissements.

→ **[14-HORS-SCOPE.md](14-HORS-SCOPE.md)**
