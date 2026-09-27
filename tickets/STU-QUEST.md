# STU-QUEST — Questionnaire maître

---

## STU-QUEST-01 — CRUD questions (types, conditionnelles, impacts) ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-03**
**Réalisé** : `/questionnaires` (liste ordonnée), `/questionnaires/nouvelle` (création), `/questionnaires/[id]` (édition + gestion de `master_question_impacts` : ajout/retrait réponse→fiche). `CheckboxField` ajouté à `ui-kit/Field.tsx` (réutilisable pour "obligatoire" et les futures réponses `bool`, STU-QUEST-02). Seed : les 17 questions réelles de `LBP_V6_Studio.html` (`var QUESTIONS`, racine de `LBP_V2/`) reprises telles quelles (label, type, condition, ordre) — seules celles dont l'impact correspond à une fiche de démonstration existante ont une ligne `master_question_impacts` (référentiel complet non seedé, cf. STU-REF-04).
**Vérifié** : test réel navigateur — 17 questions affichées, question `q_ccn` (type CCN) et une conditionnelle (`q_tr_part` visible si `q_tr = oui`) confirmées ; ajout d'un impact réel via le formulaire, persistance confirmée en base et par navigation fraîche (un premier test avait donné un faux négatif à cause d'une course de navigation déjà rencontrée plusieurs fois cette session, pas un bug réel — revérifié directement en base et via un DOM fraîchement chargé) ; modification de libellé enregistrée ; création d'une 18ᵉ question réelle via le vrai formulaire, visible immédiatement dans la liste.

**Contexte** : "Le questionnaire doit contenir uniquement des informations utiles pour déterminer l'environnement du client ou déclencher/exclure des contenus" (§7.1), géré exclusivement par G2S.

**À faire** : écran admin listant/éditant `master_questions` (label, type ccn/select/bool/text, `required`, `options`, condition d'affichage) et `master_question_impacts` (quelle réponse déclenche quelle(s) fiche(s)).

**Critères d'acceptation**

- Une question conditionnelle (`condition_question_code`/`condition_value`) n'apparaît dans le formulaire de saisie (STU-QUEST-02) que si sa condition est remplie.
- Reproduit fonctionnellement les 17 questions déjà spécifiées dans `LBP_V6_Studio.html` (`QUESTIONS`).

---

## STU-QUEST-02 — Formulaire de saisie des réponses ✅ Fait

**Priorité : Must** · **Dépendances : STU-QUEST-01, STU-DATA-04**
**Réalisé** : `lib/studio/visible-questions.ts` (`getVisibleQuestions()`, reproduit `visibleQuestions()` de `LBP_V6_Studio.html`) ; `QuestionnaireForm.tsx` (composant réutilisable, client, réévalue les questions visibles en direct à chaque réponse) ; `saveCompanyAnswers()` (`clients/actions.ts`) — insertion pure (jamais d'update), historique complet dans `company_questionnaire_answers`. Accessible depuis la fiche client (bouton "Ouvrir le questionnaire"), même point d'entrée que `stOpenQuest()` dans la référence réelle. **Écart voulu par rapport à la référence** : `stOpenQuest()` est en lecture seule dans le prototype (la saisie n'y a lieu que via l'assistant ou l'entretien) — ici, formulaire réellement modifiable à tout moment depuis la fiche client, conformément au texte du ticket ; sera réutilisé tel quel par STU-CLIENT-01 (étape 3) et STU-INTERVIEW-02. Les questions de type `ccn` sont exclues (gérées par `CcnSection`, STU-CCN-02), reproduisant `qs.filter(q => q.type!=='ccn')`.
**Vérifié** : test réel navigateur — aucune question CCN dans le formulaire ; questions conditionnelles déjà répondues (`q_tr_part`, `q_elec`) visibles au chargement ; **bascule en direct sans rechargement** : passer `q_tr` à "non" fait disparaître `q_tr_part` instantanément. Écriture confirmée en base : nouvelle ligne à chaque enregistrement (historique), `company_current_answers` reflète toujours la dernière réponse. Recalcul immédiat vérifié sur une vraie fiche affectée : faire passer `q_teletravail` à "non" retire le badge "Questionnaire" de "Télétravail : allocation forfaitaire" sans que la fiche disparaisse (origine `base`/`offre` toujours présentes, comportement correct) ; remettre "oui" restaure le badge immédiatement.

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
