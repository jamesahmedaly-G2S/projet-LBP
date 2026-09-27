# STU-INTERVIEW — Entretiens annuels clients

---

## STU-INTERVIEW-01 — Vue globale des entretiens ✅ Fait

**Priorité : Should** · **Dépendances : STU-DATA-04**

**Contexte** : onglet "Entretiens" (§11) — "À planifier / Planifiés / Réalisés / En retard", calcul automatique via les seuils configurés.

**Réalisé** : `app/(studio)/entretiens/page.tsx` — port de `stEntretiens()`, 4 paniers. Écart réel par rapport au prototype : celui-ci ne peut jamais remplir le panier "Planifiés" (sa donnée de démo n'a qu'un `lastEntretien` unique, sans statut) — `bucketEntretien()` (`lib/studio/entretien.ts`) exploite le vrai statut explicite de `company_interviews` (`to_plan`/`planned`/`done`/`late`) pour distinguer un entretien réellement programmé (`planned`) d'une simple échéance approchante sans rien de prévu. "En retard" reste dérivé uniquement de l'échéance dépassée (`daysUntilNext<0`), jamais d'un statut oublié à la main — critère d'acceptation respecté à la lettre. Bouton "Lancer l'entretien" (`StartInterviewButton`, réutilisé aussi depuis la fiche client) sur chaque ligne. Onglet "Entretiens" de la navigation activé.

**Vérifié** : test réel navigateur — les 3 sociétés de démo correctement réparties (GAMMA "En retard", BETA "À planifier", ALPHA "Suivi à jour") ; une société de test avec un entretien démarré (`status='planned'`) bascule immédiatement dans "Planifiés", confirmant que le classement suit le vrai statut et non un seuil de date figé.

**Critères d'acceptation**

- Un entretien dont l'échéance est dépassée sans être marqué "réalisé" apparaît en "En retard" automatiquement, sans action manuelle.

---

## STU-INTERVIEW-02 — Déroulé d'un entretien annuel ✅ Fait

**Priorité : Must** · **Dépendances : STU-QUEST-02, STU-QUEST-03, STU-AFFECT-01**

**Contexte** : scénario D en entier — "ouvrir le questionnaire actuel prérempli... comparer... identifier les impacts... soumettre au contrôle G2S avant toute modification... mettre à jour la date du dernier entretien et calculer automatiquement la prochaine échéance" (§11).

**Réalisé** : `clients/[id]/entretien/actions.ts` — `startInterview()` reprend un entretien déjà ouvert et non terminé pour cette société (jamais de doublon), sinon en crée un et prend un **instantané des fiches actuellement affectées** (`before_sheet_ids`, migration `20260928080000_snapshot_avant_entretien.sql`) ; `completeInterview()` marque `status='done'`/`completed_at` — `summarizeEntretiens()` (STU-CLIENT-02) recalcule alors automatiquement la prochaine échéance, jamais une date stockée en dur. `clients/[id]/entretien/[interviewId]/page.tsx` réutilise **tels quels** `CcnSection` (STU-CCN-02) et `QuestionnaireForm`/`AnswerComparisonTable` (STU-QUEST-02/03, réutilisation déjà annoncée par ces tickets) et ajoute "Différences et impacts" (fiches nouvellement affectées / devenues non applicables) en comparant l'instantané de départ à la vraie vue `company_sheet_affectations` relue en direct — jamais une deuxième implémentation du calcul d'affectation. Bouton "Soumettre au contrôle G2S et publier" avec confirmation explicite, port de `entApply()`.

**Interprétation du critère "aucun changement visible avant validation G2S explicite"** : les réponses/CCN modifiées pendant l'entretien s'enregistrent immédiatement (`company_questionnaire_answers`/`company_ccns`), cohérent avec le comportement déjà validé et testé de STU-QUEST-02 ("chaque réponse enregistrée déclenche immédiatement le recalcul visible"). La validation G2S explicite porte sur la clôture de l'entretien lui-même (`completed_at`, nouvelle échéance) — une remise en cause de l'écriture immédiate des réponses reviendrait sur un choix déjà tranché et vérifié dans STU-QUEST-02, hors périmètre de ce ticket.

**Correctif STU-CLIENT-04 (trouvé en construisant ce ticket)** : la vue "Accéder au LBP du client" ne filtrait pas les fiches retirées manuellement (`company_sheet_overrides`, STU-AFFECT-03) — une fiche retirée pour un client restait visible dans son propre LBP. Corrigé (arborescence et fiche individuelle).

**Vérifié** : test réel navigateur bout en bout sur une société de test — entretien démarré, réponse modifiée (titres-restaurant oui→non), comparaison affichant "1 réponse modifiée" avec la vraie valeur avant/après, entretien soumis et clôturé, fiche client confirmant la nouvelle date d'entretien et la prochaine échéance recalculée (+12 mois). Confirmé en base : nouvelle ligne d'historique de réponse réelle, `company_interviews.status='done'`.

**Critères d'acceptation**

- Rejoue exactement le scénario D du dossier : à la fin du parcours, la société a une nouvelle CCN, des affectations recalculées, et une prochaine échéance mise à jour — sans qu'aucun changement ne soit visible côté client avant validation G2S explicite.
