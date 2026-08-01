# Docs — School Management SaaS

Documentation de référence pour le projet **School Management** : plateforme SaaS multi-tenant de gestion scolaire.

> Toute décision d’architecture qui s’écarte de ces docs doit être discutée avant implémentation.

## Par où commencer

1. **[00-CONTEXTE-PROJET.md](00-CONTEXTE-PROJET.md)** — Vision, rôles, stack, scope MVP (document maître)
2. **[02-ARCHITECTURE-MULTI-TENANT.md](02-ARCHITECTURE-MULTI-TENANT.md)** — Shared DB + `school_id` + RLS
3. **[04-MODELE-DONNEES.md](04-MODELE-DONNEES.md)** — Schéma core MVP
4. **[11-ROADMAP-SPRINTS.md](11-ROADMAP-SPRINTS.md)** — Ordre de build
5. **[13-CHECKLIST-DEMARRAGE.md](13-CHECKLIST-DEMARRAGE.md)** — Avant de coder

## Index des chapitres

| Fichier | Contenu |
| --- | --- |
| [00-CONTEXTE-PROJET.md](00-CONTEXTE-PROJET.md) | Vision globale, décisions figées, scope |
| [01-VISION-ET-PRINCIPES.md](01-VISION-ET-PRINCIPES.md) | Pourquoi le produit existe, principes |
| [02-ARCHITECTURE-MULTI-TENANT.md](02-ARCHITECTURE-MULTI-TENANT.md) | Isolation tenants, JWT, RLS |
| [03-STACK-TECHNIQUE.md](03-STACK-TECHNIQUE.md) | Next.js, Supabase, Stripe, Vercel |
| [04-MODELE-DONNEES.md](04-MODELE-DONNEES.md) | Tables MVP + règles `school_id` |
| [05-ROLES-ET-PERMISSIONS.md](05-ROLES-ET-PERMISSIONS.md) | Super Admin, School Admin, Parent |
| [06-AUTH-MULTI-TENANT.md](06-AUTH-MULTI-TENANT.md) | Signup école, login, claims JWT |
| [07-SECURITE-RLS.md](07-SECURITE-RLS.md) | Policies RLS non-négociables |
| [08-FEATURES-MVP.md](08-FEATURES-MVP.md) | Présence, notes, annonces, messagerie… |
| [09-DASHBOARDS.md](09-DASHBOARDS.md) | Dashboard admin + parent |
| [10-BUSINESS-MODEL.md](10-BUSINESS-MODEL.md) | Plans Starter / Standard / Enterprise |
| [11-ROADMAP-SPRINTS.md](11-ROADMAP-SPRINTS.md) | Priorité de développement |
| [12-STANDARDS-DEVELOPPEMENT.md](12-STANDARDS-DEVELOPPEMENT.md) | Conventions code & commits |
| [13-CHECKLIST-DEMARRAGE.md](13-CHECKLIST-DEMARRAGE.md) | Checklist avant implémentation |
| [14-HORS-SCOPE.md](14-HORS-SCOPE.md) | Ce qu’on ne construit pas en v1 |

## Question centrale du produit

> **Comment une école suit chaque élève au quotidien, et comment les parents restent informés en temps réel — pas seulement au bulletin trimestriel ?**
