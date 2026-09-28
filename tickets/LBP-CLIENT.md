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

## LBP-CLIENT-01 — Accueil

**Contexte** [§1.2, p.8-9] : bandeau, rappels de semaine interactifs, calendrier compact, chiffres clés, deux blocs d'actualités, rappel des 3 familles de bibliothèque.

**À faire** : écran d'atterrissage post-login (remplace la redirection directe vers `/bibliotheque` actuelle). Dépend du moteur de calendrier/récurrence (`docs/ARCHITECTURE.md` §7.1, hors phase 1) pour les rappels de semaine — un premier jet peut s'en passer (chiffres clés + rappel des 3 familles seuls, réalistes dès maintenant avec les données déjà en base).

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

## LBP-CLIENT-05 — Chiffres Paie

**Contexte** [§1.6, p.11] : comparatif N-1→N, plafonds toutes périodicités, taux de cotisations.

**À faire** : données de référence chiffrées (plafond Sécu, taux de cotisations par an) — pas encore modélisées en base (`master_families`/`sheet_versions` ne couvrent que le contenu rédactionnel, pas des séries chiffrées). Nécessite une vraie table de référence + une source fiable pour les valeurs (pas à inventer).

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

**Réalisé** : `app/(client)/offres/page.tsx` — les 4 paliers via `getStudioOfferTier()` (`lib/studio/offer-tiers.ts`, écrit lors de STU-DATA-06, jamais consommé par un écran avant ce ticket) pour le vocabulaire/tarif réels du pivot (LBP Essentiel/Métier/Entreprise/Signature), droits réels (CCN/contenu entreprise/détail/quota messages) tirés directement de `offer_tiers` (table de James, jamais modifiée). Palier actuel mis en évidence. `RequestOfferButton.tsx` + `requestOfferChange()` (`app/(client)/offres/actions.ts`) complètent la partie client manquante à STU-OFFER-02 — insère dans `offer_change_requests` (jamais dans `companies.offer_tier`), avec un garde-fou (une seule demande `pending` à la fois par société, vérifié côté serveur, pas juste masqué côté affichage) pour éviter le spam. Le traitement (contacté/clôturé) reste exclusivement côté G2S (`/administration`, déjà construit).

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

## LBP-CLIENT-10 — Mon compte

**Contexte** [§1.11, p.12-13] : infos perso, identifiants, préférences de notification.

**À faire** : édition du profil (`profiles.full_name`/`job_title`/`department`/`phone`, déjà en base), changement de mot de passe (Supabase Auth, `updateUser()` — jamais branché nulle part dans l'app actuelle, ni Studio ni client). Préférences de notification dépendent de LBP-CLIENT-11.

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
