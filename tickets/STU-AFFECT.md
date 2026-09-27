# STU-AFFECT — Moteur d'affectation

---

## STU-AFFECT-01 — Calcul des affectations ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-05**
**Réalisé** : `lib/studio/affectations.ts` (`getCompanyAffectations()`) — deux requêtes (vue + `master_sheets`) plutôt qu'un embed PostgREST, qui ne fonctionne pas sur une vue sans FK déclarée.
**Vérifié** : via son premier usage réel dans STU-AFFECT-02 (pas de comportement isolé à tester — c'est une fonction de lecture pure consommée ailleurs).

**Correctif (27/09/2026)** : la vue livrée initialement ne produisait que 4 origines (`base/questionnaire/ccn/manual`) — `offre`, pourtant listée explicitement ci-dessus dans ce ticket, manquait. Trouvé en relisant `LBP_V6_Studio.html` (racine de `LBP_V2/`, jamais consulté avant ce jour) : son moteur `computeAffectation()` ajoute `offre` de façon inconditionnelle à chaque fiche affectée. Une 6ᵉ origine `maj` (mise à jour publiée, absente des tickets mais présente dans cette référence) a été ajoutée en même temps, décision utilisateur. Migration `20260927171850_origines_offre_maj_affectation.sql` (`create or replace view`, additive). Vérifié réel : `offre` présent sur toutes les fiches d'ALPHA ; `maj` apparaît dès qu'une fiche est republiée (testé en republiant temporairement `REM-DEMO-001`, badge "Mise à jour" bleu confirmé en navigateur, puis état restauré).

**Contexte** : les 5 origines d'affectation (§7.3) — base, questionnaire, CCN, offre, manuel — doivent être exposées à l'application sans recalcul manuel ni duplication du référentiel par client.

**À faire** : Server Action / Route Handler exposant `company_sheet_affectations` pour une société donnée, avec la liste des fiches applicables et leurs origines.

**Critères d'acceptation**

- Appeler cette fonction pour une société renvoie exactement les mêmes fiches que celles visibles dans son LBP Client (cohérence avec STU-DATA-07).
- Le filtre par offre (couche `ccn` retirée si l'offre ne l'inclut pas) est appliqué avant retour du résultat.

---

## STU-AFFECT-02 — UI "Pourquoi cette fiche est présente ?" ✅ Fait

**Priorité : Must** · **Dépendances : STU-AFFECT-01**
**Réalisé** : `app/(studio)/_components/AffectationList.tsx` (réutilisable, badges par origine, fiches retirées manuellement affichées séparément barrées), intégré dans `/clients/[id]`.
**Vérifié** : test réel — ALPHA/`REM-DEMO-004` affiche bien ses 3 origines simultanément (Référentiel + Convention collective + Ajout manuel G2S), pas seulement la première.

**Contexte** : "chaque fiche affectée à un client doit afficher 'Pourquoi cette fiche est présente ?' avec les causes applicables" (§7.4) — exigence de transparence explicite du dossier.

**À faire** : dans la fiche client, pour chaque fiche affectée, un élément d'interface listant les origines (référentiel / questionnaire / CCN / offre / manuel) avec le détail associé.

**Critères d'acceptation**

- Une fiche affectée par plusieurs origines à la fois (ex. questionnaire + CCN) affiche bien toutes les causes, pas seulement la première trouvée.

---

## STU-AFFECT-03 — Ajout/retrait manuel G2S avec motif ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-05**
**Réalisé** : `setSheetOverride`/`clearSheetOverride` (`app/(studio)/clients/actions.ts`, upsert sur `company_sheet_overrides`, motif obligatoire) ; `AddOverrideForm` (nouveau) pour l'ajout, `AffectationList` étendu (`companyId` optionnel) pour le retrait/la restauration inline.
**Vérifié** : test réel navigateur (session GoTrue réelle, pas de simulation) — GAMMA (aucun override initial) : ajout manuel de "Assurance chômage" → badges `Référentiel` + `Ajout manuel G2S`, fiche disparaît du menu déroulant d'ajout ; retrait de "Titres-restaurant" avec motif → bascule dans "Retirées manuellement", origines automatiques (`Référentiel`, `Questionnaire`) toujours affichées à côté du badge `Retirée`. BETA/`REM-DEMO-002` (retrait seedé) : "Annuler le retrait" → la fiche revient dans la liste visible avec ses origines d'origine. Confirmé en base (`company_sheet_overrides`) et en rendu DOM après navigation fraîche.
**Note de conception découverte pendant le test** : l'origine `base` de la vue `company_sheet_affectations` (STU-DATA-05) est inconditionnelle pour toute fiche publiée/toute société — le filtre "fiches disponibles à ajouter" ne peut donc pas exclure les fiches déjà affectées par une origine automatique (la liste serait alors vide en permanence, ce qui contredirait le seed lui-même où REM-DEMO-004 cumule `base`+`ccn`+`manual` pour ALPHA). Le filtre exclut uniquement les fiches ayant déjà un override `add` actif.

**Contexte** : "G2S doit toujours pouvoir ajouter ou retirer manuellement une fiche. Conserver la trace de cette surcharge manuelle et de la règle automatique initiale" (§7.4).

**À faire** : action d'ajout/retrait sur `company_sheet_overrides` (avec champ motif obligatoire), visible et réversible depuis la fiche client.

**Critères d'acceptation**

- Retirer manuellement une fiche normalement affectée par le questionnaire la masque côté client, mais l'origine automatique reste visible côté Studio (STU-AFFECT-02) — la règle initiale n'est jamais supprimée, seulement surchargée.

---

## STU-AFFECT-04 — Vue globale des affectations (onglet dédié) ✅ Fait

**Priorité : Must** (ajouté après coup — l'onglet "Affectations" de la navigation Studio n'avait aucun écran propre, l'info n'existant que noyée dans chaque fiche client) · **Dépendances : STU-AFFECT-01, STU-CCN-02**
**Réalisé** : `app/(studio)/affectations/page.tsx` — sélecteur de société (`?company=<id>`, première société par défaut) + `getCompanyAffectations()` + `AffectationList` réutilisé en lecture seule (pas de `companyId` passé, donc pas de boutons Retirer/Ajouter — l'édition reste sur la fiche client, STU-AFFECT-03, pour éviter deux endroits qui modifient la même donnée). Lien nav "Affectations" activé dans `StudioNav.tsx`.
**Vérifié** : test réel navigateur (session GoTrue réelle) — le lien de nav est cliquable ; `/affectations?company=<ALPHA>` et `/clients/<ALPHA>` affichent des lignes de fiches strictement identiques (mêmes badges d'origine, même ordre), idem pour BETA côté "Retirées manuellement" (origine automatique conservée visible dans les deux écrans) ; confirmé qu'aucun bouton Retirer/Ajouter n'apparaît sur la vue globale (lecture seule voulue).

**Contexte** : onglet "Affectations" (§3 du dossier) — "Règles reliant profil client, réponses, CCN, offre et fiches". STU-AFFECT-02 met cette information dans la fiche client (une société à la fois) ; il manque une vue transverse pour parcourir les règles sans ouvrir chaque société une par une.

**À faire** : écran `/affectations` — sélection d'une société (réutilise la liste de STU-DESIGN-00b), puis affichage de `company_sheet_affectations` pour cette société avec, pour chaque fiche, ses origines — même donnée que STU-AFFECT-02, présentée en vue consolidée plutôt qu'imbriquée dans la fiche client.

**Critères d'acceptation**

- Accessible depuis la navigation Studio (plus grisé).
- Les origines affichées pour une société donnée sont identiques à celles vues depuis sa fiche client (STU-AFFECT-02) — aucune divergence entre les deux vues, une seule requête source (`company_sheet_affectations`).
