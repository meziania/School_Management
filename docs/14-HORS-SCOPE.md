# Hors scope v1

Ne **pas** construire maintenant. Si une demande arrive en cours de MVP, la noter ici / en backlog v2.

## Rôles & organisation

- Rôle **Professeur** (saisie présence/notes par classe assignée)
- Multi-admins avec permissions granulaires
- Multi-établissements sous un même compte (Enterprise)

## Scolarité & vie scolaire

- Paiement des frais de scolarité (école → parents) — distinct du billing SaaS Stripe
- Transport scolaire
- Cantine
- Emploi du temps / planning des cours
- Calendrier scolaire complet (vacances, examens)
- Cahier de texte / devoirs
- Comportement / sanctions structurés (au-delà d’éventuelles notes libres)

## Canaux & clients

- Application mobile native (iOS/Android)
- WhatsApp / SMS gateway automatique
- Portail élève (compte élève)

## Technique avancée

- Database-per-tenant
- Microservices / bus d’événements complexe
- API publique documentée pour intégrations tierces
- BI / data warehouse
- IA (génération de bulletins, prédiction décrochage)

## Pourquoi c’est exclu

Chaque item ci-dessus allonge le time-to-pilote. Le MVP doit prouver :

> Une école suit la présence et les notes au quotidien ; les parents sont informés et peuvent échanger avec la direction.

## Quand réévaluer

Après recette avec **une école pilote** réelle et stabilisation des 9 features v1.
