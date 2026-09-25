# STU-QUIZ — Quiz rattachés au référentiel maître

---

## STU-QUIZ-01 — Rattachement quiz à thème/fiche maître

**Priorité : Should** · **Dépendances : STU-DATA-01**

**Contexte** : "Les quiz sont rattachés aux thèmes/fiches du référentiel" (§14) — un seul système de quiz, pas de duplication entre un champ texte embarqué dans la fiche et une table séparée (point de vigilance déjà identifié lors de l'audit du modèle précédent).

**À faire** : `quizzes` référence `master_theme_id`/`master_sheet_id`, un quiz créé sur un thème est automatiquement proposé sur les fiches de ce thème.

**Critères d'acceptation**

- Un seul mécanisme de quiz existe dans le code — aucun champ de quiz dupliqué sur la fiche elle-même.

---

## STU-QUIZ-02 — Explication pédagogique sur mauvaise réponse

**Priorité : Could** · **Dépendances : STU-QUIZ-01**

**Contexte** : "Une mauvaise réponse doit afficher l'explication de la règle, pas seulement 'bonne réponse / mauvaise réponse'" (§14) — déjà en grande partie couvert par les évolutions actées au CR du 17/09 (une question par écran, chrono, affichage réponse/bonne réponse).

**À faire** : étendre le format de question (déjà porté via `parseQuiz()`) pour inclure un champ d'explication par question.

**Critères d'acceptation**

- Reporté sans risque si le temps manque — le quiz reste fonctionnel sans cette explication, juste moins pédagogique.

---

## STU-QUIZ-03 — Écran d'administration des quiz (onglet dédié)

**Priorité : Must** (ajouté après coup — l'onglet "Quiz & formations" n'avait aucun écran, STU-QUIZ-01 ne couvre que le mécanisme de rattachement) · **Dépendances : STU-QUIZ-01**

**Contexte** : onglet "Quiz & formations" (§3 du dossier) — "gérer les quiz par thème et les CTA de formation associés".

**À faire** : écran `/quiz` — liste des `quizzes` existants (titre, thème/fiche rattaché, statut publié), formulaire de création/édition (titre, thème ou fiche, contenu au format `parseQuiz()`, publié oui/non).

**Critères d'acceptation**

- Accessible depuis la navigation Studio.
- Un quiz créé ici et rattaché à un thème est bien celui automatiquement proposé sur les fiches de ce thème (cohérence avec STU-QUIZ-01, pas un système parallèle).
