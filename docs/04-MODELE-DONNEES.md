# Modèle de données (core MVP)

## Règle pivot

**Chaque table métier a `school_id`.** C’est la colonne de tout le multi-tenancy.

Noms de tables/colonnes en **anglais**. UI en français.

## Entités

```text
Tenant (School)
  id, name, subdomain, plan, subscription_status, created_at

Subscription
  id, school_id, plan, stripe_customer_id, status, start_date, end_date

User (profile lié à auth.users)
  id, school_id, role (school_admin | parent), email, full_name

Class
  id, school_id, name, level

Student
  id, school_id, class_id, last_name, first_name, birth_date

ParentStudent (many-to-many)
  id, school_id, parent_user_id, student_id

Attendance
  id, school_id, student_id, date, status (present|absent|late),
  justification, is_justified:bool

Grade
  id, school_id, student_id, subject, score, coefficient, term, date

Announcement
  id, school_id, title, content, target (all | class_id),
  created_by, created_at

Message
  id, school_id, sender_id, receiver_id, content, is_read:bool, created_at

Notification
  id, school_id, user_id, type, content, is_read:bool, created_at
```

## Relations (résumé)

```text
School 1──* User
School 1──* Class
School 1──* Student
School 1──* Subscription

Class 1──* Student

User (parent) *──* Student   via ParentStudent

Student 1──* Attendance
Student 1──* Grade

User 1──* Message (as sender / receiver)
User 1──* Notification
User 1──* Announcement (created_by, admin)
```

## Contraintes importantes

| Table | Contrainte |
| --- | --- |
| `users` | `role` ∈ {`school_admin`, `parent`} en v1 ; Super Admin géré à part |
| `parent_students` | Unique `(parent_user_id, student_id)` ; même `school_id` |
| `attendance` | Unique `(student_id, date)` — une ligne par jour |
| `schools.subdomain` | Unique |
| FKs | Toujours dans le même `school_id` (pas de cross-tenant FK) |

## Storage (justificatifs)

Bucket privé ex. `absence-justifications` :

```text
{school_id}/{student_id}/{attendance_id}/{filename}
```

Policies Storage alignées sur `school_id` + lien parent↔élève.

## Migrations

- Tout schéma dans `supabase/migrations/`
- Une migration = tables + indexes + RLS policies
- Seed de démo : 1 école, 2 classes, quelques élèves, 1 admin, 2 parents

## Évolutions v2 (ne pas créer maintenant)

- `teachers`, `teacher_classes`
- `timetable_slots`
- `tuition_payments` (école→parent)
- `behavior_notes`

## Lecture suivante

- Rôles : **[05-ROLES-ET-PERMISSIONS.md](05-ROLES-ET-PERMISSIONS.md)**
- RLS : **[07-SECURITE-RLS.md](07-SECURITE-RLS.md)**
