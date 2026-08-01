# Rôles et permissions (MVP v1)

## Matrice des rôles

| Capacité | Super Admin | School Admin | Parent |
| --- | --- | --- | --- |
| Gérer tenants / billing SaaS | ✅ | ❌ | ❌ |
| CRUD classes / élèves | ❌ | ✅ (son école) | ❌ |
| Lier parent ↔ élève | ❌ | ✅ | ❌ |
| Saisir présence | ❌ | ✅ | ❌ |
| Voir présence de ses enfants | ❌ | ✅ (école) | ✅ |
| Justifier une absence | ❌ | ✅ (valider) | ✅ (uploader) |
| Saisir notes | ❌ | ✅ | ❌ |
| Voir notes / moyennes | ❌ | ✅ | ✅ (ses enfants) |
| Publier annonces | ❌ | ✅ | ❌ |
| Lire annonces | ❌ | ✅ | ✅ |
| Messagerie 1-to-1 | ❌ | ✅ | ✅ (↔ admin) |
| Dashboard école | ❌ | ✅ | ❌ |
| Dashboard enfants | ❌ | — | ✅ |

## Super Admin

- Compte plateforme (pas rattaché à une école, ou `school_id` null)
- Accès via routes `/super-admin/*` + service role serveur
- Actions : créer/suspendre école, voir abonnements Stripe, monitoring

## School Admin

- Créé à l’inscription de l’école (ou invité plus tard)
- Plein pouvoir **dans son `school_id` uniquement**
- En v1 : remplace aussi le prof (saisie présence/notes)

## Parent

- Invité par l’admin (email) ou créé + lié via `parent_students`
- Lecture seule sur ses enfants
- Écriture limitée : justificatif d’absence + envoi messages + marquage lu notifications

## Règles d’accès métier

1. Parent A ne voit **jamais** l’élève de Parent B (même école)
2. Admin école A ne voit **jamais** école B
3. Un parent ne peut justifier que les absences de **ses** enfants
4. Messagerie : parent ne contacte que les `school_admin` de son école (pas d’autres parents en v1)

## Claim JWT attendu

```json
{
  "sub": "user-uuid",
  "school_id": "school-uuid",
  "role": "school_admin"
}
```

Pour Super Admin : `"role": "super_admin"` et pas de `school_id` (ou null).

## v2 — rôle Prof (hors MVP)

- Saisie présence/notes pour ses classes seulement
- Pas de gestion billing / structure école
- Ne pas implémenter avant stabilisation v1
