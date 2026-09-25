# STU-REF — Référentiel maître (admin)

---

## STU-REF-01 — Arborescence Familles → Thèmes → Sous-thèmes → Fiches ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-01**
**Réalisé** : `app/(studio)/referentiel/page.tsx` (Server Component, `requireAdmin()`) + `lib/studio/workflow-status.ts` (labels réutilisables). Vérifié de bout en bout avec de vraies sessions HTTP (login GoTrue réel, cookie de session construit et envoyé) : un admin voit les 3 familles + 6 fiches de démo avec leur statut ; un compte `client` authentifié reçoit "Accès refusé" ; un visiteur non authentifié est bloqué.
**Effet de bord positif** : ce test a révélé que les comptes du seed (STU-DATA-08) n'étaient pas de vrais comptes GoTrue (`INSERT` SQL incomplet — il manquait la ligne `auth.identities` et plusieurs colonnes token non-nullables côté Go). Corrigé dans `supabase/seed.sql` — voir STU-DATA-08.

**Contexte** : onglet "Référentiel" du Studio (§3) — navigation dans la nomenclature maître.

**À faire** : écran listant les familles fixes, dépliables en thèmes puis sous-thèmes puis fiches, avec statut (badge du workflow) visible sur chaque fiche.

**Critères d'acceptation**

- Les 3 familles apparaissent toujours dans l'ordre Vie du salarié / Rémunération / Cotisations.
- Chaque fiche affiche son statut courant (brouillon/à vérifier/validé/programmé/publié/historisé/archivé).

---

## STU-REF-02 — CRUD fiche maître (métadonnées + couche RG) ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-01, STU-DATA-02**
**Réalisé** : `app/(studio)/referentiel/nouvelle-fiche/` (formulaire famille/thème/sous-thème cascadant + titre + tags) et `app/(studio)/referentiel/[id]/` (édition des 5 champs de contenu), `lib/studio/placeholder-content.ts` (contenu factice généré à la création), `app/(studio)/referentiel/actions.ts` (Server Actions).
**Vérifié** : parcours réel navigateur (créer → rediriger vers la fiche → modifier un champ → enregistrer), confirmé en base : `sheet_versions` créée en `draft`/`rg`/v1, champ modifié bien pris en compte, les 4 autres champs gardent leur contenu `[À rédiger]` factice.

**Contexte** : créer/éditer une fiche maître et son contenu de base (régime général) — sans rédiger le contenu juridique détaillé à ce stade (§1, contrainte explicite du dossier).

**À faire** : formulaire de création (famille, thème, sous-thème, titre, tags) + édition du contenu `rg` via `sheet_versions`, avec les champs déjà validés en CR (L'essentiel à retenir / Comprendre / Maîtriser / Comment l'appliquer / Points de vigilance).

**Critères d'acceptation**

- Créer une fiche crée automatiquement une première `sheet_versions` en statut `draft`, couche `rg`.
- Les champs de contenu utilisent des données factices ("lorem" structuré), pas de vrai contenu juridique — conforme à la consigne du dossier.

---

## STU-REF-03 — Garantie d'identifiant stable

**Priorité : Must** · **Dépendances : STU-REF-02**

**Contexte** : "un changement de titre ne doit jamais casser les affectations" (§8) — déjà garanti en base par `code` séparé de `title`, ce ticket couvre la validation côté interface.

**À faire** : le `code` est généré une fois à la création (non éditable ensuite), affiché en lecture seule sur la fiche ; renommer le `title` n'a aucun impact sur `master_question_impacts` ni `company_sheet_overrides`.

**Critères d'acceptation**

- Test manuel : renommer une fiche référencée par un override client ne casse pas l'affectation existante.

---

## STU-REF-04 — Import de la nomenclature de départ

**Priorité : Should** · **Dépendances : STU-DATA-01**

**Contexte** : la Nomenclature Maître V1 fournit 153 fiches candidates déjà réparties par famille/thème (§8) — base de travail à affiner, pas à rédiger intégralement.

**À faire** : script d'import (depuis `Nomenclature_Maitre_LBP_V1_Septembre_2026.xlsx` si disponible, sinon les données déjà présentes dans `TITLE_BANK`/`MASTER_THEMES` de `LBP_V6_Studio.html`) créant familles/thèmes/fiches avec statut `draft`.

**Critères d'acceptation**

- Le nombre de fiches importées par thème correspond aux effectifs du dossier (§8, tableau "Fiches candidates").

---

## STU-REF-05 — Import Word → fiche automatique

**Priorité : Won't (ce cycle)** · **Dépendances : —**

**Contexte** : déjà classé hors phase 1 par `ARCHITECTURE.md` (§3, "import Word côté serveur" explicitement reporté) et non requis pour démontrer les scénarios A-F.

**À faire** : rien pour l'instant — ticket conservé pour mémoire, à reprendre après le 20/10.
