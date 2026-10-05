# CLAUDE.md — LBP · Le Référentiel Paie & Droit social (G2S)

> Fichier de contexte pour les agents de code (Claude Code, Antigravity…).
> À lire **avant toute modification**. Compléments : `ARCHITECTURE.md` (modèle et flux),
> `design.md` (charte graphique), `TASK.md` (backlog), `CHANGELOG.md` (historique).

---

## 1. Le projet en 30 secondes

**LBP** est un référentiel documentaire de paie et de droit social édité par **G2S** (groupe-2s.com) et vendu sur abonnement à des entreprises.
Il se compose de **deux applications qui partagent une base unique** :

| Application    | Public                                                       | Rôle                                                                                                 |
| -------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **LBP Client** | DRH, gestionnaires paie et salariés des entreprises clientes | Consulter les fiches, la veille, les chiffres de paie, le calendrier RH, le dictionnaire et les quiz |
| **LBP Studio** | Équipe G2S (interne)                                         | Back-office : construire le référentiel, créer les clients, rédiger, valider, publier et notifier    |

Principe fondateur : **G2S possède toutes les données.** Le Studio est le back-office de _tout_ ce qu'affiche le Client. Rien n'est codé en dur côté Client.

## 2. État actuel du dépôt

**Le dépôt n'est plus une maquette statique : c'est une application Next.js (App Router) + Supabase réelle, en production de données.** La maquette `LBP_V9_9_Studio.html` reste la référence de **fidélité visuelle et textuelle** (le code cite systématiquement, en commentaire, la ligne ou le sélecteur CSS de la maquette dont il s'inspire) mais n'est plus la source de vérité fonctionnelle — le code l'est.

- **Une seule application Next.js**, deux groupes de routes dans la même arborescence `app/` : `app/(client)/` (LBP Client, espace entreprise) et `app/(studio)/` (LBP Studio, back-office G2S). **Pas** deux projets séparés, **pas** deux URLs distinctes à ce stade — voir `ARCHITECTURE.md` § 8 (mis à jour) pour pourquoi le monorepo initialement proposé (`apps/client`, `apps/studio`, `packages/domain`…) n'a pas été retenu.
- **Une seule base Supabase** (PostgreSQL + Row Level Security + Auth + Storage), versionnée par des migrations SQL dans `supabase/migrations/` — voir `db/ARCHITECTURE.md` pour le modèle de données complet.
- **Aucune persistance `localStorage`** pour les données métier. Tout est en base, lu/écrit via des Server Actions et Route Handlers soumis à RLS.
- Design system partagé entre les deux espaces : `ui-kit/` (composants génériques) + `lib/design-tokens.ts`/`lib/design-tokens-client.ts` (tokens), différenciés par une classe CSS de thème (`.theme-client`), **pas** deux design systems séparés.
- Historique de construction détaillé (tickets, décisions, écarts assumés avec le prototype) : `tickets/` (backlog local du pivot Studio, jamais poussé en issues GitHub) et `docs/adr/` (décisions d'architecture actées).

## 3. Commandes

```bash
npm install
cp .env.example .env.local   # renseigner NEXT_PUBLIC_SUPABASE_ANON_KEY (npm run supabase:start l'affiche)
npm run supabase:start       # stack Supabase locale (Docker) — requis pour l'authentification
npm run dev                  # http://localhost:3000
```

| Commande                                                   | Effet                                                                       |
| ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| `npm run lint` / `npm run format` / `npm run format:check` | ESLint / Prettier                                                           |
| `npm run build`                                            | Build de production                                                         |
| `npm run migration:new <nom>`                              | Nouvelle migration SQL horodatée                                            |
| `npm run db:reset`                                         | Recrée la base locale et rejoue toutes les migrations + `supabase/seed.sql` |
| `npm run supabase:stop`                                    | Arrête le stack local                                                       |

Procédure complète de migration (local → staging → production) : `docs/supabase/MIGRATIONS.md`.

**Pas de suite de tests automatisée à ce jour** (Vitest/Playwright proposés en `ARCHITECTURE.md` § 8.4, jamais mis en place — dette connue, voir `TASK.md` Phase 7).

Comptes de démo : voir `supabase/seed.sql` (sociétés `ALPHA`/`BETA`/`GAMMA` de démonstration + comptes `admin`/`client` réels créés via Supabase Auth — plus de mots de passe en clair codés en dur).

## 4. Règles métier non négociables

1. **Aucun contenu n'arrive chez un client sans publication explicite par G2S.** Le circuit est désormais à **7 statuts** (`workflow_status`) : `draft` → `review` → `valid` → `scheduled` → `published` → `historized` → `archived`. La veille réglementaire ne fait que _proposer_ des modifications.
2. **La veille réglementaire est un outil interne G2S.** Elle vit dans le Studio et n'apparaît jamais dans l'espace client. Connecteurs réels par source dans `lib/studio/monitoring-connectors/` — statut par source (actif/en erreur/non configuré) documenté dans `tickets/STU-VEILLE.md`, pas tout supposé fonctionnel.
3. **Une fiche contient toujours exactement 6 rubriques**, dans cet ordre : L'essentiel · Comprendre la règle · Maîtriser la règle en détail · Application concrète en paie · Points de vigilance · Quiz.
4. **Hiérarchie du référentiel maître** : `master_families` → `master_themes` → `master_subthemes` (optionnel) → `master_sheets` (identifiant stable `code`, jamais le titre) → `sheet_versions`. Une version porte une couche (`layer_kind` : `rg`/`ccn`/`ent`/`proc`) et, pour une couche `ccn`, un IDCC ; pour `ent`/`proc`, une société.
5. **Versions conventionnelles : héritage puis surcharge.** On ne stocke que les parties modifiées par la CCN (une ligne `sheet_versions` par couche/clé). La vue `client_sheet_content` résout la fiche visible pour une société donnée.
6. **Les conventions collectives se rapprochent par IDCC normalisé** (`normalize_idcc()`, strip zéros de tête), **jamais par leur libellé** — table `ccn_catalog`.
7. **L'affectation des fiches à un client** est recalculée à la volée par la vue `company_sheet_affectations` à partir de **6 origines traçables** : référentiel (base), questionnaire, CCN, offre (inconditionnelle), ajout manuel, mise à jour publiée (`maj`). Un retrait manuel (`company_sheet_overrides`, action `remove`) reste tracé, jamais une suppression silencieuse.
8. **Les offres déterminent les couches de contenu visibles** : 1 Essentiel = réglementation · 2 Métier = + CCN · 3 Entreprise = + accords et usages · 4 Signature = + process internes (`offer_tiers.includes_cba`/`includes_agreements`/palier 4). Le client ne peut pas changer lui-même de niveau (`companies.offer_tier` jamais modifiable côté client) : il peut seulement _demander_ une évolution (`offer_change_requests`).
9. **Trois origines de données**, à distinguer techniquement et visuellement : contenu commun G2S (référentiel maître), donnée propre à un client administrée par G2S (CCN de la société, overrides d'affectation), contenu créé par le client lui-même (documents, avatars, préférences — jamais écrasé ni propagé à une autre société).
10. **L'import Word passe par un moteur unique** (`lib/studio/docx-import/` : `parse-docx.ts` → `match-ccn.ts`/`extract-quiz.ts` → écran de contrôle du mapping → décision G2S). Aucun remplissage silencieux n'est autorisé. Testé uniquement contre des `.docx` synthétiques à ce jour — jamais un vrai document Word rédigé à la main (dette, voir `tickets/STU-IMPORT.md`).
11. Chaque action du Studio est **journalisée** (table d'activité, `lib/studio/activity.ts`).
12. **Un article s'affiche dans une vraie page, jamais dans une modale.**
13. **Toute écriture qui touche une donnée sensible côté client** (identité d'entreprise, etc.) passe par une fonction Postgres `security definer` à colonnes explicites (ex. `update_company_identity()`), jamais par un update de table brut exposé au client — empêche une escalade de privilège (ex. modifier son propre `offer_tier`).

## 5. Conventions de code

- **Langue** : l'interface, les commentaires et les messages de commit sont en **français**. Les identifiants de code peuvent rester en anglais ou en français, mais il faut suivre la convention du fichier modifié.
- **Typographie française** dans l'UI : espaces insécables avant `: ; ! ?`, guillemets « », dates `JJ/MM/AAAA`.
- **Pattern page / Content** : une route (`page.tsx`) est un **Server Component fin** qui (1) appelle `requireClient()`/`requireAdmin()` (jamais dans `layout.tsx` — un layout n'est pas rattrapé par le `error.tsx` de son propre segment, bug déjà constaté), (2) lit les paramètres, (3) délègue tout le rendu à un **Client Component séparé** `<Nom>Content.tsx`, données passées en **props** (pas une session rechargée côté client) — pour rester réutilisable tel quel par la prévisualisation admin (`app/(studio)/clients/[id]/vue-client/*`).
- **Écritures** : Server Actions colocalisées dans des fichiers `actions.ts` par section (jamais un update de table brut exposé sans contrôle de rôle).
- **Icônes** : `lucide-react`. Aucun emoji dans l'interface.
- **Recherche** : normaliser avec `lib/search/normalize.ts`.
- **Stockage de fichiers** : bucket Supabase Storage privé, policies RLS scopées par le premier segment du chemin (`{company_id}/...`), URLs signées à **courte durée** (10 min) — jamais un fichier public.
- **Pas de nouvelle valeur codée en dur** côté Client : tout libellé, toute couleur et tout ordre vient du référentiel ou de la base.
- **Code mort** : les fonctions préfixées `_old_` (héritage de la maquette JS) sont remplacées, ne pas les porter.

## 6. Charte graphique — l'essentiel (détail dans `design.md`)

- Police **Archivo** (400 → 800) ; **IBM Plex Mono** uniquement pour le code et les identifiants techniques.
- Couleurs Client (charte V37) : **framboise `#670626`** (header, boutons primaires), **carbone `#445068`** (texte), **minéral `#FAF9F7`** (fond), titres en **`#33405A`** graisse 800. Appliquées via la classe `.theme-client` dans `app/globals.css`.
- Le Studio garde le thème par défaut : header **bleu-gris `#445068`**, accents **claret `#670626`**.
- Boutons, onglets et chips en pilule (`999px`). Cartes en 14–18 px. Ombres légères teintées carbone.
- **N'invente aucune couleur.** Utilise les tokens de `design.md` § 2 / `lib/design-tokens.ts` / `lib/design-tokens-client.ts`.

## 7. Façon de travailler

- **Avant de coder** : relis la section concernée de la maquette, de `ARCHITECTURE.md` et de `db/ARCHITECTURE.md`. Si un ticket existe déjà sur le sujet dans `tickets/`, lis-le — il documente souvent un écart déjà assumé avec le prototype.
- **Petits changements ciblés.** Ne reformate pas les gros fichiers.
- **Après une modification** : vérifie les deux habillages (Client et Studio), au moins trois largeurs (1240, 760 et 380 px).
- **Mets à jour `CHANGELOG.md`** (section `[Non publié]`) et coche ou ajoute les éléments correspondants dans `TASK.md`. Une décision d'architecture qui en vaut la peine va dans `docs/adr/`, pas seulement dans un commentaire de code.
- **En cas de doute sur une règle métier, demande** plutôt que de deviner. La paie est un domaine réglementé, une erreur a des conséquences réelles chez les clients.
- **Ne touche jamais** aux URL de sources officielles ni aux contenus juridiques des fiches sans demande explicite.
- **Clés API externes non configurées à ce jour** (fonctionnalités prêtes côté code, jamais exécutées avec succès faute de clé réelle) : Légifrance/PISTE, Brevo (notifications mail/SMS), Anthropic (analyse IA de veille). Ne pas supposer qu'elles fonctionnent sans vérifier.

## 8. Glossaire express

| Terme                         | Sens                                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **CCN**                       | Convention collective nationale                                                                                            |
| **IDCC**                      | Identifiant de convention collective (4 chiffres) : clé de rapprochement, normalisé via `normalize_idcc()`                 |
| **RG**                        | Régime général (couche `rg` d'une version de fiche, sans CCN)                                                              |
| **BOSS**                      | Bulletin officiel de la Sécurité sociale                                                                                   |
| **JORF / BOCC**               | Journal officiel / Bulletin officiel des conventions collectives                                                           |
| **DSN**                       | Déclaration sociale nominative                                                                                             |
| **Fiche étalon**              | Fiche 01.01 « Période d'essai », modèle de référence de structure                                                          |
| **Fiche maître / version**    | `master_sheets` (identifiant stable) porte plusieurs `sheet_versions` (une par couche rg/ccn/ent/proc et par clé)          |
| **Mode client / mode Studio** | `app/(client)/` et `app/(studio)/` — même application Next.js, même base, séparées par rôle (`profiles.role`), pas par URL |
