# STU-VEILLE — Veille connectée au référentiel

---

## STU-VEILLE-01 — Saisie manuelle d'une évolution réglementaire ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-01**
**Réalisé** : `app/(studio)/veille/page.tsx` (liste) et `/veille/nouvelle` (formulaire) — écrivent directement sur `legal_monitoring`, table réelle de James (`baseline_schema_reel.sql`), réutilisée telle quelle : aucune migration, RLS (`legal_monitoring_admin_all`) et grants déjà en place. `lib/studio/monitoring-status.ts` pour les libellés de `regulatory_status` (new/linked/processed — le dossier dit "qualifiée" là où la colonne dit "linked", vocabulaire différent pour le même état, colonne non renommée). Onglet nav "Veille & mises à jour" activé.
**Vérifié** : test réel navigateur — création d'une entrée via le vrai formulaire, apparaît immédiatement dans la liste avec statut "Nouvelle" (défaut `new` de la colonne) ; validation HTML5 bloque la soumission sans source/titre ; confirmé en base que `master_sheets` (6 lignes, inchangé) n'est touché en rien par la création d'une entrée de veille.

**Contexte** : étape 1 "Détection" de la chaîne (§10) — en l'absence des connecteurs automatiques (hors périmètre, cf. STU-VEILLE-04), la détection reste manuelle pour cette livraison.

**À faire** : formulaire de saisie `legal_monitoring` (source, titre, date du texte, résumé, impact), statut initial `new`.

**Critères d'acceptation**

- Une entrée de veille est créée sans qu'aucune fiche client ne soit modifiée (aucun effet de bord tant que non qualifiée).

---

## STU-VEILLE-02 — Qualification (fiche existante ou nouvelle fiche) ✅ Fait

**Priorité : Must** · **Dépendances : STU-VEILLE-01, STU-REF-01**
**Réalisé** : `supabase/migrations/20260925195033_qualification_veille_studio.sql` — nouvelle table additive `legal_monitoring_qualifications` (`legal_monitoring.sheet_id` de James référence son ancienne table `sheets`, pas `master_sheets` : inutilisable pour le pivot Studio sans se tromper de modèle, donc table à part comme `company_sheet_overrides`). `app/(studio)/veille/[id]/page.tsx` (détail + qualification) et `QualificationForms.tsx` — les deux chemins (`qualifyWithExistingSheet`/`qualifyWithNewSheet`) rendus **ensemble**, sans bascule qui en cacherait un. Statut `legal_monitoring.status` passe à `linked` dans les deux cas.
**Vérifié** : test réel navigateur — les deux formulaires bien visibles simultanément sur une entrée `new` ; rattachement à une fiche existante (Assurance chômage) → statut Qualifiée, lien correct, formulaire de qualification disparaît ; création d'une nouvelle fiche depuis la veille → fiche + version `draft` créées, qualification enregistrée, statut Qualifiée. Migration appliquée via `supabase migration up` (pas de reset complet, pour ne pas perdre un compte utilisateur créé entre-temps) ; tous les objets de test nettoyés individuellement ensuite.

**Contexte** : "Le système doit gérer deux scénarios : si une fiche existe, proposer sa mise à jour ; si aucune fiche adaptée n'existe, proposer la création d'une nouvelle fiche" (§9, CR 17/09) — les deux options doivent être proposées, pas une suggestion unique automatique.

**À faire** : écran de qualification permettant de rattacher l'entrée de veille à une fiche existante (`master_sheet_id`) ou d'en créer une nouvelle, statut passe à `qualified`.

**Critères d'acceptation**

- Les deux chemins (rattacher / créer) sont toujours proposés côté interface, jamais un seul suggéré automatiquement sans alternative.

---

## STU-VEILLE-03 — Lien veille → nouvelle version ✅ Fait

**Priorité : Must** · **Dépendances : STU-VEILLE-02, STU-WORKFLOW-01**
**Réalisé** : `createNewVersion()` (STU-WORKFLOW-04) étendu avec un `legal_monitoring_id` optionnel, tracé sur la version créée. `PrepareVersionButton.tsx` sur l'entrée de veille qualifiée, redirige vers la fiche. `transitionSheetVersion()` fait passer `legal_monitoring.status` à `processed` uniquement au moment réel où le statut cible est `published` (jamais à la préparation — la veille reste "Qualifiée" tant que la version n'est pas effectivement publiée, cohérent avec "sans toucher à la version publiée", §10). Traçabilité ajoutée dans l'historique de fiche : chaque version affiche un lien "Origine : veille — [titre]" quand `legal_monitoring_id` est renseigné.
**Vérifié** : test réel bout en bout — entrée de veille créée, qualifiée sur une fiche existante déjà publiée (`REM-DEMO-004`), "Préparer une nouvelle version" crée bien la version 2 en brouillon et redirige vers la fiche ; parcours complet jusqu'à publication (réutilise le workflow existant) ; la veille passe à "Traitée" seulement après cette publication réelle ; l'historique de la fiche affiche le lien d'origine vers l'entrée de veille, qui ramène bien dessus au clic.

**Contexte** : "Une nouvelle version de la fiche est préparée sans toucher à la version publiée" (§10) ; traçabilité complète attendue de bout en bout.

**À faire** : depuis une entrée de veille qualifiée, bouton "Préparer une nouvelle version" créant une `sheet_versions` en `draft` avec `legal_monitoring_id` renseigné ; passage du statut de veille à `processed` une fois la version publiée.

**Critères d'acceptation**

- Depuis n'importe quelle version publiée, on peut remonter à l'entrée de veille d'origine si elle existe.

---

## STU-VEILLE-04 — Connecteurs automatiques sources officielles

**Priorité : Won't (ce cycle)** · **Dépendances : —**

**Contexte** : déjà ticketé séparément côté James (AUTOMATION-01/02/03, #85-87 — connecteurs 7 sources, analyse IA, route planifiée 10h30). Pas dupliqué ici.

**À faire** : rien — se coordonner avec ces tickets existants au moment de la réconciliation, ne pas reconstruire en parallèle.
