# STU-DATA — Fondations base de données

Migrations Supabase locales, appliquées uniquement sur l'instance locale de cette branche (`npm run supabase:start`). Référence : `Nouveau dossier/Modelisation-BDD-LBP.md`. Aucune de ces migrations ne touche au projet Supabase de James (staging/production).

---

## STU-DATA-01 — Migration référentiel maître ✅ Fait

**Priorité : Must** · **Dépendances : aucune**
**Réalisé** : `supabase/migrations/20260925085051_referentiel_maitre_studio.sql`, vérifié via `db:reset` + requêtes PostgREST locales.

**Contexte** : le référentiel maître (§8 du dossier) structure tout le contenu Studio : `FAMILLE → THÈME → SOUS-THÈME → FICHE MAÎTRE`, avec un identifiant stable indépendant du titre.

**À faire** : créer `ccn_catalog`, `master_families` (+ seed des 3 familles fixes : Vie du salarié / Rémunération / Cotisations), `master_themes`, `master_subthemes`, `master_sheets`.

**Critères d'acceptation**

- Les 3 familles fixes existent après `db:reset`, non modifiables en dur ailleurs dans le code.
- Une fiche a un `code` unique, distinct de son `id` technique, et un changement de `title` ne modifie jamais ce `code`.
- `npm run db:reset` rejoue la migration sans erreur.

---

## STU-DATA-02 — Migration versioning & workflow ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-01**
**Réalisé** : `supabase/migrations/20260925091323_versioning_workflow_studio.sql`, contraintes vérifiées par tests manuels (rejet couche/scope invalide, unicité version publiée).

**Contexte** : chaque fiche a 4 couches (`rg`/`ccn`/`ent`/`proc`) versionnées indépendamment, avec un cycle de vie à 7 statuts (§9).

**À faire** : créer `sheet_versions` (contrainte `layer_kind`/`ccn_idcc`/`company_id`), les index uniques garantissant une seule version publiée par couche à la fois, et `sheet_version_recipients`.

**Critères d'acceptation**

- Impossible d'insérer une version `ccn` sans `ccn_idcc`, ni une version `ent`/`proc` sans `company_id` (contrainte SQL, pas seulement applicative).
- Impossible d'avoir deux versions `published` simultanément pour la même fiche + couche + clé (test : insérer un doublon doit lever une erreur).
- `sheet_version_recipients` permet de retrouver, pour une version donnée, la liste des sociétés qui l'ont reçue.

---

## STU-DATA-03 — Migration questionnaire maître ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-01**
**Réalisé** : `supabase/migrations/20260925093726_questionnaire_maitre_studio.sql`, vérifié par tests manuels (question conditionnelle, impact déclenchant une fiche, FK de condition invalide rejetée).

**Contexte** : le questionnaire (§7) déclenche l'affectation de fiches selon les réponses, avec des questions conditionnelles.

**À faire** : créer `master_questions` (avec `condition_question_code`/`condition_value`) et `master_question_impacts`.

**Critères d'acceptation**

- Une question peut référencer une autre question comme condition d'affichage.
- Une réponse (`question_code`, `answer_value`) peut déclencher l'affectation d'une ou plusieurs fiches via `master_question_impacts`.

---

## STU-DATA-04 — Migration entretiens & réponses entreprise ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-01, STU-DATA-03**
**Réalisé** : `supabase/migrations/20260925100539_entretiens_et_reponses_entreprise.sql`, vérifié par tests manuels (historique avant/après entretien, vue `company_current_answers`).

**Contexte** : nécessaire pour le scénario D (entretien annuel) — historiser les réponses au questionnaire dans le temps, par entretien.

**À faire** : créer `company_interviews` et `company_questionnaire_answers`, plus la vue `company_current_answers` (dernière réponse par question).

**Critères d'acceptation**

- On peut retrouver les réponses données lors d'un entretien précis (`interview_id`) et les comparer aux réponses actuelles.
- La vue `company_current_answers` renvoie une seule ligne par (société, question), la plus récente.

---

## STU-DATA-05 — Migration moteur d'affectation ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-01, STU-DATA-02, STU-DATA-03**
**Réalisé** : `supabase/migrations/20260925102419_moteur_affectation_studio.sql`. Inclut aussi `company_ccns` (avancé depuis STU-CCN-02, prérequis technique de la vue — voir note dans STU-CCN.md). Vérifié par tests manuels avec simulation de session admin (réponse questionnaire → origine immédiate, retrait manuel → traçabilité conservée).
**Écart au plan initial** : la vue réutilise `offer_tiers.includes_cba` (colonne existante de James) comme équivalent de "la couche CCN est incluse dans le palier", au lieu d'une colonne `includes_ccn` qui aurait nécessité de toucher sa table. Voir STU-DATA-06 ci-dessous, revu pour la même raison.

**Contexte** : les 5 origines d'affectation (§7.3) doivent être reconstituables sans dupliquer le référentiel par client.

**À faire** : créer `company_sheet_overrides` (ajout/retrait manuel G2S avec motif) et la vue `company_sheet_affectations` qui recalcule à la volée les origines `base`/`questionnaire`/`ccn`/`manual`.

**Critères d'acceptation**

- La vue reflète immédiatement un changement de réponse au questionnaire ou de CCN, sans étape de recalcul manuel séparée.
- Un retrait manuel (`action='remove'`) masque bien la fiche sans supprimer la règle automatique sous-jacente (traçabilité conservée).

---

## STU-DATA-06 — Offres : revu, ne touche plus `offer_tiers` ✅ Fait

**Priorité : Must** · **Dépendances : aucune**
**Réalisé** : `lib/studio/offer-tiers.ts` — aucune migration SQL, mapping centralisé, vérifié fonctionnellement (`tsx`) : noms/prix Studio par palier + dérivation des couches depuis `includes_cba`/`includes_agreements`.

**Contexte révisé** : le plan initial ("recréer `offer_tiers`") violerait la consigne de ne jamais modifier ce que James a mis en place — cette table existe déjà, seedée avec 4 lignes, référencée par `companies.offer_tier` et par `check_and_increment_chat_quota()`. On ne la touche pas, ni en destructif ni en additif.

**À faire** : rien côté base de données — `offer_tiers.includes_cba` et `includes_agreements` font déjà le travail (réutilisés dans STU-DATA-05 et STU-DATA-07). Reste uniquement un travail d'**affichage** : faire correspondre les 4 lignes existantes (`Le Socle`/`La Branche`/`Le Référentiel`/`Le Sur-mesure`, prix HT/mois) au vocabulaire Studio (`LBP Essentiel`/`LBP Métier`/`LBP Entreprise`/`LBP Signature`, prix annuel) **au niveau du front uniquement** (table de correspondance dans le code, pas en base) — ticket déplacé vers STU-OFFER.

**Critères d'acceptation**

- Aucune migration SQL sur `offer_tiers` dans ce ticket.
- Le mapping d'affichage est centralisé à un seul endroit (DRY), pas dupliqué dans plusieurs composants.

---

## STU-DATA-07 — Vue sécurisée client_sheet_content ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-02, STU-DATA-05, STU-DATA-06**
**Réalisé** : `supabase/migrations/20260925104238_vue_client_sheet_content.sql`. Vérifié par tests avec sessions simulées (admin vs client) : accès direct à `sheet_versions` bloqué pour un client (0 ligne), `client_sheet_content` ne montre que rg + ccn publiés autorisés par le palier, admin voit tout y compris brouillons.
**Note** : filtre les couches `ent`/`proc` via `offer_tiers.includes_agreements` (existant), même logique que STU-DATA-05 pour `ccn`/`includes_cba` — pas de nouvelle colonne sur `offer_tiers`.

**Contexte** : le client ne doit jamais voir de contenu non publié, ni une couche que son offre n'inclut (principe déjà appliqué à l'ancien modèle, à reconduire ici — condition de réussite non négociable du cahier de gouvernance).

**À faire** : créer la vue `client_sheet_content` (filtre par statut publié + CCN de la société + flags de l'offre), avec RLS empêchant tout accès direct à `sheet_versions` pour un rôle `client`.

**Critères d'acceptation**

- Un utilisateur `client` interrogeant `sheet_versions` directement obtient 0 ligne.
- Un utilisateur `client` interrogeant `client_sheet_content` ne voit que les couches publiées auxquelles son CCN et son offre lui donnent droit.
- Un utilisateur `admin` voit tout, y compris les versions non publiées.

---

## STU-DATA-08 — Seed de démonstration

**Priorité : Should** · **Dépendances : STU-DATA-01 à 07** ✅ Fait

**Réalisé** : `supabase/seed.sql` — ALPHA SAS/BETA GROUPE/GAMMA (reprises de `LBP_V6_Studio.html`), avec CCN, réponses au questionnaire et overrides différents. Vérifié via `company_sheet_affectations` : les 3 sociétés ont des origines et des fiches visibles réellement différentes (ex. `REM-DEMO-004` visible par CCN pour ALPHA et GAMMA mais pas BETA, qui n'a pas cette convention).
**Correctif (trouvé en vérifiant STU-REF-01)** : les comptes `auth.users` du seed n'étaient pas de vrais comptes GoTrue — un `INSERT` SQL minimal (id/email/raw_user_meta_data) ne suffit pas : il manquait la ligne `auth.identities` correspondante et des colonnes token (`confirmation_token` etc.) que GoTrue exige non-NULL en Go même si la colonne SQL est nullable. Un vrai login échouait avec `500 Database error querying schema`. Corrigé pour répliquer exactement la forme d'un utilisateur créé via l'API Admin (constatée en créant puis inspectant un utilisateur de test), avec mot de passe de démo `Demo1234!` pour les 4 comptes. Login réel vérifié (`POST /auth/v1/token?grant_type=password` → 200).

**Contexte** : le dossier exige "des données de démonstration suffisamment réalistes pour comprendre le fonctionnement" (§1).

**À faire** : script de seed (`supabase/seed.sql` ou script Node) avec le catalogue CCN complet, quelques thèmes/fiches par famille, 2-3 sociétés types avec CCN/réponses/overrides différents — repris des données déjà présentes dans `LBP_V6_Studio.html` (CCN_CAT, CLIENTS, QUESTIONS).

**Critères d'acceptation**

- `npm run db:reset` fait apparaître au moins 3 sociétés de démonstration avec des affectations différentes, visibles dans Supabase Studio local.
