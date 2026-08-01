# Standards de développement

## Objectif

Code maintenable, typé, sécurisé multi-tenant — compréhensible dans 6 mois.

## Langage & framework

- TypeScript **strict** partout
- Pas de `any` sauf justification commentée
- React : composants fonctionnels + hooks
- Next.js App Router
- Tailwind pour le style (pas de CSS custom sauf cas particulier)

## Nommage

| Couche | Langue | Exemple |
| --- | --- | --- |
| DB tables/columns | English | `students`, `school_id`, `is_read` |
| Code TS | English | `getStudentAttendance` |
| UI strings | Français | « Absences », « Bulletin » |

## Multi-tenant (rappel)

Toute feature qui touche une table :

1. Inclut `school_id`
2. Inclut policy RLS
3. Même commit

## Organisation code (suggestion)

```text
app/
  (auth)/login|signup
  (admin)/...
  (parent)/...
  (super-admin)/...
  api/
components/
  admin/ parent/ ui/
lib/
  supabase/ auth/ validations/
types/
supabase/migrations/
docs/
```

Feature-first quand ça grossit : `features/attendance`, `features/grades`, etc.

## API / Server Actions

- Valider l’entrée (Zod recommandé)
- Vérifier session + `role` + `school_id`
- Erreurs structurées, messages UI en français
- Ne jamais faire confiance au `school_id` envoyé par le client seul

## Supabase clients

| Client | Où | Clé |
| --- | --- | --- |
| Browser | Client components | anon |
| Server user | RSC / route avec session | anon + cookies |
| Admin | Webhooks, signup tenant, super-admin | service role |

## Git

Branches : `feature/...`, `fix/...`, `chore/...`  
Commits : `feat:`, `fix:`, `refactor:`, `docs:`, `test:`

Exemple :

```text
feat(attendance): add daily attendance form with RLS
```

## Secrets

- `.env` jamais commité
- `.env.example` à jour sans valeurs secrètes

## Tests (priorité MVP)

1. Policies RLS (SQL ou tests d’intégration)
2. Parcours auth signup/login
3. Smoke UI critique (présence, notes parent)

## PR checklist

- [ ] Scope limité
- [ ] RLS si schema touché
- [ ] UI FR cohérente
- [ ] Pas de `any` injustifié
- [ ] Comment tester documenté
