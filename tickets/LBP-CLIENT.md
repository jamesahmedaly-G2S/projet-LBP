# LBP-CLIENT — Portail client (app/(client)/)

Chantier distinct du backlog Studio (tickets/STU-*.md, clos) — la vraie
vue "LBP Client" que le cahier des charges décrit en 13 modules (§1.1-1.14
via `docs/G2S-LBP-01.md`), jamais construite ni côté réel ni côté pivot
avant ce chantier. Architecture définie par `docs/ARCHITECTURE.md` §4 :
`app/(client)/` dans le même projet Next.js que `app/(studio)/`, même base
Supabase, ui-kit/ partagé — jamais deux applis séparées.

---

## LBP-CLIENT-00 — Fondations (layout, thème, authentification, premier écran réel) ✅ Fait

**Contexte** : poser la base technique avant d'attaquer les 13 modules un par un — layout, palette visuelle distincte du Studio (exigée par STU-DESIGN-01), authentification, et un premier écran réel bout en bout pour valider que la base tient, plutôt que 13 squelettes vides.

**Réalisé** :

- **Couche de thème partagée** : `ui-kit/` (Button, Card, Badge, Field, LinkButton) consommait des classes Tailwind `studio-*` en dur — refactorisé vers une couche sémantique (`bg-primary`, `text-ink`, `border-border`...) définie dans `app/globals.css`. Valeurs par défaut = alias exact des `studio-*` existants (zéro risque de régression, vérifié : couleur du bouton primaire Studio testée en réel après refactor, `rgb(46, 91, 135)` = `#2E5B87`, identique au pixel près). `.theme-client` redéfinit ces mêmes variables avec la vraie palette du prototype LBP Client (`lib/design-tokens-client.ts`, port 1:1 de `Nouveau dossier/LBP_V2-20.html` lignes 12-33 — sauge/encre/crème, "aucune couleur ajoutée" comme le dit le prototype lui-même).
- `app/(client)/layout.tsx` — chrome statique (pas de vérification de session ici, voir plus bas pourquoi), applique `.theme-client`.
- `lib/auth/session.ts` — `requireClient()` ajouté, pendant de `requireAdmin()` déjà existant.
- `app/(client)/error.tsx` — pendant de `app/(studio)/error.tsx` (session invalide → redirection `/login`, rôle refusé → "Accès refusé" affiché).
- `app/login/actions.ts` — redirection post-login d'un compte `client` pointait vers `/` (placeholder create-next-app jamais remplacé) ; corrigée vers `/bibliotheque`.
- **Premier écran réel : bibliothèque en lecture seule** (`app/(client)/bibliotheque/page.tsx` + `[sheetId]/page.tsx`) — même arborescence Familles → Thèmes → Sous-thèmes → Fiches et même logique d'affectation que le mode "Accéder au LBP du client" déjà construit côté Studio (`app/(studio)/clients/[id]/vue-client/`, STU-CLIENT-04) : `getCompanyAffectations()` réutilisé tel quel.

**Écart architectural trouvé en testant en réel** (pas en le lisant) : `getVisibleLayersForCompany()` (STU-CLIENT-04) interroge `sheet_versions` directement — table strictement admin-only par RLS (`sheet_versions_admin_all`, STU-DATA-02). Pour l'aperçu admin "en tant que client", ça fonctionne (session admin, RLS contournée par `is_admin()`). Pour une vraie session cliente, ça renvoie silencieusement zéro ligne : la fiche s'ouvrait mais restait vide, aucune erreur. `lib/client/sheet-content.ts` (`getSheetLayersForClient()`) corrige ça en interrogeant `client_sheet_content` (STU-DATA-07) — la vue conçue précisément pour une session cliente réelle (filtre CCN/offre déjà appliqué via `current_company_id()`/`current_offer_tier()`), jamais une nouvelle règle de filtrage inventée.

**Non fait — bloqué, documenté, pas masqué** : le surlignage jaune des modifications (STU-WORKFLOW-05) n'est pas branché côté client réel. `getPublishedContentDiff()` a le même problème RLS que ci-dessus, et la version précédente nécessaire au diff est `historized` — un statut que `client_sheet_content` n'expose qu'à `is_admin()`, jamais à un client réel (sa clause `WHERE` ne retient que `status = 'published'` pour un non-admin). Réparable par une extension ciblée de cette vue (exposer la version historisée immédiatement précédente, scopée à la même règle de visibilité) — pas tentée dans cette passe de fondations pour rester dans un périmètre raisonnable.

**Vérifié** : test réel navigateur bout en bout — login réel `c.moreau@alpha.fr` → redirection `/bibliotheque` → nom réel "ALPHA SAS" affiché → ouverture d'une vraie fiche (`Prime d'ancienneté`) → couche régime général affichée avec ses 5 champs réels **et** la couche complémentaire CCN Syntec (ALPHA a cette CCN) affichée en plus, nom de la CCN résolu correctement. Contrôle négatif : `s.bakkali@beta.fr` (BETA, pas la CCN Syntec) sur la même fiche voit le régime général mais **pas** le complément Syntec — confirme un filtrage réel par société, pas un affichage systématique. Contrôle croisé de rôles : un compte admin sur `/bibliotheque` voit "Accès refusé" (pas de crash) ; un compte client sur `/tableau-de-bord` (Studio) pareil. Couleurs réelles vérifiées via `getComputedStyle` : fond de page `rgb(245, 243, 238)` = `#F5F3EE`, header `rgb(24, 24, 24)` = `#181818` — palette client, pas la navy Studio. Régression Studio : `tsc`/`eslint` propres sur tout le repo, les 10 écrans Studio testés en session réelle après le refactor `ui-kit/` (tous 200, couleur du bouton primaire inchangée au pixel près).

**Reste à faire** : découpé module par module ci-dessous (§1.2-§1.14 du cahier des charges, table exacte de `docs/G2S-LBP-01.md` lignes 180-194).

---

## LBP-CLIENT-01 — Accueil 🟡 Partiellement fait

**Contexte** [§1.2, p.8-9] : bandeau, rappels de semaine interactifs, calendrier compact, chiffres clés, deux blocs d'actualités, rappel des 3 familles de bibliothèque. Vérifié contre le vrai code du prototype (`LBP_V6_Studio.html`, `renderOverview()`, lignes 4249-4293) avant de construire, même discipline que pour Offres.

**Réalisé** : `app/(client)/accueil/` devient l'écran d'atterrissage post-login (`app/login/actions.ts` redirige désormais vers `/accueil`, plus `/bibliotheque`). Salutation réelle (nom + date du jour). **Chiffres clés** : `key_figures` existe déjà dans le schéma réel de James (§9.6), jamais peuplée — les 4 indicateurs réels du prototype (SMIC horaire/mensuel, PMSS, PASS) portés 1:1 avec leur historique complet 2021-2026 (`var HISTO`, lignes 1804-1809, migration `20260928140000`), carte cliquable pour dérouler l'historique (`ChiffreCard.tsx`). **Dernières mises à jour de votre LBP** : vraies publications récentes visibles par ce client (`client_sheet_content`, pas de donnée inventée). **Votre offre** : réutilise `getStudioOfferTier()`/`computeOfferPrice()` déjà construits pour `/offres` (LBP-CLIENT-07) — jamais une deuxième logique de tarification. **La bibliothèque** : les 3 familles réelles avec leur vrai nombre de thèmes (`master_families`/`master_themes`), icônes et exemples portés du prototype (`var FAMILIES`, ligne 1799-1803, contenu décoratif seulement, pas de nouvelle colonne en base).

**Non fait — hors périmètre confirmé** : rappels de semaine interactifs et calendrier compact, qui dépendent d'un vrai moteur de calendrier/récurrence explicitement reporté hors phase 1 (`docs/ARCHITECTURE.md` §7.1). Actualités RH & juridiques : le bloc existe (`articles`, schéma réel de James, jamais peuplée), affiché avec un état vide honnête plutôt qu'un article inventé — attend LBP-CLIENT-04.

**Vérifié** : test réel navigateur — parcours complet de login jusqu'à `/accueil`, salutation réelle, 4 chiffres clés réels avec valeurs exactes (12,31 € etc.), historique réel déroulé au clic (2021 → 10,25 €), offre réelle affichée (LBP Métier, 349 € HT/an), 3 familles réelles avec comptage exact de thèmes (5/10/4, cohérent avec les 153 fiches importées + les thèmes de démo). Un vrai bug trouvé et corrigé en testant : le symbole "€" apparaissait en double lorsque la valeur stockée dans `note` le contenait déjà.

---

## LBP-CLIENT-02 — Mon équipe 🟡 Partiellement fait

**Contexte** [§1.3, p.9 — vérifié verbatim "1.3 Mon équipe" dans le texte du cahier des charges, pas seulement le résumé] : identité société (1.3.1), organigramme (1.3.2, 124 avatars), organisation de la paie (1.3.3), outils RH (1.3.4), documents (1.3.5 — CC, accords, grille de salaire).

**Découverte en préparant ce ticket** : `team_members`, `payroll_org` et `software_stack` existent déjà dans le schéma réel de James (`baseline_schema_reel.sql` §9.1/9.2), avec une RLS `company_id = current_company_id()` déjà scopée pour un client — jamais consommées par aucun écran avant ce ticket. Une première migration additive avait été écrite par erreur avant de vérifier l'existant (`create table team_members` a échoué avec "already exists") — supprimée, le ticket construit exclusivement sur les tables réelles de James, aucune nouvelle table.

**Réalisé** : `app/(client)/mon-equipe/` — Identité (1.3.1) en lecture seule (`companies.company_name`/`legal_form`/`headcount` ; `companies_update_admin` est admin-only par RLS réelle, cohérent avec le principe déjà établi pour l'offre : le client demande, G2S contrôle) + établissements pleinement gérables (ajout/suppression, `establishments_write_own`/`delete_own` déjà réelles). Organisation (1.3.2, `TeamSection.tsx`) : organigramme réel avec ajout/modification/suppression et rattachement hiérarchique (`manager_id`) — sélecteur à 124 avatars du prototype délibérément non reproduit (aucune source réelle de 124 images), remplacé par un cercle avec l'initiale du nom. Organisation de la paie (1.3.3, `PayrollForm.tsx`) et Outils (1.3.4, `ToolsForm.tsx`) : formulaires simples sur `payroll_org`/`software_stack`.

**Non fait — périmètre trop large pour ce ticket seul** : "Vos documents" (1.3.5, CC/accords/grille de salaire) demande un vrai stockage de fichiers (bucket Supabase Storage, upload, catégorisation) — aucune capacité d'upload n'existe nulle part ailleurs dans l'application, Studio compris. Documenté plutôt que construit avec des documents inventés.

**Vérifié** : test réel navigateur avec la session cliente ALPHA — raison sociale et établissement réels affichés ; ajout réel d'un établissement, persistant après rechargement complet ; ajout réel de deux personnes avec rattachement hiérarchique (l'une sous l'autre), les deux persistantes après rechargement complet ; enregistrement réel du mode d'organisation de la paie, confirmé à la fois en base (requête directe) et par la valeur du champ après rechargement. Toutes les données de test supprimées après coup.

---

## LBP-CLIENT-03 — La bibliothèque ✅ Fait (fondations), 🟡 reste la recherche/filtre

**Contexte** [§1.4, p.9-10] : 3 familles → 18 thèmes → 139 sous-fiches, fiche en 3 niveaux de lecture (En bref / Comprendre / Dans le détail) + vigilance + quiz.

**Réalisé** : voir LBP-CLIENT-00 ci-dessus — arborescence complète, fiche filtrée par CCN/offre réels, lecture seule. Les "3 niveaux de lecture + vigilance" du cahier correspondent aux 5 champs déjà portés côté Studio (`SHEET_CONTENT_FIELDS` : essentiel/comprendre/maîtriser/application/vigilance — proche mais pas un mappage 1:1 exact avec "En bref/Comprendre/Dans le détail", à clarifier si ça devient bloquant).

**Reste à faire** : recherche/filtre dans l'arborescence, lien vers le quiz associé à une fiche (dépend de LBP-CLIENT-06), favoris (mentionnés dans le prototype, pas dans cette table du cahier — à vérifier avant de construire).

---

## LBP-CLIENT-04 — Actu · Décrypt RH&Paie

**Contexte** [§1.5, p.11] : grille d'articles/dossiers PDF, pagination 5/page, édition avec workflow brouillon→publication.

**À faire** : module éditorial distinct de la veille réglementaire (STU-VEILLE) et du référentiel (STU-REF) — articles rédigés par G2S, pas des fiches de paie ni des entrées de veille brute. Aucune table en base pour ce contenu actuellement (à créer). Le workflow brouillon→publication peut réutiliser le pattern déjà établi (`workflow_status`, STU-DATA-02) plutôt qu'en inventer un nouveau.

---

## LBP-CLIENT-05 — Chiffres Paie ✅ Fait

**Contexte** [§1.6, p.11] : "Comparatif N-1→N, plafonds toutes périodicités, taux de cotisations". Vérifié contre le vrai code du prototype (`LBP_V6_Studio.html`, `var CHIFFRES` + `renderChiffres()`, lignes 3113-3202) avant de construire — même discipline que pour Offres/Accueil. §1.6 dit explicitement _"Édition G2S : la page est entièrement pilotée par des données modifiables"_, avec des vrais boutons "+ Ajouter un repère"/"+ Ajouter un groupe"/"Modifier les tableaux" dans le prototype — ce ticket ferme donc aussi le manque d'écran d'administration déjà signalé pour `key_figures` (Accueil, LBP-CLIENT-01), en unifiant les deux sur la même table plutôt que dupliquer les mêmes indicateurs (SMIC/PMSS/PASS) ailleurs.

**Réalisé (partie client)** : migration `20260928150000` — `key_figure_groups` (nouveau, les 3 groupes réels : SMIC / Plafond de la Sécurité sociale / Autres repères), `contribution_rates` (nouveau, les 35 lignes réelles du tableau des cotisations — 8 en-têtes de catégorie + 27 taux, portés 1:1), `payroll_reference_settings` (nouveau, titre/intro/titres de tableaux/source, une seule ligne). `key_figures` étendue en additif (`group_id`, `show_as_card`, `show_in_ceiling_table`) plutôt que dupliquée — les 4 indicateurs déjà seedés pour l'Accueil (smic-h/smic-m/pmss/pass) sont réutilisés tels quels pour les cartes comparatives et le tableau plafond, 4 nouveaux repères ajoutés (smic-net, mg, an-repas-hcr, gratification-stage) et 5 nouvelles clés de périodicité (trimestriel/quinzaine/hebdomadaire/journalier/horaire). `app/(client)/chiffres-paie/` : 3 groupes de cartes comparatives, tableau plafond 7 périodicités, tableau des 35 taux de cotisations. Libellés centralisés dans `lib/client/key-figure-labels.ts` (réutilisé par l'Accueil, qui utilisait auparavant sa propre copie locale — un seul endroit maintenant).

**Simplification assumée** : le prototype stocke une "variation" (ex. "▲ +3,6 %") comme un champ texte librement édité par G2S, avec un risque réel d'incohérence avec les valeurs affichées si elles divergent. Ici, la variation est **calculée à l'affichage** à partir des deux dernières années présentes pour une clé donnée — jamais stockée, jamais désynchronisable.

**Réalisé (partie admin G2S, 28/09/2026)** : `app/(studio)/administration/chiffres-paie/` — bloc "Données de référence" ajouté à `/administration` (nouvelle porte d'entrée pour ce type d'écran, plutôt qu'un 11e onglet Studio distinct de plus que les 10 fixes du §3 du dossier). Réglages de page (titre/intro/titres de tableaux/source), groupes (ajout/suppression), repères (`key_figures` — ajout/modification/suppression, une ligne par clé+année, cases à cocher pour l'affichage carte/tableau périodicités), taux de cotisations (ajout/modification/suppression, en-têtes de catégorie inclus).

**Correctif au passage** : `key_figures.label` ajouté (migration `20260928160000`) — sans cette colonne, un repère créé depuis l'écran d'admin n'aurait eu qu'un libellé de repli (sa clé technique brute) tant qu'un développeur n'ajoute pas l'entrée dans `lib/client/key-figure-labels.ts`, contraire à l'exigence explicite de l'utilisateur ("tout doit se faire depuis l'espace G2S, Pauline ne touche jamais au code"). `keyFigureLabel()` priorise maintenant ce libellé en base sur la table de code.

**Vérifié** : test réel avec la session admin réelle (Pauline) — ajout réel d'un repère de test avec son propre libellé, confirmé en base, puis confirmé **visible côté client** (`/chiffres-paie`) avec ce même libellé personnalisé, sans aucun changement de code. Modification réelle du titre de la page, persistante après rechargement. Toutes les données de test supprimées après coup, réglages restaurés à leur valeur d'origine.

**Vérifié** : test réel navigateur avec la session cliente ALPHA — titre/intro réels affichés, 3 groupes réels avec leurs vraies cartes comparatives (SMIC horaire 11,88 € → 12,31 €, variation calculée +3,6 % correcte), tableau plafond réel avec les 7 périodicités (jusqu'à l'horaire, 29 € → 30 €), tableau des cotisations réel avec ses 35 lignes (ex. AGIRC-ARRCO tranche 1 : 3,15 % / 4,72 %), source réelle affichée. Lien réel ajouté depuis l'Accueil ("Tous les chiffres Paie →").

---

## LBP-CLIENT-06 — Quizz (côté client) ✅ Fait

**Contexte** [§1.7, p.11-12] : quiz issus de fiches + quiz autonomes, import Word/texte au format normé.

**Réalisé** : `app/(client)/mes-quiz/page.tsx` (liste des quiz publiés — `quizzes_read_published`, policy RLS réelle déjà en base, ne filtre rien côté requête) et `[id]/page.tsx` + `QuizPlayer.tsx` (une question à la fois, réponse validée avant de passer à la suivante, explication `expl` de STU-QUIZ-02 enfin consommée quelque part — jamais affichée nulle part avant ce ticket). Score envoyé à `quiz_scores` via `submitQuizScore()` (`app/(client)/mes-quiz/actions.ts`) — table et policy `quiz_scores_own` déjà réelles dans le schéma de James (`baseline_schema_reel.sql`), jamais touchées avant, juste consommées.

**Collision de route trouvée en testant en réel** : `app/(client)/quiz/` entrait en conflit avec `app/(studio)/quiz/` déjà existant — les route groups Next.js (`(client)`/`(studio)`) ne participent pas à l'URL, les deux résolvaient vers `/quiz` (erreur Next explicite : "You cannot have two parallel pages that resolve to the same path"). Renommé en `app/(client)/mes-quiz/` — seule collision trouvée en comparant les 13 modules aux routes Studio déjà prises (`/tableau-de-bord`, `/clients`, `/referentiel`, `/questionnaires`, `/affectations`, `/publications`, `/veille`, `/entretiens`, `/quiz`, `/administration`).

**Vérifié** : test réel navigateur bout en bout avec un vrai quiz (2 questions réelles, insérées puis supprimées après coup) et une vraie session cliente (`c.moreau@alpha.fr`) — navigation depuis la bibliothèque, quiz rattaché au bon thème affiché, sélection d'une réponse, validation, explication affichée, question suivante, score final 2/2 (100 %) affiché ; ligne réelle confirmée dans `quiz_scores` (`profile_id` de Camille Moreau, `quiz_id` réel, `score: 100`) ; badge de score réapparaît sur la liste après un rechargement complet de la page (pas juste en mémoire côté client).

**Correctif (28/09/2026, chronomètre)** : l'utilisateur a rapporté une consigne de Pauline ("une question par page avec chronomètre 20 secondes par question"). Avant d'implémenter, vérification des sources réelles (CR de réunion + prototype) plutôt que d'implémenter le chiffre tel quel : les CR (`Nouveau dossier/compte_rendu_de_réunion/`, 10-09 et 17-09) confirment bien l'exigence d'un chronomètre par question, mais sans préciser de durée ; le vrai lecteur de référence (`LBP_V6_Studio.html`, lignes 5517-5617) donne la valeur exacte — `QUIZ_TIME_PER_QUESTION=25`, **25 secondes, pas 20**. Le même lecteur de référence révèle aussi que le premier jet construit avait le mauvais modèle d'interaction : le commentaire du prototype lui-même dit "AUCUN retour sur la justesse de la réponse pendant le quiz ; résultat complet + explication de chaque question à la fin". `QuizPlayer.tsx` entièrement reconstruit pour suivre ce modèle : écran d'intro ("Commencer le quiz", nombre de questions, durée), aucun retour bon/mauvais pendant le quiz, chronomètre décompté en secondes avec état visuel "urgent" sous 5s, temps écoulé = réponse comptée fausse avec passage automatique à la question suivante, écran de résultat final avec détail question par question (votre réponse / bonne réponse si erreur / explication) et recommandation ("à approfondir" sous 70 %, "bien maîtrisé" au-dessus).

**Vérifié (28/09/2026)** : test réel navigateur avec un chronomètre réel non accéléré — décompte confirmé exact (25 s puis 21 s après 4 secondes réelles), aucune explication ni indication bon/mauvais visible pendant les questions, expiration réelle du temps sur la question 2 (attente de 26 secondes réelles) → comptée automatiquement fausse ("temps écoulé"), passage automatique à l'écran de résultat, score 1/2 correct, bonne réponse de la question ratée révélée uniquement à l'écran final.

---

## LBP-CLIENT-07 — Offres ✅ Fait

**Contexte** [§1.8, p.12] : présentation et détail des 4 offres commerciales.

**Réalisé (1re passe, 28/09/2026)** : `app/(client)/offres/page.tsx` — les 4 paliers via `getStudioOfferTier()` (`lib/studio/offer-tiers.ts`, écrit lors de STU-DATA-06, jamais consommé par un écran avant ce ticket) pour le vocabulaire/tarif réels du pivot (LBP Essentiel/Métier/Entreprise/Signature), droits réels (CCN/contenu entreprise/détail/quota messages) tirés directement de `offer_tiers` (table de James, jamais modifiée). Palier actuel mis en évidence. `RequestOfferButton.tsx` + `requestOfferChange()` (`app/(client)/offres/actions.ts`) complètent la partie client manquante à STU-OFFER-02 — insère dans `offer_change_requests` (jamais dans `companies.offer_tier`), avec un garde-fou (une seule demande `pending` à la fois par société, vérifié côté serveur, pas juste masqué côté affichage) pour éviter le spam. Le traitement (contacté/clôturé) reste exclusivement côté G2S (`/administration`, déjà construit).

**Correctif (28/09/2026, reconstruit pour suivre le vrai style client)** : l'utilisateur a signalé que le style ne correspondait pas à celui attendu et a pointé vers le mode client de `LBP_V6_Studio.html`. Vérification en réel : ce fichier contient, sous l'overlay Studio (`closeStudio()` masque juste `#studioApp`), l'application client complète — jamais explorée jusqu'ici, seules les fonctions `st*` (admin) avaient été auditées. `renderOffres()` (lignes 5152-5209) et `openOfferPage()` (lignes 5211-5249) montrent un vrai simulateur de tarification : bascule facturation annuelle/mensuelle (+20 % pour le mensuel), simulateur de nombre d'utilisateurs avec calcul du coût des utilisateurs supplémentaires, cartes avec niveau de personnalisation cumulatif (`LVLABEL`, 4 niveaux), tableau comparatif de 17 lignes, aide au choix ("Quelle offre est faite pour vous ?"), page de détail complète par offre. Tout le contenu marketing réel (`sub`/`promesse`/`desc`/`pourqui`/`inc`/`why`/`foot`/`badge`/`formula`/`blocs`) porté 1:1 depuis `var OFFERS=[...]` (lignes 4942-4986) dans `lib/studio/offer-tiers.ts`, avec `computeOfferPrice()` portant exactement la logique de `offPrice()` (lignes 5132-5149). Nouveau : `OffersClient.tsx` (bascule + simulateur + cartes + tableau + aide, tout en état local React), `app/(client)/offres/[tier]/page.tsx` (détail par offre, pendant de `openOfferPage()`).

**Correctif (28/09/2026, navigation)** : l'utilisateur a aussi signalé que "La bibliothèque" devait être un onglet de la barre de navigation à part entière, comme Quiz — jusqu'ici fusionné avec le lien de marque ("LE LIVRE BLANC DE LA PAIE"). Corrigé dans `app/(client)/layout.tsx` : la marque redevient un texte statique, "La bibliothèque" rejoint la nav aux côtés de "Mon équipe"/"Quizz"/"Offres", dans l'ordre réel du menu du prototype (`LBP_V6_Studio.html` lignes 1467-1479 : Accueil, Mon équipe, Calendrier RH, **La bibliothèque**, Actu, Chiffres Paie, Dictionnaire, Quizz, Offres, Veille, Prise en main).

**Note (trouvée en vérifiant la nav)** : le menu réel de `LBP_V6_Studio.html` liste aussi un onglet "Dictionnaire" absent des 13 modules du cahier des charges (§1.1-1.14, table de `docs/G2S-LBP-01.md`) — potentiel 14e module non répertorié, signalé mais non ajouté au découpage sans confirmation.

**Vérifié** : test réel navigateur avec la session cliente ALPHA — nav contient bien Mon équipe/La bibliothèque/Quizz/Offres ; 4 offres réelles avec prix annuels exacts (199/349/600/990) ; bascule mensuelle change réellement l'unité affichée ; simulateur d'utilisateurs réellement interactif (champ modifié à 15, valeur confirmée) ; navigation réelle vers une page de détail (`/offres/1`) affichant "Pour qui"/"Ce que vous obtenez" ; demande réelle envoyée depuis une carte, ligne confirmée en base puis supprimée, donnée de démonstration restaurée à `pending`.

**Vérifié** : test réel navigateur avec la vraie session cliente ALPHA — palier actuel "LBP Métier" affiché, 4 offres réelles avec leurs vrais droits, demande de changement de palier réellement créée en base (`offer_change_requests`, `status: pending`), garde-fou vérifié réel : après création, le bouton "Demander cette offre" disparaît et la page affiche "en attente de traitement" après un rechargement complet (pas juste un état local React). Nettoyage après test : la ligne créée par le test supprimée, la demande de démonstration d'origine (ALPHA, palier 2→3, seedée pour STU-OFFER-02) restaurée à `pending` telle quelle.

---

## LBP-CLIENT-08 — Veille réglementaire (mode G2S) — hors périmètre LBP Client

**Contexte** [§1.9, p.12] : 7 sources officielles suivies, rapprochement/création de fiche, notification quotidienne 10h30.

**Statut** : explicitement "mode G2S" dans le cahier lui-même (pas un module client) — déjà entièrement couvert côté Studio par STU-VEILLE-01 à 04 (`/veille`, connecteurs réels, notification Brevo). Rien à construire ici ; gardé dans cette liste uniquement pour que les 13 modules du §1 soient tous tracés quelque part.

---

## LBP-CLIENT-09 — Prise en main

**Contexte** [§1.10, p.12] : aide contextuelle et bloc vidéo.

**À faire** : contenu d'aide statique + emplacement vidéo. Le plus simple des 13 modules à construire (pas de donnée métier, pas de RLS) — bon candidat pour un remplissage rapide une fois les modules à donnée réelle avancés.

---

## LBP-CLIENT-10 — Mon compte 🟡 Partiellement fait

**Contexte** [§1.11, p.12-13] : infos perso, identifiants, préférences de notification. Vérifié contre le vrai code du prototype (`LBP_V2-20.html`, `renderAccount()`, lignes 3025-3048) : "Mes informations" (poste/service/téléphone/e-mail pro), "Identifiants & sécurité" (e-mail de connexion en lecture seule + changement de mot de passe), "Mes notifications" (`NOTIF_TYPES`, 7 types réels, un canal par type : non/LBP/e-mail/LBP+e-mail).

**Réalisé** : `app/(client)/mon-compte/` — "Mes informations" (`ProfileForm.tsx`, `profiles.job_title`/`department`/`phone`, déjà en base, jamais éditées par le client lui-même avant ce ticket) ; "Identifiants & sécurité" (`PasswordForm.tsx`, e-mail de connexion en lecture seule via `supabase.auth.getUser()`, changement de mot de passe via l'API Supabase Auth réelle `updateUser()` — jamais branché nulle part dans l'app, ni Studio ni client, avant ce ticket). Simplification par rapport au prototype : pas de champ "e-mail professionnel" séparé (le prototype en a un, distinct de l'e-mail de connexion, mais `profiles` n'a qu'une seule adresse e-mail réelle — ajouter une colonne redondante pour un champ qui duplique l'identifiant de connexion n'était pas justifié).

**Non fait — bloqué, pas oublié** : "Mes notifications" (préférences de canal par type) dépend de LBP-CLIENT-11 — `notifications` (le flux/l'historique lui-même) existe déjà dans le schéma réel de James, mais aucun mécanisme de stockage des préférences de canal par utilisateur n'existe. À construire avec LBP-CLIENT-11 plutôt que séparément, pour éviter deux décisions de schéma non coordonnées sur le même sujet.

**Vérifié** : test réel navigateur avec la session cliente ALPHA — nom et e-mail réels affichés, modification du poste persistante après rechargement complet. Changement de mot de passe testé de bout en bout pour de vrai : nouveau mot de passe utilisé pour une vraie connexion réussie (`POST /auth/v1/token`), puis mot de passe de démo restauré et connexion à nouveau confirmée — aucune donnée de démo laissée dans un état modifié après le test.

---

## LBP-CLIENT-11 — Notifications

**Contexte** [§1.12, p.13] : cloche, deux audiences (client/G2S) — module partagé, pas strictement côté client.

**À faire** : aucune table de notifications en base actuellement (`legal_monitoring`/`company_interviews` etc. servent de source de vérité, mais rien ne matérialise une notification lue/non-lue par utilisateur). À concevoir avant de coder quoi que ce soit — c'est le seul des 13 modules qui touche aussi le Studio (audience G2S).

---

## LBP-CLIENT-12 — Recherche globale

**Contexte** [§1.13, p.13] : recherche transversale LBP + liens sources officielles.

**À faire** : recherche multi-tables (fiches, articles LBP-CLIENT-04, quiz...) — dépend d'avoir construit plusieurs des modules ci-dessus d'abord pour avoir quelque chose de transversal à chercher. À faire en dernier logiquement, même si listé avant Assistance dans le cahier.

---

## LBP-CLIENT-13 — Assistance

**Contexte** [§1.14, p.13] : widget de chat.

**À faire** : dépend très probablement d'un service tiers (chat en direct ou IA) — à clarifier avant de commencer, même prudence que pour les clés API externes déjà rencontrées (PISTE, Brevo, Anthropic) : jamais simulé, prêt à s'activer seulement si un vrai service est choisi et ses identifiants fournis.

---

## LBP-CLIENT-14 — Dictionnaire ✅ Fait

**Contexte** : module réel repéré en vérifiant le vrai style de la page Offres (mode client de `LBP_V6_Studio.html`) — un onglet "Dictionnaire" entre "Chiffres Paie" et "Quizz" dans le vrai menu (lignes 1467-1479), avec un lecteur complet (`DICO`/`renderDico()`, lignes 4602-4690) : 29 vrais termes de paie/droit social définis et sourcés (BOSS/URSSAF/Code du travail/Ameli/impots.gouv.fr/net-entreprises/Ministère du travail), recherche, regroupement et navigation alphabétiques, statut brouillon/publié géré côté G2S. **Absent des 13 modules du cahier des charges écrit** — vérifié explicitement : ni dans §1 (le tableau module par module), ni dans l'Annexe B "Glossaire" (qui ne définit que le vocabulaire du document lui-même — LBP, RLS, DSN... — pas un dictionnaire paie pour l'utilisateur), ni ailleurs dans le texte. Ajouté comme 14e module après vérification et confirmation explicite de l'utilisateur.

**Réalisé** : `dictionary_terms` — schéma de base repris de `Nouveau dossier/Modelisation-BDD-LBP.md` (lignes 541-548, jamais créée en base jusqu'ici, comme `offer_change_requests` l'était avant STU-OFFER-02), `source`/`published` ajoutés en additif (le schéma modélisé n'a pas de distinction brouillon/publié, indispensable pour ne jamais exposer un brouillon côté client — sans cette colonne la RLS `using (true)` du schéma modélisé les exposerait tous). Les 29 termes réels du prototype insérés tels quels dans la migration (donnée de référence, même logique que `ccn_catalog`/STU-REF-04 — pas dans `seed.sql`). `app/(client)/dictionnaire/` : recherche, navigation alphabétique par lettre, regroupement — pendant client de `renderDico()`, sans les outils d'édition (`g2s-only` dans le prototype).

**Réalisé (partie admin G2S, 28/09/2026)** : `app/(studio)/administration/dictionnaire/` — ajout/modification/suppression d'un terme, case "Publié" (sinon brouillon, visible uniquement dans cet écran). Politique déjà posée (`dictionary_terms_write_admin`/`update_admin`/`delete_admin`, migration `20260928130000`), jamais consommée avant. Lien ajouté au bloc "Données de référence" de `/administration`, plutôt qu'un 11e onglet Studio séparé.

**Vérifié** : test réel navigateur — côté client (session ALPHA), terme réel affiché avec sa vraie définition et sa vraie source ("Bulletin de paie" → "Code du travail"), navigation alphabétique réelle (lettre B cliquable), recherche réelle ("SMIC" trouve le bon terme et exclut les termes sans rapport). Côté admin (session Pauline) : ajout réel d'un terme en brouillon, confirmé **invisible** côté client tant que non publié, puis publié depuis l'admin et confirmé **visible** côté client après republication — sans aucun changement de code. Suppression réelle confirmée, aucune donnée de test résiduelle en base après coup.
