# STU-DESIGN — Identité visuelle Studio

---

## STU-DESIGN-00 — Passe légère : ui-kit minimal + accent bleu ✅ Fait

**Priorité : Must** (ajouté en cours de route, à la demande explicite — les écrans construits sans aucun style structurant nuisaient à la lisibilité du travail en cours) · **Dépendances : aucune**

**Contexte** : ni le plein périmètre de STU-DESIGN-01 (navigation à 10 onglets — prématurée, la plupart des onglets n'ont pas encore d'écran) ni son report en toute fin de séquence n'étaient tenables : les écrans STU-REF/STU-CCN/STU-WORKFLOW construits jusqu'ici (Tailwind brut, sans composants partagés) étaient illisibles à l'usage.

**Réalisé** : `ui-kit/Button.tsx`, `LinkButton.tsx`, `Card.tsx`, `Field.tsx` (TextField/TextAreaField/SelectField), `Badge.tsx` (dès maintenant, conformément à `ARCHITECTURE.md` §4 qui prévoit ce dossier dès la phase 1) ; accent bleu Studio (`blue-600`/`blue-900`) sur boutons primaires et en-tête ; `app/(studio)/layout.tsx` (en-tête minimal "LBP STUDIO", pas de navigation complète) ; refactorisation de tous les écrans existants (login, référentiel, nouvelle fiche, fiche, société) pour utiliser ces composants au lieu de classes dupliquées.

**Non fait (reste à STU-DESIGN-01)** : navigation à 10 onglets, port de `lib/design-tokens.ts`, différenciation visuelle poussée avec le LBP Client (qui n'existe pas encore côté écrans).

**Vérifié** : capture d'écran des 5 écrans (login, référentiel, nouvelle fiche, fiche, société), aucune erreur console, lint/typecheck propres.

---

## STU-DESIGN-00b — Navigation Studio (aperçu, liens désactivés pour l'existant) ✅ Fait

**Priorité : Should** · **Dépendances : STU-DESIGN-00**

**Contexte** : suite explicite du chantier design — poursuivre au-delà de STU-DESIGN-00 sans construire la navigation complète (STU-DESIGN-01) tant que la plupart des 10 sections du dossier n'ont pas d'écran.

**Réalisé** : `StudioNav.tsx` (les 10 sections du §3, seules "Clients" et "Référentiel" sont des liens réels, les autres des `<span>` grisés non cliquables), page `app/(studio)/clients/page.tsx` (liste minimale, sans le code couleur d'échéance qui reste à STU-CLIENT-03), mise en évidence de la section active via `usePathname()`.

**Vérifié** : navigation réelle Clients → ALPHA fonctionnelle (URL confirmée), section active correctement stylée (`font-medium text-white`) vérifié par inspection directe du DOM rendu — pas seulement visuellement, une capture d'écran seule prêtait à confusion sur la subtilité blue-100/white ; section "Tableau de bord" confirmée non cliquable (aucun `<a>` généré).

---

## STU-DESIGN-01 — Charte bleu Studio + navigation dédiée ✅ Fait

**Priorité : Should** · **Dépendances : aucune**

**Contexte** : §2 — le Studio doit être "immédiatement identifiable comme appartenant au pôle LBP" sans copier le LBP Client : univers bleu structurant, cartes claires, navigation plus dense, header "LBP STUDIO / Administration G2S · Référentiel & clients". Explicitement interdit : un dark mode générique ou un simple recolorage du mode G2S actuel.

**Déclencheur (27/09/2026)** : l'utilisateur a signalé que les couleurs ne correspondaient pas à celles de Pauline. Vérification : les écrans utilisaient les couleurs Tailwind par défaut (`blue-900`, `zinc-50`...), jamais dérivées d'un vrai fichier de tokens — `lib/design-tokens.ts`, que `docs/ARCHITECTURE.md` §9 et ce ticket désignent depuis STU-DESIGN-00 comme le port 1:1 attendu, n'avait en réalité jamais été créé.

**Réalisé** : `lib/design-tokens.ts` (nouveau) — port 1:1 des variables `--st-*` de `LBP_V6_Studio.html` (racine de `LBP_V2/`, section "LBP STUDIO : univers bleu, lumineux et premium", la version la plus récente et complète, postérieure à `LBP_V2-20.html`) : navy `#14304F`, bleu `#2E5B87`, fond `#E9EFF8`, ligne `#D3DEEC`, muted `#6B7C93`, plus les tons vert/ambre/rouge/violet de statut. Reporté dans `app/globals.css` (`@theme` Tailwind v4 → classes `bg-studio-*`/`text-studio-*`/`border-studio-*`). Tous les composants `ui-kit/` (`Card`, `Button`, `LinkButton`, `Badge`, `Field`) recolorés avec ces tokens (plus arrondis en pilule pour les boutons et 16px pour les cartes, conformes à `--pill` et `.st-card` du prototype) ; `app/(studio)/layout.tsx` et `StudioNav.tsx` restructurés pour correspondre à la vraie structure du prototype — header navy fixe, **barre d'onglets blanche séparée avec indicateur de soulignement bleu** (pas un fond navy uniforme comme avant), fidèle à `.st-header`/`.st-nav` du prototype. Balayage systématique de tous les écrans existants (`app/(studio)/**`, `app/login`) pour remplacer chaque classe Tailwind brute (`text-zinc-*`, `bg-blue-*`...) par les tokens Studio — plus aucune couleur non dérivée du prototype.
**Vérifié** : test réel navigateur (session admin réelle) — captures d'écran de `/login`, `/referentiel`, `/clients`, `/veille` : fond bleu pâle, header et titres navy, liens et boutons primaires bleus, nav à onglets blanche avec soulignement actif, badges de statut recolorés (vert/ambre) — conforme pixel-pour-token à la palette du prototype. `tsc --noEmit` et `eslint` propres sur l'ensemble du balayage.

**À faire (reste, non bloquant)** : `STU-DESIGN-02` (harmonisation icônes) — les emojis (📅 sur le bouton calendrier de STU-VEILLE) n'ont pas encore été remplacés par les icônes Lucide du prototype, cohérent avec la portée déjà déclarée de ce ticket suivant.

**Critères d'acceptation**

- Le Studio reste lisible et cohérent avec l'identité LBP (typographies, arrondis) tout en étant visuellement distinct du LBP Client au premier coup d'œil.

---

## STU-DESIGN-02 — Harmonisation icônes/composants ✅ Fait

**Priorité : Could** · **Dépendances : STU-DESIGN-01**
**Réalisé** : `lucide-react` ajouté en dépendance réelle. Recherche exhaustive de tout le code Studio (`app/`, `ui-kit/`, `lib/`) : un seul emoji restant, exactement celui identifié par STU-DESIGN-01 (📅 sur `AddToCalendarButton.tsx`, STU-VEILLE) — remplacé par les icônes `Calendar`/`Check` de Lucide.
**Note sur le critère « pas de composant dupliqué avec LBP Client »** : sans objet pour l'instant — le portail LBP Client (13 modules du dossier, cf. `docs/G2S-LBP-01.md`) n'existe encore sur aucune branche, réelle ou pivot, donc il n'y a rien à dédupliquer aujourd'hui. Le seul `ui-kit/` du dépôt reste bien le Studio ; le jour où LBP Client sera construit, il devra réutiliser ce même `ui-kit/` (règle déjà en place, rien à faire de plus ici).
**Vérifié** : test réel navigateur (session admin réelle) sur `/veille/[id]` — le bouton contient une vraie icône SVG, plus aucun caractère 📅, `tsc --noEmit`/`eslint` propres.

**Contexte** : continuité avec le travail déjà engagé côté maquette client (remplacement des emojis par des icônes Lucide, cf. CR du 08/09) — à étendre au Studio.

**À faire** : réutiliser les composants `ui-kit/` déjà identifiés comme à construire dans `ARCHITECTURE.md`, pas de nouvelle bibliothèque de composants spécifique au Studio.

**Critères d'acceptation**

- Aucun composant dupliqué entre LBP Client et LBP Studio pour un même usage (bouton, carte, badge) — un seul `ui-kit/` partagé, conformément à la règle de frontière stricte d'`ARCHITECTURE.md` §4.
