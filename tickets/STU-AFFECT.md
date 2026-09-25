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
