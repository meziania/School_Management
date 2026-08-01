# Checklist avant de commencer à coder

Utilise cette liste pour t’aligner sur `docs/` avant d’implémenter.

## Compréhension produit

- [ ] Je peux expliquer la vision en 2 phrases (**[01](01-VISION-ET-PRINCIPES.md)**)
- [ ] Je connais les 3 rôles MVP et ce qui est exclu (prof = v2) (**[05](05-ROLES-ET-PERMISSIONS.md)**)
- [ ] Je sais pourquoi Shared DB + RLS (**[02](02-ARCHITECTURE-MULTI-TENANT.md)**)

## Périmètre MVP

- [ ] Liste des 9 features v1 lue (**[08](08-FEATURES-MVP.md)** / **[00](00-CONTEXTE-PROJET.md)**)
- [ ] Hors scope v1 accepté (**[14](14-HORS-SCOPE.md)**)
- [ ] Plans Starter / Standard / Enterprise compris (**[10](10-BUSINESS-MODEL.md)**)

## Technique

- [ ] Stack validée : Next.js 14 + Supabase + Stripe + Resend + Vercel (**[03](03-STACK-TECHNIQUE.md)**)
- [ ] Toute table aura `school_id` + RLS dès le jour 1 (**[07](07-SECURITE-RLS.md)**)
- [ ] Claims JWT `school_id` + `role` prévus (**[06](06-AUTH-MULTI-TENANT.md)**)
- [ ] Modèle de données core relu (**[04](04-MODELE-DONNEES.md)**)

## Sécurité

- [ ] Service role jamais en `NEXT_PUBLIC_*`
- [ ] Plan de tests isolation parent / cross-school
- [ ] Storage justificatifs scoppé par `school_id`

## Ops / repo

- [ ] `.env.example` prévu
- [ ] Dossier `supabase/migrations` prévu
- [ ] Standards commit / TS strict acceptés (**[12](12-STANDARDS-DEVELOPPEMENT.md)**)

## Premier commit code suggéré

Quand tu es prêt : **Sprint 0 + début Sprint 1 uniquement**

- Next.js « hello »
- Migration `schools` + `users` + helpers RLS
- Signup école minimal

Pas de présence/notes tant que l’auth multi-tenant n’est pas solide.

→ Roadmap : **[11-ROADMAP-SPRINTS.md](11-ROADMAP-SPRINTS.md)**

---

**Index** : **[README.md](README.md)**
