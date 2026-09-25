# STU-CLIENT — Gestion clients (assistant + fiche + vue client)

---

## STU-CLIENT-01 — Assistant guidé de création client

**Priorité : Must** · **Dépendances : STU-CCN-02, STU-QUEST-02, STU-AFFECT-01, STU-WORKFLOW-03**

**Contexte** : scénario A en entier, wizard à 8 étapes (§6) : Entreprise → Établissements → Questionnaire & CCN → Calcul automatique → Contrôle G2S → Validation → Publication → Accès client. "G2S crée le client et remplit le questionnaire ; le client ne remplit pas lui-même l'onboarding."

**À faire** : parcours en étapes (stepper), chaque étape visible et son état de progression clair, réservé au rôle admin de bout en bout.

**Critères d'acceptation**

- Rejoue exactement le scénario A : création société + 2 établissements + 2 CCN + réponses au questionnaire + proposition d'affectation calculée + retrait d'1 fiche et ajout manuel d'1 fiche + validation + publication + accès à la vue client final.
- Aucune étape ne peut être sautée sans que la précédente soit complète.

---

## STU-CLIENT-02 — Fiche client complète

**Priorité : Must** · **Dépendances : STU-CCN-02, STU-AFFECT-02, STU-WORKFLOW-04, STU-DATA-08**

**Contexte** : §5.2 — identité, établissements, offre, utilisateurs, CCN, questionnaire, fiches affectées, contenus spécifiques, mises à jour en attente, historique, bloc "Suivi annuel".

**À faire** : page fiche client rassemblant toutes ces sections, avec le bloc "Suivi annuel" (dernier entretien / temps restant / prochain entretien / code couleur — seuils centralisés dans `studio_settings` ou équivalent applicatif, jamais codés en dur dans plusieurs endroits).

**Critères d'acceptation**

- Modifier un seuil de couleur (rouge/jaune) à un seul endroit change le comportement partout où il est utilisé (fiche client + liste clients + vue globale entretiens).
- Pas de clignotement sur l'état rouge (exigence explicite du dossier, §5.2).

---

## STU-CLIENT-03 — Liste clients avec code couleur des entretiens

**Priorité : Must** · **Dépendances : STU-CLIENT-02**

**Contexte** : §5.1 — "ne pas ajouter une colonne 'État'. La couleur est portée directement par la cellule 'Prochain entretien'."

**À faire** : tableau des sociétés (entreprise, offre, CCN, état questionnaire, nombre de fiches, prochain entretien coloré), sans colonne d'état séparée.

**Critères d'acceptation**

- Aucune colonne "État"/"Statut" distincte de la cellule "Prochain entretien" n'existe dans ce tableau.

---

## STU-CLIENT-04 — Mode "Accéder au LBP du client"

**Priorité : Must** · **Dépendances : STU-DATA-07, STU-CLIENT-02**

**Contexte** : scénario F — "afficher le LBP exactement tel que le client le voit, avec un bandeau persistant... et un bouton 'Retour au LBP Studio'" (§5.3).

**À faire** : depuis la fiche client, bouton ouvrant la vue client réelle (celle branchée sur `client_sheet_content`) pour la société concernée, avec bandeau persistant "MODE VISUALISATION CLIENT — Vous consultez actuellement le LBP de [Entreprise]" et retour en un clic.

**Critères d'acceptation**

- Ce mode n'accorde aucun droit d'écriture supplémentaire — il affiche exactement ce que verrait un vrai profil client de cette société, en lecture.
- Le bandeau est visible sur toutes les pages consultées dans ce mode, sans exception.
