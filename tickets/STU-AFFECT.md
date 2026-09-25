# STU-AFFECT — Moteur d'affectation

---

## STU-AFFECT-01 — Calcul des affectations

**Priorité : Must** · **Dépendances : STU-DATA-05**

**Contexte** : les 5 origines d'affectation (§7.3) — base, questionnaire, CCN, offre, manuel — doivent être exposées à l'application sans recalcul manuel ni duplication du référentiel par client.

**À faire** : Server Action / Route Handler exposant `company_sheet_affectations` pour une société donnée, avec la liste des fiches applicables et leurs origines.

**Critères d'acceptation**

- Appeler cette fonction pour une société renvoie exactement les mêmes fiches que celles visibles dans son LBP Client (cohérence avec STU-DATA-07).
- Le filtre par offre (couche `ccn` retirée si l'offre ne l'inclut pas) est appliqué avant retour du résultat.

---

## STU-AFFECT-02 — UI "Pourquoi cette fiche est présente ?"

**Priorité : Must** · **Dépendances : STU-AFFECT-01**

**Contexte** : "chaque fiche affectée à un client doit afficher 'Pourquoi cette fiche est présente ?' avec les causes applicables" (§7.4) — exigence de transparence explicite du dossier.

**À faire** : dans la fiche client, pour chaque fiche affectée, un élément d'interface listant les origines (référentiel / questionnaire / CCN / offre / manuel) avec le détail associé.

**Critères d'acceptation**

- Une fiche affectée par plusieurs origines à la fois (ex. questionnaire + CCN) affiche bien toutes les causes, pas seulement la première trouvée.

---

## STU-AFFECT-03 — Ajout/retrait manuel G2S avec motif

**Priorité : Must** · **Dépendances : STU-DATA-05**

**Contexte** : "G2S doit toujours pouvoir ajouter ou retirer manuellement une fiche. Conserver la trace de cette surcharge manuelle et de la règle automatique initiale" (§7.4).

**À faire** : action d'ajout/retrait sur `company_sheet_overrides` (avec champ motif obligatoire), visible et réversible depuis la fiche client.

**Critères d'acceptation**

- Retirer manuellement une fiche normalement affectée par le questionnaire la masque côté client, mais l'origine automatique reste visible côté Studio (STU-AFFECT-02) — la règle initiale n'est jamais supprimée, seulement surchargée.

---

## STU-AFFECT-04 — Vue globale des affectations (onglet dédié)

**Priorité : Must** (ajouté après coup — l'onglet "Affectations" de la navigation Studio n'avait aucun écran propre, l'info n'existant que noyée dans chaque fiche client) · **Dépendances : STU-AFFECT-01, STU-CCN-02**

**Contexte** : onglet "Affectations" (§3 du dossier) — "Règles reliant profil client, réponses, CCN, offre et fiches". STU-AFFECT-02 met cette information dans la fiche client (une société à la fois) ; il manque une vue transverse pour parcourir les règles sans ouvrir chaque société une par une.

**À faire** : écran `/affectations` — sélection d'une société (réutilise la liste de STU-DESIGN-00b), puis affichage de `company_sheet_affectations` pour cette société avec, pour chaque fiche, ses origines — même donnée que STU-AFFECT-02, présentée en vue consolidée plutôt qu'imbriquée dans la fiche client.

**Critères d'acceptation**

- Accessible depuis la navigation Studio (plus grisé).
- Les origines affichées pour une société donnée sont identiques à celles vues depuis sa fiche client (STU-AFFECT-02) — aucune divergence entre les deux vues, une seule requête source (`company_sheet_affectations`).
