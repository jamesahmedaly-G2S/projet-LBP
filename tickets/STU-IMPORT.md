# STU-IMPORT — Import Word natif (DOCX)

Epic ajouté le 30/09/2026, suite au cahier des charges technique V9.4 (MAJ 29/09/2026) §7 "Import Word natif — nouveau processus de référence" et à l'analyse de la maquette de référence `LBP_V9.9_Studio.html`. Aucun de ces tickets n'est construit côté `projet-LBP/` à ce jour — l'import de fiches se fait uniquement à la main via les écrans du référentiel (STU-REF).

**Ce que remplace cet epic** : le cahier des charges est explicite (§1.1, §7.2) — l'ancien chemin "Word → Page Web filtrée" et le duo Mammoth/`extractRawText` sont supprimés comme processus normal, tout comme l'auto-remplissage silencieux du formulaire et les identifiants aléatoires dans le mapping. Ne pas les reprendre, même comme point de départ.

**Algorithme de référence** : `LBP_V9.9_Studio.html` a un vrai moteur client-side exploitable comme plan d'implémentation — `docxParse`/`wordAnalyseDocx`/`wordAnalyseElements` (à partir de la L.5227) lit le binaire .docx, détecte les 6 sections de la structure éditoriale obligatoire par niveau de titre, repère les blocs CCN par un motif `IDCC nnnn` à n'importe quel niveau de titre, préserve tableaux/listes/quiz, trace les rubriques inconnues plutôt que de les perdre silencieusement, et construit un écran de mapping (`wordMappingHTML`) avant toute validation. **Piège relevé dans la maquette, à ne pas reproduire** : deux fonctions `ficheImportWord()` coexistent (L.4643 la vraie logique, L.7671 un simple `alert()` mock qui écrase la première par hoisting JS) — incohérence interne au prototype, pas un comportement à porter.

---

## STU-IMPORT-01 — Lecture native DOCX + détection de structure

**Priorité : Must** · **Dépendances : STU-REF (référentiel maître), STU-DATA-02 (workflow_status)**

**Contexte** [§7.1, §7.3, §8.1] : processus cible `WORD .DOCX → LECTURE NATIVE → ANALYSE → MAPPING → CONTRÔLE G2S → BROUILLON → VALIDATION`. Éléments à préserver : titre principal et niveaux de titres, paragraphes, listes, tableaux avec en-têtes et lignes. La structure éditoriale obligatoire (§8.1) a 6 sections fixes : 1. L'essentiel à retenir, 2. Comprendre la règle, 3. Maîtriser la règle dans le détail, 4. Application concrète en paie, 5. Points de vigilance, 6. Quiz — à faire correspondre aux 5 champs déjà existants côté `SHEET_CONTENT_FIELDS` (essentiel/comprendre/maîtriser/application/vigilance, cf. LBP-CLIENT-03) plus le quiz séparément (STU-QUIZ).

**À faire** : service serveur de parsing DOCX structuré (choix de librairie à trancher — pas de dépendance DOCX dans `package.json` actuellement), détection des niveaux de titres et découpage par section, extraction fidèle des tableaux (en-têtes + lignes) et listes sans les aplatir en texte brut. Rubrique inconnue = conservée et signalée, jamais perdue silencieusement (§7.2, exigence explicite).

---

## STU-IMPORT-02 — Détection et normalisation des CCN

**Priorité : Must** · **Dépendances : STU-IMPORT-01, migration `20260929160000_normalisation_idcc.sql`**

**Contexte** [§6.4, §7.3] : blocs CCN détectés par motif IDCC "quel que soit le niveau de titre". Un IDCC inconnu ne doit jamais créer automatiquement une convention — le Studio doit proposer Créer / Associer à une convention existante / Ignorer pour le moment.

**À faire** : regex de détection `IDCC\s*n?°?\s*\d+` sur le texte du document, passage systématique par `normalize_idcc()` (déjà en base depuis STU-CCN, réutiliser — jamais une deuxième fonction de normalisation) avant tout rapprochement avec `ccn_catalog`. Écran de résolution à 3 choix (créer/associer/ignorer) quand l'IDCC détecté ne correspond à aucune ligne normalisée existante.

---

## STU-IMPORT-03 — Écran de mapping et contrôle G2S

**Priorité : Must** · **Dépendances : STU-IMPORT-01, STU-IMPORT-02**

**Contexte** [§7.1, §13.1] : "le parsing peut échouer sans modifier le référentiel tant que G2S n'a pas validé le mapping". Avant tout écriture en base, G2S doit voir le résultat du parsing (sections reconnues, tableaux, CCN détectées, rubriques inconnues) et valider explicitement.

**À faire** : écran de prévisualisation du mapping (port fonctionnel de `wordMappingHTML`, jamais son HTML brut) — accepter/corriger le rattachement des sections, confirmer ou écarter les CCN détectées, décider du sort des rubriques inconnues. Aucune écriture dans `sheet_versions` avant validation explicite de cet écran.

---

## STU-IMPORT-04 — Déterminisme, idempotence et mise à jour par numéro de fiche

**Priorité : Must** · **Dépendances : STU-IMPORT-01, STU-IMPORT-03**

**Contexte** [§7.4, §7.5, §18.1] : "le même document importé plusieurs fois doit produire les mêmes clés, la même structure et les mêmes rattachements" — clés de repli déterministes (section + numéro ou intitulé normalisé, suffixe stable en cas de doublon, empreinte déterministe en dernier recours), jamais de clé aléatoire. Le numéro de fiche (ex. `02.03`) est la clé métier de rapprochement : si la fiche existe déjà, proposer "Mettre à jour la fiche 02.03" plutôt que créer un doublon — la fiche repasse en `draft`, la date de création est conservée, la date de mise à jour évolue. Si le numéro existe mais l'intitulé diffère, confirmation explicite obligatoire (pas une mise à jour silencieuse).

**À faire** : fonction de génération de clé déterministe, détection par numéro métier contre `master_sheets`, branchement sur le statut `workflow_status` existant (repasse en `draft`, jamais un nouveau statut inventé). Non-régression à rejouer avec les deux fiches étalons du cahier (§7.6, Annexe A) : `01-01.01_Periode_d_essai_FICHE_ETALON_V3.docx` et `01-02.03_Arret_maladie...V1_24-09-2026.docx` — à demander à l'utilisateur si pas encore transmis.

---

## STU-IMPORT-05 — Import du quiz et de l'annexe interne G2S

**Priorité : Should** · **Dépendances : STU-IMPORT-01, STU-QUIZ**

**Contexte** [§7.3, §8.2] : quiz (questions, options, bonne réponse, explication) et annexe interne G2S à préserver depuis le Word — l'annexe interne (sources de contrôle, notes internes) ne doit jamais sortir du Studio, jamais visible côté Client (règle déjà appliquée ailleurs pour `layer_kind`, cf. STU-DATA/STU-WORKFLOW — pas une nouvelle règle de visibilité à inventer).

**À faire** : extraction des questions/options/réponses/explications vers le format déjà utilisé par STU-QUIZ (`parseQuiz`, réutiliser le format existant plutôt qu'en créer un nouveau), extraction de l'annexe interne vers un champ/couche non exposée côté `client_sheet_content`.
