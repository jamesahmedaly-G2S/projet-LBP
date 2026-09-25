# STU-VEILLE — Veille connectée au référentiel

---

## STU-VEILLE-01 — Saisie manuelle d'une évolution réglementaire

**Priorité : Must** · **Dépendances : STU-DATA-01**

**Contexte** : étape 1 "Détection" de la chaîne (§10) — en l'absence des connecteurs automatiques (hors périmètre, cf. STU-VEILLE-04), la détection reste manuelle pour cette livraison.

**À faire** : formulaire de saisie `legal_monitoring` (source, titre, date du texte, résumé, impact), statut initial `new`.

**Critères d'acceptation**

- Une entrée de veille est créée sans qu'aucune fiche client ne soit modifiée (aucun effet de bord tant que non qualifiée).

---

## STU-VEILLE-02 — Qualification (fiche existante ou nouvelle fiche)

**Priorité : Must** · **Dépendances : STU-VEILLE-01, STU-REF-01**

**Contexte** : "Le système doit gérer deux scénarios : si une fiche existe, proposer sa mise à jour ; si aucune fiche adaptée n'existe, proposer la création d'une nouvelle fiche" (§9, CR 17/09) — les deux options doivent être proposées, pas une suggestion unique automatique.

**À faire** : écran de qualification permettant de rattacher l'entrée de veille à une fiche existante (`master_sheet_id`) ou d'en créer une nouvelle, statut passe à `qualified`.

**Critères d'acceptation**

- Les deux chemins (rattacher / créer) sont toujours proposés côté interface, jamais un seul suggéré automatiquement sans alternative.

---

## STU-VEILLE-03 — Lien veille → nouvelle version

**Priorité : Must** · **Dépendances : STU-VEILLE-02, STU-WORKFLOW-01**

**Contexte** : "Une nouvelle version de la fiche est préparée sans toucher à la version publiée" (§10) ; traçabilité complète attendue de bout en bout.

**À faire** : depuis une entrée de veille qualifiée, bouton "Préparer une nouvelle version" créant une `sheet_versions` en `draft` avec `legal_monitoring_id` renseigné ; passage du statut de veille à `processed` une fois la version publiée.

**Critères d'acceptation**

- Depuis n'importe quelle version publiée, on peut remonter à l'entrée de veille d'origine si elle existe.

---

## STU-VEILLE-04 — Connecteurs automatiques sources officielles

**Priorité : Won't (ce cycle)** · **Dépendances : —**

**Contexte** : déjà ticketé séparément côté James (AUTOMATION-01/02/03, #85-87 — connecteurs 7 sources, analyse IA, route planifiée 10h30). Pas dupliqué ici.

**À faire** : rien — se coordonner avec ces tickets existants au moment de la réconciliation, ne pas reconstruire en parallèle.
