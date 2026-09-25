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

## STU-VEILLE-04 — Connecteurs automatiques sources officielles 🟡 Partiellement fait

**Priorité : Must** (reclassé le 25/09/2026 à la demande explicite de l'utilisateur — "on fait tout ce qu'on peut faire, je ne veux pas qu'on laisse des trous") · **Dépendances : —**

**Décision (25/09/2026)** : initialement marqué "Won't" en supposant que le travail était déjà couvert côté James. L'utilisateur a demandé de vérifier et de compléter quand même, sur cette branche personnelle, sans jamais toucher au travail réel de James. Les tickets réels **AUTOMATION-01 (#85), AUTOMATION-02 (#86), AUTOMATION-03 (#87)** ont été récupérés sur son repo GitHub pour ne rien inventer :

- **#86** liste les 7 sources exactes : Légifrance/JORF (API PISTE, OAuth2), BOSS, URSSAF, Code du travail numérique, Ministère du travail, Ameli, BOCC. Même côté James, 6 des 7 connecteurs sont encore au stade "sélecteurs de scraping à définir".
- **#87** demande un vrai appel API Claude (`ANTHROPIC_API_KEY`), schéma JSON documenté (pertinence, type, dates, résumé, impact, thème, mots-clés).
- **#85** demande une route `POST /api/cron/veille` protégée par secret partagé, déclenchée par un cron externe (docker-compose) à 10h30 heure de Paris.

**Réalisé (1re passe)** : `app/api/cron/veille/route.ts` (secret partagé `VEILLE_CRON_SECRET`, testé réel avec/sans/mauvais secret) ; `lib/studio/monitoring-connectors/` — connecteur `ministere-travail.ts` (fetch HTTP réel sur `travail-emploi.gouv.fr/rss.xml`, parseur RSS maison, dédoublonnage sur `link`) et stubs honnêtes pour les 6 autres.

**Correction (25/09/2026, même jour)** : l'utilisateur a signalé que le vrai cahier des charges et le vrai prototype existaient dans `Nouveau dossier/` et à la racine de `LBP_V2/` (`LBP_Cahier_des_charges_et_technique-3.pdf`, `LBP_V2-20.html`) — jamais consultés jusque-là, alors qu'ils contiennent l'annexe de code complète (§5.1) : URLs exactes, sélecteurs CSS précis pour 5 des 6 sources HTML, le prompt système Claude mot pour mot avec son schéma JSON, l'orchestration complète. Revu en conséquence :

- `lib/studio/monitoring-connectors/html-scraping.ts` (nouveau, `cheerio` ajouté en dépendance réelle) — connecteurs BOSS/URSSAF/Code du travail numérique/Ameli/BOCC avec les sélecteurs exacts de l'annexe, pas devinés.
- `lib/studio/monitoring-ai-analysis.ts` — appel réel à l'API Messages Anthropic (contrat connu indépendamment, contrairement à PISTE), prompt système et schéma JSON repris mot pour mot de l'annexe, toujours gardé derrière `ANTHROPIC_API_KEY` (absente, jamais simulé).
- Seul `legifrance.ts`/BOCC-Légifrance restent un stub : le code de référence du cahier des charges lui-même les marque "TODO", personne (ni James, ni nous) ne les a implémentés.

**Non fait — bloqué, pas oublié** : le déclenchement planifié réel à 10h30 (conteneur cron docker-compose) est une préoccupation d'infrastructure de déploiement, absente de ce dépôt local par nature. Légifrance/PISTE et l'analyse IA attendent une clé que l'utilisateur n'a pas fournie (décision explicite du 25/09/2026) — prêtes à s'activer, jamais simulées.

**Vérifié** : test réel via curl — sans secret 401, mauvais secret 401, bon secret 200. Sur les 7 sources : **2 connecteurs réellement actifs et vérifiés** (Ministère du travail via RSS, Ameli via scraping — 10 vrais articles santé récupérés et insérés à chaque fois, contenu réel vérifiable, ex. "Cancer du sein : à partir de 50 ans..." ; dédoublonnage confirmé sur exécution répétée) ; **4 erreurs réelles et précises** (BOSS/URSSAF : `curl -v` confirme un handshake TLS réussi avec certificat valide suivi d'un reset de connexion dès l'envoi de la requête HTTP — signature d'un blocage réseau propre à cet environnement d'exécution, pas une preuve d'indisponibilité réelle ; Code du travail numérique : vrai 404 sur l'URL exacte du cahier des charges, page probablement déplacée depuis ; BOCC/Légifrance : vrai 403, WAF anti-bot) ; **1 "non configuré" honnête** (Légifrance/JORF, API PISTE non implémentée nulle part). Test réel navigateur : panneau de statut des 7 sources affiche les bons états (2 Actif / 4 Erreur / 1 Non configuré).
