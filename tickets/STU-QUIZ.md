# STU-QUIZ — Quiz rattachés au référentiel maître

---

## STU-QUIZ-01 — Rattachement quiz à thème/fiche maître ✅ Fait

**Priorité : Should** · **Dépendances : STU-DATA-01**

**Contexte** : "Les quiz sont rattachés aux thèmes/fiches du référentiel" (§14) — un seul système de quiz, pas de duplication entre un champ texte embarqué dans la fiche et une table séparée (point de vigilance déjà identifié lors de l'audit du modèle précédent).

**Réalisé** : `quizzes.theme_id` (baseline James) référence l'ancienne table `themes`, incompatible avec `master_themes` — même situation que `legal_monitoring.sheet_id` (STU-VEILLE-02). Migration `20260928090000_quiz_rattache_referentiel_maitre.sql` : colonnes additives `master_theme_id`/`master_sheet_id`, contrainte `quizzes_one_attachment` (exactement l'un des deux, jamais les deux — même convention que `quiz_scores_one_origin` déjà dans la baseline). `lib/studio/parse-quiz.ts` : port 1:1 de `parseQuiz()` (`LBP_V6_Studio.html`), désigné par `docs/ARCHITECTURE.md` §10 comme devant être "porté tel quel avec ses tests" — aucune infrastructure de test formel n'existait encore dans ce projet, vérifié à la place par exécution réelle (même pratique que `content-diff.ts`, STU-WORKFLOW-05).
**Correctif trouvé en testant en réel** : un `<textarea>` soumis via un vrai `<form>` HTML normalise les retours à la ligne en CRLF — `\r\n\r\n` ne contient plus deux `\n` consécutifs, cassant la séparation des questions par ligne vide. `parseQuiz()` normalise désormais les fins de ligne avant de découper.
**Vérifié** : test réel navigateur — quiz créé avec 2 questions séparées par une ligne vide, rattaché à un vrai thème, comptage de questions exact sur l'écran de liste (2, pas 1, après le correctif CRLF).

**Critères d'acceptation**

- Un seul mécanisme de quiz existe dans le code — aucun champ de quiz dupliqué sur la fiche elle-même.

---

## STU-QUIZ-02 — Explication pédagogique sur mauvaise réponse ✅ Fait

**Priorité : Could** · **Dépendances : STU-QUIZ-01**

**Contexte** : "Une mauvaise réponse doit afficher l'explication de la règle, pas seulement 'bonne réponse / mauvaise réponse'" (§14) — déjà en grande partie couvert par les évolutions actées au CR du 17/09 (une question par écran, chrono, affichage réponse/bonne réponse).

**Réalisé** : le format réel de `parseQuiz()` porté pour STU-QUIZ-01 inclut déjà nativement le champ `expl` (ligne `> explication`) — rien à ajouter au format, juste vérifié que le port le gère correctement (testé en réel : présence ET absence d'explication sur des questions différentes du même quiz). Le lecteur de quiz qui afficherait cette explication (`quizPlayerFromText()`) est côté "LBP Client", hors périmètre Studio.

**Critères d'acceptation**

- Reporté sans risque si le temps manque — le quiz reste fonctionnel sans cette explication, juste moins pédagogique.

---

## STU-QUIZ-03 — Écran d'administration des quiz (onglet dédié) ✅ Fait

**Priorité : Must** (ajouté après coup — l'onglet "Quiz & formations" n'avait aucun écran, STU-QUIZ-01 ne couvre que le mécanisme de rattachement) · **Dépendances : STU-QUIZ-01**

**Contexte** : onglet "Quiz & formations" (§3 du dossier) — "gérer les quiz par thème et les CTA de formation associés".

**Réalisé** : `/quiz` (liste — titre, thème/fiche rattaché, nombre de questions via `parseQuiz()`, statut publié), `/quiz/nouveau` et `/quiz/[id]` (formulaire partagé `QuizForm.tsx` — titre, description, choix thème/fiche, contenu au format `parseQuiz()` avec l'aide de format affichée, publié oui/non), suppression avec confirmation. Onglet "Quiz & formations" activé dans la navigation.
**Vérifié** : test réel navigateur bout en bout — création, affichage correct dans la liste (rattachement réel affiché : "Avantages & périphériques de rémunération"), édition avec les vraies valeurs préremplies.

**Critères d'acceptation**

- Accessible depuis la navigation Studio.
- Un quiz créé ici et rattaché à un thème est bien celui automatiquement proposé sur les fiches de ce thème (cohérence avec STU-QUIZ-01, pas un système parallèle).
