# TASK.md — Backlog LBP

> Backlog de passage **maquette V9.9 → production**, assorti des corrections relevées dans la maquette.
> Légende : **P0** bloquant · **P1** important · **P2** confort.
> Format : `- [ ] [P?] Tâche — critère d'acceptation (réf. maquette)`.
> Les agents cochent les cases et ajoutent une ligne dans `CHANGELOG.md` à chaque tâche terminée.
>
> **Mise à jour 2026-10-05** : un pivot de construction (« LBP Studio », 186 commits, backlog détaillé dans `tickets/`) a livré une implémentation réelle (pas une maquette) d'une grande partie des phases 2 à 6. Les cases ci-dessous reflètent cet état. Détail ticket par ticket, écarts assumés et dette précise : `tickets/README.md` et les fichiers `STU-*.md`/`LBP-CLIENT.md`.

---

## En cours

_Aucune tâche en cours. Déplacer ici la tâche active avec la mention `(@agent ou @nom, date)`._

---

## Phase 0 — Cadrage (préalable à tout code de production)

- [x] [P0] **Choisir la stack cible** (front, API, base, hébergement) — Next.js (App Router) + Supabase + Vercel, décision consignée dans `docs/ARCHITECTURE.md` et `ARCHITECTURE.md` § 8.
- [x] [P0] Récupérer le **cahier technique** cité dans la maquette et le confronter à `ARCHITECTURE.md` — fait dans `docs/G2S-LBP-01.md` (cahier technique de gouvernance).
- [x] [P0] Choisir le **SSO / l'authentification** — Supabase Auth, `AUTH-01` (middleware/proxy + `requireRole`), login minimal Studio/Client (`app/login/`). L'onboarding par invitation e-mail (`AUTH-02`) reste à vérifier séparément.
- [ ] [P0] Choisir les **fournisseurs d'e-mail et de SMS** pour les notifications de veille et de publication — Brevo pressenti, **aucune clé configurée à ce jour** (voir `tickets/STU-VEILLE.md`).
- [ ] [P1] Obtenir le **logo officiel G2S** en vectoriel.
- [~] [P1] Valider avec G2S les **règles métier ambiguës** listées en Phase 6 — en partie tranchées en construisant (voir Phase 6), reste à faire valider formellement par Pauline/direction technique.

---

## Phase 1 — Fondations techniques

- [x] [P0] ~~Initialiser le monorepo (`apps/client`, `apps/studio`, `packages/ui`, `packages/domain`, `services/api`, `services/jobs`)~~ — **non retenu**, un seul projet Next.js avec `app/(client)/`+`app/(studio)/` a été construit à la place (KISS). Lint/format/CI en place (`eslint`, `prettier`, GitHub Actions). Voir `ARCHITECTURE.md` § 8.
- [~] [P0] **Extraire le design system** — fait sous forme de `ui-kit/` (Badge/Button/Card/Field/LinkButton/Modal) + `lib/design-tokens.ts`/`lib/design-tokens-client.ts`, **pas** un paquet `packages/ui` séparé. Comparaison visuelle systématique non automatisée (pas de test de régression visuelle).
- [x] [P0] **Extraire les médias base64** — 124 avatars réels extraits vers `public/avatars/*.jpg`, fonds de page vers `public/page-bg/`. Poids/formats (WebP/AVIF) non audités formellement.
- [x] [P1] Porter le jeu d'icônes `ICONS` vers `lucide` — fait (`lucide-react`), plus aucun emoji dans l'UI.
- [ ] [P1] Fusionner les couches CSS successives de la maquette en une seule feuille — non vérifié sur le nouveau code (CSS désormais géré par Tailwind/tokens, pas un report direct des couches de la maquette).

## Phase 2 — Domaine (logique métier)

- [x] [P0] Porter `computeAffectation()` — vue `company_sheet_affectations`, **6 origines** (référentiel, questionnaire, CCN, offre, manuel, maj — `offre` ajoutée après coup, absente du calcul initial). **Aucun test automatisé** (pas de suite de tests dans ce dépôt).
- [x] [P0] Porter `ccnResolve()` — vue `client_sheet_content`, résolution RG → surcharge CCN/entreprise/process par couche (`layer_kind`).
- [x] [P0] Normalisation et rapprochement des **IDCC** — fonction immuable `normalize_idcc()` + `ccn_catalog`, index unique sur la forme normalisée.
- [x] [P0] Machine à états du **workflow de publication** — `workflow_status` à **7 valeurs** (`draft→review→valid→scheduled→published→historized→archived`), transitions dans `lib/studio/workflow-transitions.ts`.
- [x] [P1] Porter `norm()` et la recherche globale — `lib/search/normalize.ts`, `lib/client/smart-search.ts`, route `/recherche`.
- [x] [P1] Porter le moteur de tâches et le journal — `lib/studio/activity.ts` (journal) ; équivalent de `taskAdd`/`taskResolve` couvert par `accueil/tasks-actions.ts` + verrou `pg_advisory_xact_lock` dans `seed_weekly_tasks()` (corrige une race condition réelle constatée sous Server Components).
- [ ] [P1] Porter le calcul du **calendrier RH** (moteur de récurrence) — `calendar_rules` existe en base mais **n'est pas alimentée/consommée** ; le calendrier RH livré (`LBP-CLIENT-15`) utilise des événements réels seedés (jours fériés 2026, échéances DSN), pas le moteur de récurrence générique. Toujours hors phase 1 au sens strict.

## Phase 3 — API et données

- [x] [P0] Schéma de base pour le référentiel à 4 niveaux et les versions — `master_families`→`master_themes`→`master_subthemes`→`master_sheets`→`sheet_versions`, voir `db/ARCHITECTURE.md` § 5.
- [x] [P0] **Isolation multi-client** — RLS sur toutes les tables à `company_id`. Pas de suite de tests d'autorisation négatifs automatisée.
- [x] [P0] Versions publiées **immuables** — index uniques partiels par couche ; entretiens clients prennent un snapshot figé (`company_interviews.before_sheet_ids`), pas un recalcul.
- [x] [P0] Supprimer toute persistance `localStorage` des données métier — fait, tout est en base Supabase.
- [x] [P1] Unifier `ARTICLES` — sans objet, le modèle `ARTICLES`/magasins distincts Client/Studio de la maquette n'existe plus (remplacé par `families`/`themes`/`sheets` et le nouveau référentiel maître).
- [ ] [P1] Unifier les statuts `actif` / `active` — non vérifié sur le nouveau schéma (`profiles.status` utilise `account_status` : `invited`/`active`/`disabled`, à confirmer qu'aucune autre table ne porte une variante).
- [x] [P1] Script de **migration des données de démo** — `supabase/seed.sql` (sociétés `ALPHA`/`BETA`/`GAMMA`, fiches `*-DEMO`, comptes réels).

## Phase 4 — LBP Studio

- [x] [P0] Authentification G2S et gestion des utilisateurs (onglet Administration) — login minimal + `ADMIN-01` (comptes, paramètres, journal). RBAC à 5 rôles (`super`/`admin`/`redac`/`valid`/`lecture`) **volontairement non construit** (`ADMIN-02`), à ne faire que sur validation explicite de Pauline.
- [x] [P0] **Référentiel** : atelier (familles, thèmes, sous-thèmes, fiches) — fait, `/referentiel`.
- [~] [P0] **Import Word** (moteur unique) — lecture DOCX, détection CCN, écran de mapping : fait. Idempotence par numéro de fiche **bloquée** (attend 2 fichiers étalons du cahier §7.6, jamais transmis). Testé uniquement contre des `.docx` synthétiques, jamais un vrai document.
- [x] [P0] **Versions CCN** — édition des parties surchargées, aperçu résolu.
- [x] [P0] Composant commun de **prépublication** — diff, emplacements, clients impactés, `/publications`.
- [x] [P0] **Assistant de création client** — 8 étapes (architecture serveur, pas 9 ni 100 % client comme le prototype — écart assumé).
- [~] [P1] **Veille réglementaire** — qualification, lien vers version, panneau 7 sources : fait. Connecteurs réels **actifs pour 2 sources sur 7** (Ministère du travail, Ameli) ; BOSS/URSSAF débloquées après correctif ; Code du travail corrigé ; **BOCC bloqué par un WAF, non contournable** ; Légifrance/PISTE non configuré (pas de clé). Job de collecte quotidienne 10 h 30 : non fait.
- [x] [P1] Contenus LBP : Chiffres Paie, Dictionnaire, Actu, Calendrier, Offres — tous livrés côté admin.
- [x] [P1] Questionnaires — CRUD, réponses, historique/comparaison.
- [x] [P1] Entretiens clients — vue globale 4 paniers, déroulé complet.
- [x] [P1] **Visualisation du LBP d'un client** — aperçu réel (9 pages rejouées, pas une resimulation).
- [x] [P2] Tableau de bord — KPI réels (plus les chiffres artificiellement gonflés de la maquette).

## Phase 5 — LBP Client

- [~] [P0] Connexion et profils — login minimal fait ; flux d'invitation par e-mail (`AUTH-02`, hors périmètre du pivot Studio) à vérifier séparément.
- [x] [P0] Bibliothèque et fiche à 6 rubriques, bascule RG/CCN selon offre — fait (`client_sheet_content`). **Écart produit signalé, non corrigé** : la bibliothèque est un arbre plat, pas un drill-down familles→thèmes — décision à trancher séparément (audit de fidélité du 03/10/2026).
- [x] [P0] Rubriques verrouillées selon l'offre, résolu **côté serveur** (vue, pas une condition d'affichage côté client).
- [~] [P1] Accueil — KPI/calendrier compact/offre/rappels faits ; moteur de récurrence du calendrier toujours hors phase 1 (voir Phase 2).
- [x] [P1] Actu-Veille et page article pleine.
- [x] [P1] Chiffres Paie, Dictionnaire, Calendrier RH (événements réels), Quiz (25 s/question, pas 20 s comme supposé initialement).
- [x] [P1] Offres — consultation + demande d'évolution (`offer_change_requests`, aucun changement de droits côté client possible).
- [x] [P1] Notifications in-app + préférences par canal (1 type sur 7 avec un vrai déclencheur à ce jour, les 6 autres enregistrables sans effet — documenté honnêtement dans le code).
- [~] [P2] Bulle d'assistance, demande de formation, page Prise en main — Prise en main fait ; **Assistance bloquée** (dépend d'un service tiers non choisi, jamais simulé).

## Phase 6 — Corrections et incohérences relevées dans la maquette

- [x] [P0] **Sécurité** : mots de passe en clair — sans objet, comptes réels Supabase Auth (hashés, gérés par GoTrue), plus de `ST_USERS`.
- [ ] [P0] **XSS** : `sanitizeRich()` par un sanitiseur éprouvé — **non vérifié** sur le nouveau code ; à auditer spécifiquement si du contenu riche HTML est toujours rendu quelque part (éditeur Actu notamment).
- [x] [P0] **XSS** : `onclick`/`innerHTML` — sans objet, le nouveau code est en JSX/TSX (React échappe par défaut), pas de rendu `innerHTML` porté depuis la maquette à ce qu'on sait.
- [ ] [P1] Heure de notification de veille (10 h 30 vs config) — non vérifié sur le nouveau code (le job de collecte lui-même n'est pas construit, voir Phase 4).
- [x] [P1] Commentaire `ST_TABS` 8 vs 9 — sans objet, nouvelle navigation Studio reconstruite (`app/(studio)/`), pas un report du commentaire source.
- [x] [P1] `LBP_PALETTE` hors charte — réglé par le re-thème complet V37 (`LBP-CLIENT-16`), palette alignée sur `design.md`.
- [x] [P2] Code mort `_old_*` — sans objet pour le nouveau code (TypeScript, pas de port direct de l'ancienne gestion CCN).
- [x] [P2] Alias CSS historiques — sans objet, nouveaux tokens (`lib/design-tokens*.ts`), pas d'alias hérité.

## Phase 7 — Qualité et mise en production

- [ ] [P0] Tests unitaires du domaine (couverture ≥ 90 %) — **toujours non fait, aucune suite de tests dans le dépôt**. Plus gros écart restant avant mise en production.
- [ ] [P0] Tests de bout en bout des parcours critiques — non fait (Playwright proposé, jamais installé).
- [ ] [P0] Audit d'accessibilité RGAA / WCAG 2.1 AA — non fait sur le nouveau code.
- [ ] [P1] Responsive validé à plusieurs largeurs sur les deux espaces — vérifications ponctuelles mentionnées dans certains tickets (`tickets/LBP-CLIENT.md`), pas un audit systématique documenté.
- [ ] [P1] Conformité RGPD (registre des traitements, durées de conservation, consentement) — non traité par le pivot Studio, reste ouvert.
- [ ] [P1] Supervision et sauvegardes — non traité.
- [ ] [P2] Performance (LCP < 2,5 s) — non mesuré.

---

## Terminé

_Déplacer ici les tâches cochées, avec la date et la version du `CHANGELOG.md`._

- [x] Extraction de la charte graphique dans `design.md`.
- [x] Rédaction de `CLAUDE.md`, `ARCHITECTURE.md`, `TASK.md` et `CHANGELOG.md`.
- [x] Intégration du pivot « LBP Studio » (186 commits, voir `tickets/` et `CHANGELOG.md` 2026-10-05) et mise à jour de ces quatre documents en conséquence.
