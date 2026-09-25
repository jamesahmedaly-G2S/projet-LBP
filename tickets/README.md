# Tickets — Pivot LBP Studio

Backlog local (branche `chore/environnement-de-travail-perso`, jamais poussé vers les issues GitHub de James) pour construire la maquette de validation du pivot Studio décrit dans `Dossier_Claude_LBP_Studio_G2S_ULTRA_COMPLET.docx`, avant transmission à l'équipe technique.

## Méthode de priorisation (MoSCoW)

Ancrée sur les 6 scénarios que le dossier Studio exige de pouvoir démontrer (§16, scénarios A à F) et sur l'échéance du 15/10.

- **Must** : nécessaire pour dérouler au moins un des scénarios A-F de bout en bout.
- **Should** : explicitement demandé par le dossier, mais pas bloquant pour démontrer un scénario.
- **Could** : amélioration ou finition mentionnée dans le dossier, sacrifiable sans casser la démonstration.
- **Won't (ce cycle)** : explicitement hors périmètre — soit déjà écarté par les CR (§17 du dossier, "Ce que Claude ne doit pas faire"), soit couvert par un chantier séparé déjà ticketé côté James (automatisation veille #85-87, PWA #76-80, chatbot, accessibilité renforcée, connexions directes sources officielles, facturation/stats/export/multilingue déjà en `BACKLOG-*`).

## Index des epics

| Epic          | Sujet                                            | Tickets | Fichier                              |
| ------------- | ------------------------------------------------ | ------- | ------------------------------------ |
| STU-DATA      | Fondations base de données (schéma Studio)       | 8       | [STU-DATA.md](STU-DATA.md)           |
| STU-REF       | Référentiel maître (familles/thèmes/fiches)      | 5       | [STU-REF.md](STU-REF.md)             |
| STU-CCN       | Multi-CCN                                        | 3       | [STU-CCN.md](STU-CCN.md)             |
| STU-QUEST     | Questionnaire maître                             | 3       | [STU-QUEST.md](STU-QUEST.md)         |
| STU-AFFECT    | Moteur d'affectation                             | 3       | [STU-AFFECT.md](STU-AFFECT.md)       |
| STU-WORKFLOW  | Versioning & publication (7 statuts)             | 5       | [STU-WORKFLOW.md](STU-WORKFLOW.md)   |
| STU-VEILLE    | Veille connectée au référentiel                  | 4       | [STU-VEILLE.md](STU-VEILLE.md)       |
| STU-INTERVIEW | Entretiens annuels clients                       | 2       | [STU-INTERVIEW.md](STU-INTERVIEW.md) |
| STU-CLIENT    | Gestion clients (assistant + fiche + vue client) | 4       | [STU-CLIENT.md](STU-CLIENT.md)       |
| STU-DASH      | Tableau de bord Studio                           | 2       | [STU-DASH.md](STU-DASH.md)           |
| STU-DESIGN    | Identité visuelle Studio                         | 2       | [STU-DESIGN.md](STU-DESIGN.md)       |
| STU-OFFER     | Offres et droits de contenu par couche           | 2       | [STU-OFFER.md](STU-OFFER.md)         |
| STU-QUIZ      | Quiz rattachés au référentiel maître             | 2       | [STU-QUIZ.md](STU-QUIZ.md)           |

**Total : 45 tickets.**

## Séquencement recommandé

1. **STU-DATA** (fondations — tout le reste en dépend)
2. **STU-REF + STU-CCN** en parallèle (référentiel navigable + multi-CCN)
3. **STU-WORKFLOW + STU-AFFECT** (le cœur du moteur : versioning, publication, affectation)
4. **STU-CLIENT + STU-QUEST** (assistant de création, scénario A jouable de bout en bout)
5. **STU-VEILLE + STU-INTERVIEW** (scénarios B, C, D, E)
6. **STU-DASH + STU-DESIGN + STU-OFFER + STU-QUIZ** (finition, scénario F, polish)

Chaque epic liste ses tickets avec priorité MoSCoW, contexte, critères d'acceptation et dépendances. La modélisation de référence est `Nouveau dossier/Modelisation-BDD-LBP.md` (hors dépôt Git, à la racine de `LBP_V2`).
