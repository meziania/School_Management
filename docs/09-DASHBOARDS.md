# Dashboards

## Dashboard Parent

**Objectif** : en 10 secondes, savoir si tout va bien pour mon/mes enfant(s).

### Contenu MVP

| Bloc | Données |
| --- | --- |
| Sélecteur enfant | Si plusieurs enfants liés |
| Assiduité | % présence période courte (7/30 j) + absences récentes |
| Dernières notes | 5 dernières + alerte si note basse (seuil configurable plus tard) |
| Alertes | Absences non justifiées, nouveaux messages, annonces non lues |
| Accès rapides | Présence, notes, messages, annonces |

### Ce qu’on n’affiche pas (v1)

- Classement / comparaison entre élèves
- Stats de toute la classe
- Emploi du temps

## Dashboard Admin

**Objectif** : vue école / classe pour agir vite (absents du jour, messages).

### Contenu MVP

| Bloc | Données |
| --- | --- |
| KPIs | Effectif, absents aujourd’hui, retards, messages non lus |
| Absences du jour | Liste par classe, lien saisie présence |
| Alertes | Justificatifs en attente, absences répétées (règle simple : ≥3 / 7j) |
| Raccourcis | Classes, élèves, annonce, messagerie |

### Filtres

- Par classe
- Par date (défaut aujourd’hui)

## Principes UX

- UI en **français**
- Mobile-friendly (parents souvent sur téléphone)
- Pas de surcharge : un écran = une intention
- États vides clairs (« Aucun élève lié — contactez l’école »)

## Données / perf

- Agrégats simples en SQL (count, avg) scopés `school_id`
- Pas de data warehouse en v1
- Prefetch enfant actif côté parent

## Lectures liées

- Features : **[08-FEATURES-MVP.md](08-FEATURES-MVP.md)**
- Modèle : **[04-MODELE-DONNEES.md](04-MODELE-DONNEES.md)**
