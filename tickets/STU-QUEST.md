# STU-QUEST — Questionnaire maître

---

## STU-QUEST-01 — CRUD questions (types, conditionnelles, impacts)

**Priorité : Must** · **Dépendances : STU-DATA-03**

**Contexte** : "Le questionnaire doit contenir uniquement des informations utiles pour déterminer l'environnement du client ou déclencher/exclure des contenus" (§7.1), géré exclusivement par G2S.

**À faire** : écran admin listant/éditant `master_questions` (label, type ccn/select/bool/text, `required`, `options`, condition d'affichage) et `master_question_impacts` (quelle réponse déclenche quelle(s) fiche(s)).

**Critères d'acceptation**

- Une question conditionnelle (`condition_question_code`/`condition_value`) n'apparaît dans le formulaire de saisie (STU-QUEST-02) que si sa condition est remplie.
- Reproduit fonctionnellement les 17 questions déjà spécifiées dans `LBP_V6_Studio.html` (`QUESTIONS`).

---

## STU-QUEST-02 — Formulaire de saisie des réponses

**Priorité : Must** · **Dépendances : STU-QUEST-01, STU-DATA-04**

**Contexte** : "G2S crée le client et remplit le questionnaire ; le client ne remplit pas lui-même l'onboarding" (§6) — réservé au rôle admin.

**À faire** : formulaire affichant les questions visibles (selon conditions), écriture dans `company_questionnaire_answers`, accessible depuis l'assistant de création (STU-CLIENT-01) et depuis un entretien (STU-INTERVIEW-02).

**Critères d'acceptation**

- Un profil `client` ne peut pas accéder à cet écran (RLS + contrôle applicatif).
- Chaque réponse enregistrée déclenche immédiatement le recalcul visible dans `company_sheet_affectations`.

---

## STU-QUEST-03 — Historique et comparaison des réponses

**Priorité : Must** · **Dépendances : STU-QUEST-02, STU-DATA-04**

**Contexte** : nécessaire au scénario D — "comparer ancien et nouveau questionnaire" lors d'un entretien annuel.

**À faire** : vue comparant les réponses `company_current_answers` (avant l'entretien) aux nouvelles réponses saisies pendant l'entretien en cours, mettant en évidence les changements.

**Critères d'acceptation**

- Chaque réponse modifiée pendant un entretien est visuellement distinguée de celles qui n'ont pas changé.
- Les réponses inchangées ne génèrent aucun nouvel enregistrement inutile.
