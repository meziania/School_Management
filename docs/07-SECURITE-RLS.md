# Sécurité — RLS (non-négociable)

## Principes

1. RLS **activé** sur toutes les tables métier
2. Policy écrite **dans le même commit** que la table
3. Défense en profondeur : RLS + vérifs API (`school_id`, `role`)
4. `service_role` uniquement serveur, jamais dans le browser
5. Tests d’isolation avant de merger une feature sensible

## Helpers SQL (à créer tôt)

```sql
-- school_id du JWT
create or replace function public.request_school_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'school_id', '')::uuid;
$$;

-- role du JWT
create or replace function public.request_role()
returns text
language sql
stable
as $$
  select auth.jwt() ->> 'role';
$$;
```

## Patterns de policies

### Isolation tenant (base)

```sql
-- SELECT/INSERT/UPDATE/DELETE : school_id = request_school_id()
```

### School Admin — plein accès école

```sql
using (school_id = request_school_id() and request_role() = 'school_admin')
with check (school_id = request_school_id() and request_role() = 'school_admin')
```

### Parent — lecture élèves liés uniquement

```sql
-- students SELECT
using (
  school_id = request_school_id()
  and (
    request_role() = 'school_admin'
    or id in (
      select student_id from parent_students
      where parent_user_id = auth.uid()
        and school_id = request_school_id()
    )
  )
)
```

Même logique pour `attendance`, `grades` via `student_id` ∈ enfants du parent.

### Messages

- INSERT : `sender_id = auth.uid()` + même `school_id`
- SELECT : `sender_id = auth.uid()` OR `receiver_id = auth.uid()`
- Parent ne peut cibler que des users `school_admin` du même tenant

### Notifications

- SELECT/UPDATE (lu) : `user_id = auth.uid()` + `school_id` match
- INSERT : plutôt via trigger / service role (évite spoofing)

## Storage

Policies sur chemins `{school_id}/...` :

- Admin : lecture/écriture son école
- Parent : lecture/écriture seulement dossiers de ses élèves (justificatifs)

## Checklist avant merge d’une table

- [ ] Colonne `school_id` NOT NULL + FK
- [ ] Index `school_id`
- [ ] `ENABLE ROW LEVEL SECURITY`
- [ ] Policies SELECT / INSERT / UPDATE / DELETE couvertes
- [ ] Cas parent testé (voit son enfant, ne voit pas l’autre)
- [ ] Cas admin école A vs école B testé
- [ ] Aucun `USING (true)` « temporaire » laissé en place

## Tests d’isolation (minimum)

| Scénario | Attendu |
| --- | --- |
| Admin A liste students | Seulement école A |
| Parent P1 lit grades élève E2 (pas le sien) | 0 rows |
| Parent P1 update grade | Denied |
| API appelée avec `school_id` forgé dans le body | Reject côté API |

## Interdits

- Désactiver RLS « pour débloquer le dev »
- Exposer service role dans `NEXT_PUBLIC_*`
- Policies permissives `true` en production
- Croiser les tenants via vues sans security_barrier / RLS
