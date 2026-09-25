# STU-CCN — Multi-CCN

---

## STU-CCN-01 — Catalogue CCN (recherche nom/IDCC) ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-01**
**Réalisé** : `app/(studio)/_components/CcnMultiSelect.tsx` — composant contrôlé (`selected`/`onChange`), pas de dépendance à une page précise, réutilisable tel quel. Vérifié fonctionnellement via son intégration dans STU-CCN-02 (recherche + sélection multiple testées en conditions réelles).

**Contexte** : "Prévoir une sélection multiple, avec recherche par nom et IDCC" (§7.2).

**À faire** : composant de recherche/sélection sur `ccn_catalog`, réutilisable dans le questionnaire, l'assistant de création client et la fiche client.

**Critères d'acceptation**

- Recherche fonctionnelle par nom partiel ou par numéro IDCC.
- Sélection multiple, une société peut avoir 0, 1 ou plusieurs CCN.

---

## STU-CCN-02 — Sélection multi-CCN sur la société ✅ Fait

**Priorité : Must** · **Dépendances : STU-CCN-01, STU-DATA-05**
**Note** : la table `company_ccns` et ses policies existent déjà — créées dans STU-DATA-05 (prérequis technique de `company_sheet_affectations`). Ce ticket ne porte plus que sur le composant d'interface.
**Réalisé** : `app/(studio)/clients/[id]/page.tsx` (page société minimale — seule la section CCN est câblée pour l'instant, le reste attend STU-CLIENT-02), `CcnSection.tsx` + `updateCompanyCcns()` (diff add/remove sur `company_ccns`, écriture admin uniquement).
**Vérifié** : test réel navigateur — BETA (CCN 3043 seule) n'a pas la couche CCN de `REM-DEMO-004` (Syntec/1486) ; après avoir coché "Syntec" et enregistré via l'écran, `company_sheet_affectations` bascule immédiatement à `{base,ccn}` pour cette fiche, sans étape de recalcul séparée.

**Contexte** : "Une entreprise peut relever de plusieurs CCN" (§7.2) — table `company_ccns` déjà en base.

**À faire** : brancher le composant STU-CCN-01 sur `company_ccns` dans l'assistant de création (STU-CLIENT-01) et la fiche client (STU-CLIENT-02), écriture réservée à G2S (`is_admin()`).

**Critères d'acceptation**

- Chaque CCN sélectionnée active immédiatement les couches conventionnelles pertinentes dans le calcul d'affectation (vérifiable via `company_sheet_affectations`).

---

## STU-CCN-03 — Édition de la couche CCN d'une fiche

**Priorité : Must** · **Dépendances : STU-DATA-02, STU-REF-02, STU-WORKFLOW-01, STU-WORKFLOW-03** (dépendance corrigée : les critères d'acceptation supposent la publication et `sheet_version_recipients`, pas encore construites — reporté après STU-WORKFLOW)

**Contexte** : scénario C ("modifier uniquement la couche Syntec... n'impacter que les clients Syntec concernés").

**À faire** : depuis une fiche maître, écran d'édition dédié par CCN (une `sheet_versions` par CCN sélectionnée), avec son propre cycle de statuts indépendant de la couche `rg`.

**Critères d'acceptation**

- Publier une version `ccn` ne modifie ni le statut ni le contenu de la version `rg` de la même fiche.
- Seuls les clients ayant cette CCN reçoivent la mise à jour (vérifiable via `sheet_version_recipients`).
