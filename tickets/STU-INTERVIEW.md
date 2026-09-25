# STU-INTERVIEW — Entretiens annuels clients

---

## STU-INTERVIEW-01 — Vue globale des entretiens

**Priorité : Should** · **Dépendances : STU-DATA-04**

**Contexte** : onglet "Entretiens" (§11) — "À planifier / Planifiés / Réalisés / En retard", calcul automatique via les seuils configurés.

**À faire** : liste globale des `company_interviews` groupée par statut, avec code couleur basé sur l'échéance (mêmes seuils que la liste clients, STU-CLIENT-03).

**Critères d'acceptation**

- Un entretien dont l'échéance est dépassée sans être marqué "réalisé" apparaît en "En retard" automatiquement, sans action manuelle.

---

## STU-INTERVIEW-02 — Déroulé d'un entretien annuel

**Priorité : Must** · **Dépendances : STU-QUEST-02, STU-QUEST-03, STU-AFFECT-01**

**Contexte** : scénario D en entier — "ouvrir le questionnaire actuel prérempli... comparer... identifier les impacts... soumettre au contrôle G2S avant toute modification... mettre à jour la date du dernier entretien et calculer automatiquement la prochaine échéance" (§11).

**À faire** : parcours complet — ouverture du questionnaire prérempli (dernières réponses), modification/ajout de CCN, comparaison avant/après (STU-QUEST-03), recalcul des affectations (STU-AFFECT-01), validation G2S avant application, puis mise à jour de `company_interviews.completed_at` et calcul de la prochaine échéance.

**Critères d'acceptation**

- Rejoue exactement le scénario D du dossier : à la fin du parcours, la société a une nouvelle CCN, des affectations recalculées, et une prochaine échéance mise à jour — sans qu'aucun changement ne soit visible côté client avant validation G2S explicite.
