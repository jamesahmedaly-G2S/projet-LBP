# Tickets — Pivot LBP Studio

Backlog local (branche `chore/environnement-de-travail-perso`, jamais poussé vers les issues GitHub de James) pour construire la maquette de validation du pivot Studio décrit dans `Dossier_Claude_LBP_Studio_G2S_ULTRA_COMPLET.docx`, avant transmission à l'équipe technique.

## Méthode de priorisation (MoSCoW)

Ancrée sur les 6 scénarios que le dossier Studio exige de pouvoir démontrer (§16, scénarios A à F) et sur l'échéance du 15/10.

- **Must** : nécessaire pour dérouler au moins un des scénarios A-F de bout en bout.
- **Should** : explicitement demandé par le dossier, mais pas bloquant pour démontrer un scénario.
- **Could** : amélioration ou finition mentionnée dans le dossier, sacrifiable sans casser la démonstration.
- **Won't (ce cycle)** : explicitement hors périmètre — soit déjà écarté par les CR (§17 du dossier, "Ce que Claude ne doit pas faire"), soit couvert par un chantier séparé déjà ticketé côté James (automatisation veille #85-87, PWA #76-80, chatbot, accessibilité renforcée, connexions directes sources officielles, facturation/stats/export/multilingue déjà en `BACKLOG-*`).

## Index des epics

| Epic          | Sujet                                                                                                  | Tickets | Fichier                              |
| ------------- | ------------------------------------------------------------------------------------------------------ | ------- | ------------------------------------ |
| STU-DATA      | Fondations base de données (schéma Studio)                                                             | 8       | [STU-DATA.md](STU-DATA.md)           |
| STU-REF       | Référentiel maître (familles/thèmes/fiches)                                                            | 5       | [STU-REF.md](STU-REF.md)             |
| STU-CCN       | Multi-CCN                                                                                              | 3       | [STU-CCN.md](STU-CCN.md)             |
| STU-QUEST     | Questionnaire maître                                                                                   | 3       | [STU-QUEST.md](STU-QUEST.md)         |
| STU-AFFECT    | Moteur d'affectation                                                                                   | 4       | [STU-AFFECT.md](STU-AFFECT.md)       |
| STU-WORKFLOW  | Versioning & publication (7 statuts)                                                                   | 7       | [STU-WORKFLOW.md](STU-WORKFLOW.md)   |
| STU-VEILLE    | Veille connectée au référentiel                                                                        | 4       | [STU-VEILLE.md](STU-VEILLE.md)       |
| STU-INTERVIEW | Entretiens annuels clients                                                                             | 2       | [STU-INTERVIEW.md](STU-INTERVIEW.md) |
| STU-CLIENT    | Gestion clients (assistant + fiche + vue client)                                                       | 4       | [STU-CLIENT.md](STU-CLIENT.md)       |
| STU-DASH      | Tableau de bord Studio                                                                                 | 2       | [STU-DASH.md](STU-DASH.md)           |
| STU-DESIGN    | Identité visuelle Studio                                                                               | 4       | [STU-DESIGN.md](STU-DESIGN.md)       |
| STU-OFFER     | Offres et droits de contenu par couche                                                                 | 3       | [STU-OFFER.md](STU-OFFER.md)         |
| STU-QUIZ      | Quiz rattachés au référentiel maître                                                                   | 3       | [STU-QUIZ.md](STU-QUIZ.md)           |
| STU-AUTH      | Login minimal (ajouté en cours de route)                                                               | 1       | [STU-AUTH.md](STU-AUTH.md)           |
| STU-ADMIN     | Administration Studio (ajouté en cours de route)                                                       | 2       | [STU-ADMIN.md](STU-ADMIN.md)         |
| STU-IMPORT    | Import Word natif (DOCX) — ajouté 30/09/2026, cahier V9.4 §7, 4/5 faits (04 bloqué sur fiches étalons) | 5       | [STU-IMPORT.md](STU-IMPORT.md)       |

**Total : 60 tickets.** Le backlog LBP Client (14 modules + 2 ajoutés le 30/09/2026 — Calendrier RH, re-thème visuel V37) est suivi séparément dans [LBP-CLIENT.md](LBP-CLIENT.md), pas compté ici.

**Epics ajoutés après coup** :

- **STU-AUTH** : le login était supposé couvert côté James (AUTH-07/08/09). Sans lui, aucune revue visuelle manuelle des écrans Studio n'était possible.
- **STU-ADMIN** : l'onglet "Administration" de la navigation (§3 du dossier) n'avait aucun ticket nulle part — trou complet, corrigé.
- **STU-AFFECT-04, STU-WORKFLOW-06, STU-QUIZ-03** : les onglets "Affectations", "Publications" et "Quiz & formations" de la navigation n'avaient chacun aucun écran dédié ticketé (seulement des vues imbriquées ailleurs, ou le mécanisme technique seul) — ajoutés pour que chaque section de la navigation Studio ait un chemin réel vers un écran, conformément à la consigne de ne rien laisser de côté.

## Séquencement recommandé

1. **STU-DATA** (fondations — tout le reste en dépend)
2. **STU-REF + STU-CCN** en parallèle (référentiel navigable + multi-CCN)
3. **STU-WORKFLOW + STU-AFFECT** (le cœur du moteur : versioning, publication, affectation)
4. **STU-CLIENT + STU-QUEST** (assistant de création, scénario A jouable de bout en bout)
5. **STU-VEILLE + STU-INTERVIEW** (scénarios B, C, D, E)
6. **STU-DASH + STU-DESIGN + STU-OFFER + STU-QUIZ** (finition, scénario F, polish)

Chaque epic liste ses tickets avec priorité MoSCoW, contexte, critères d'acceptation et dépendances. La modélisation de référence est `Nouveau dossier/Modelisation-BDD-LBP.md` (hors dépôt Git, à la racine de `LBP_V2`).
