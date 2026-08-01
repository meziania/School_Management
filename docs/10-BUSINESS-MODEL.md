# Business model

## Modèle

Abonnement **mensuel par école**, selon un **tiers de taille** (prévisibilité pour la direction).

Pas de facturation à l’élève unitaire en v1.

## Plans

| Plan | Taille | Inclus |
| --- | --- | --- |
| **Starter** | ≤ 150 élèves | Core : présence, notes, messagerie, annonces, dashboards |
| **Standard** | 150–500 élèves | + paiements scolarité*, calendrier*, rapports* |
| **Enterprise** | 500+ | Sur devis : multi-établissements, API, support dédié |

\* Fonctions marquées : **hors scope code v1** — le plan peut les vendre plus tard ; ne pas les construire maintenant sauf billing Stripe des plans.

## Trial

- 30 jours gratuits à l’inscription d’une nouvelle école
- Accès features Starter pendant le trial
- Après trial sans paiement : statut `expired` / accès restreint

## Stripe (SaaS billing)

Objets :

- Customer lié à `schools` / `subscriptions.stripe_customer_id`
- Products/Prices pour Starter & Standard (Enterprise = devis manuel)
- Webhooks mettent à jour `subscriptions.status`, `schools.plan`, `subscription_status`

## Ce qui n’est PAS le business model v1

- Commission sur frais de scolarité parent
- Marketplace
- Pub
- Vente de données

## Métriques à suivre (plus tard)

- Écoles actives (MAU tenant)
- Conversion trial → paid
- Churn mensuel
- Élèves moyens par école

## Lecture suivante

- Hors scope produit : **[14-HORS-SCOPE.md](14-HORS-SCOPE.md)**
- Roadmap : **[11-ROADMAP-SPRINTS.md](11-ROADMAP-SPRINTS.md)**
