# Features MVP (v1)

## 1. Auth multi-tenant

- Signup école → tenant + admin
- Login admin / parent
- Claims JWT `school_id` + `role`
- Middleware de routing par rôle

→ **[06-AUTH-MULTI-TENANT.md](06-AUTH-MULTI-TENANT.md)**

## 2. CRUD Admin — structure scolaire

| Entité | Actions admin |
| --- | --- |
| Classes | Créer, renommer, niveau, archiver |
| Élèves | CRUD, affecter à une classe |
| Parents | Inviter, lier/délier élèves |

UI française : « Classes », « Élèves », « Parents ».

## 3. Présence quotidienne

**Admin**

- Vue par classe + date (défaut : aujourd’hui)
- Statuts : présent / absent / retard
- Historique modifiable le jour même (règle à figer)

**Parent**

- Historique de présence de ses enfants
- Badge / alerte si absence du jour

## 4. Notes

**Admin**

- Saisie : matière, note, coefficient, trimestre, date
- Par élève ou saisie groupe (nice-to-have)

**Parent**

- Liste des notes
- Moyennes par matière / trimestre (calcul simple)

## 5. Annonces

**Admin**

- Titre + contenu
- Cible : toute l’école ou une classe
- Publication → crée notifications parents ciblés

**Parent**

- Fil d’annonces
- Marquer comme lu (via notifications)

## 6. Messagerie 1-to-1

- Parent ↔ School Admin uniquement (pas parent↔parent en v1)
- Liste conversations + thread
- Realtime optionnel (Supabase Realtime) ; polling acceptable au début
- Champ `is_read`

## 7. Justification d’absence

**Parent**

- Sur une absence : upload fichier (PDF/image) + commentaire
- Statut `is_justified` / texte justification

**Admin**

- Voir justificatif
- Accepter / refuser (champ statut optionnel en v1 ; minimum = voir le fichier)

## 8. Notifications in-app

Types MVP :

- `announcement`
- `absence`
- `grade`
- `message`
- `justification_submitted` (côté admin)

Email (Resend) : au minimum invitation parent + optionnellement absence du jour.

## Critères « done » par feature

Une feature est done seulement si :

1. UI admin et/ou parent selon le cas
2. Table(s) + RLS
3. Vérif `school_id` / `role` côté API
4. Cas nominal testé avec seed

## Ordre d’implémentation recommandé

Auth → CRUD structure → Présence → Notes → Dashboards → Annonces → Messagerie → Justificatifs → Polish

→ **[11-ROADMAP-SPRINTS.md](11-ROADMAP-SPRINTS.md)**
