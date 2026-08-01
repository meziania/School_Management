# Vision et principes

## Le problème

Les parents d’élèves découvrent trop tard les problèmes :

- Absences répétées signalées en fin de trimestre
- Notes en baisse sans alerte
- Comportement qui se dégrade sans communication
- Direction débordée, messages perdus dans WhatsApp / cahiers

Les outils existants (cahier de texte papier, Excel, WhatsApp, logiciels lourds on-premise) ne offrent pas un **suivi quotidien simple** avec **isolation multi-école** moderne.

## Ce que le produit est

Une plateforme SaaS où chaque école a son espace :

```text
École s’abonne
  → Espace isolé (tenant)
  → Admin gère classes / élèves / présence / notes / annonces
  → Parents voient leurs enfants en temps quasi-réel
  → Messagerie direction ↔ parents
```

## Ce que le produit n’est pas

| Outil | Rôle | Différence |
| --- | --- | --- |
| Pronote / EcoleDirecte | Suites complètes FR | On démarre MVP léger, SaaS multi-tenant from scratch |
| WhatsApp école | Chat informel | Pas structuré (présence, notes, justificatifs) |
| Excel direction | Suivi manuel | Pas de parent portal, pas de realtime |
| CRM | Relations commerciales | Ici : suivi scolaire + communication famille |

## Principes fondamentaux

### 1. Le quotidien bat le trimestriel

Présence et notes saisies **chaque jour / chaque évaluation**, visibles immédiatement côté parent.

### 2. Isolation tenant absolue

Aucune donnée d’une école ne fuit vers une autre. RLS = filet de sécurité final.

### 3. Moins de rôles au début

MVP = Super Admin + School Admin + Parent. Pas de prof en v1 — l’admin saisit pour démarrer.

### 4. UI en français, schéma en anglais

Parents et direction utilisent l’interface en français. La base et le code restent en anglais (standard tech).

### 5. Feature = table + RLS ensemble

On n’ajoute jamais une table « pour plus tard » sans policy. Même commit.

### 6. Prévisibilité pour l’école

Pricing par **tiers de taille** (pas par élève facturé à l’unité), trial 30 jours.

## Objectifs produit (checklist)

- [ ] Une école peut s’inscrire et obtenir son espace en minutes
- [ ] L’admin crée classes, élèves, lie les parents
- [ ] Présence du jour saisie et visible parent
- [ ] Notes saisies et moyennes visibles parent
- [ ] Annonces + notifications
- [ ] Messagerie 1-to-1 parent ↔ admin
- [ ] Justification d’absence avec fichier
- [ ] Dashboards admin et parent utiles dès le jour 1
- [ ] Isolation RLS prouvée par tests

## Vision long terme (après MVP)

Rôle professeur, emploi du temps, paiements scolarité, app mobile, multi-établissements Enterprise, API publique.
