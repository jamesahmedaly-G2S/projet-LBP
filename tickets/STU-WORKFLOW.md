# STU-WORKFLOW — Versioning & publication

---

## STU-WORKFLOW-01 — Transitions des 7 statuts ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-02**
**Réalisé** : `lib/studio/workflow-transitions.ts` (graphe pur des transitions valides), `transitionSheetVersion()` dans `app/(studio)/referentiel/actions.ts` (bascule l'ancienne version publiée de la même couche/clé vers `historized`, tient à jour `master_sheets.status` pour la couche `rg`), `WorkflowActions.tsx` (boutons générés depuis le graphe).
**Vérifié** : 3 scénarios réels via navigateur — transition invalide `draft → published` (contournement de l'UI simulé) refusée avec message exact ; chemin complet `draft → review → valid → published` via les vrais boutons ; publication d'une 2e version historise automatiquement la 1re (vérifié en base : jamais deux `published` simultanées, `master_sheets.status` synchronisé).

**Contexte** : `Brouillon → À vérifier → Validé → Programmé → Publié → Historisé → Archivé` (§9) — le client ne voit que la version publiée.

**À faire** : logique de transition (Server Actions) appliquant les enchaînements valides uniquement (pas de saut direct brouillon→publié), avec vérification que la transition vers `published` respecte les index uniques (une seule version publiée par couche/clé).

**Critères d'acceptation**

- Une tentative de transition invalide (ex. `draft` → `published` directement) est refusée avec un message explicite.
- Publier une nouvelle version bascule automatiquement l'ancienne version publiée de la même couche/clé vers `historized`.

---

## STU-WORKFLOW-02 — Écran de contrôle/validation G2S ✅ Fait

**Priorité : Must** · **Dépendances : STU-WORKFLOW-01**
**Réalisé** : `app/(studio)/referentiel/controle/page.tsx` — file d'attente sur `sheet_versions.status = 'review'` (toutes fiches/couches), avec fiche, code, couche (`lib/studio/layer-kind.ts`, nouveau), version, auteur et motif précédent. `ControlActions.tsx` — un seul formulaire, deux boutons `name="target_status"` (comportement natif du submitter HTML, pas de duplication du champ motif). `transitionSheetVersion()` étendu pour écrire dans la colonne `motif` (existante depuis STU-DATA-02, jamais utilisée jusqu'ici) quand elle est fournie. Lien "Contrôle G2S (N)" ajouté en haut de `/referentiel` pour la découvrabilité (pas d'onglet nav dédié dans les 10 sections du dossier).
**Vérifié** : test réel navigateur — 2 fiches de test en `review` créées en base, contrôlées via les vrais boutons : "Valider" → statut `valid` + motif enregistré ; "Renvoyer en brouillon" → statut `draft` + motif enregistré, disparaît de la file. Compteur `/referentiel` (requête directe sur `sheet_versions`, pas sur `master_sheets.status` qui ne reflète que la couche `rg`) synchronisé après chaque action. Un premier test avec sélecteur CSS imprécis (`div.border, div`) avait donné un faux négatif sur le rejet — revérifié avec un sélecteur scopé sur la carte, confirmé correct en base (`sheet_versions.status`/`motif`).

**Contexte** : "G2S contrôle la proposition et peut ajouter ou retirer manuellement des fiches" (§6) ; "Statut À vérifier puis Validé" (§10 veille).

**À faire** : liste des versions en attente de contrôle (`review`), avec action valider/renvoyer en brouillon et champ motif.

**Critères d'acceptation**

- Le tableau de bord (STU-DASH-01) compte correctement les "Validations en attente" à partir de cet écran.

---

## STU-WORKFLOW-03 — Publication (immédiate/programmée) + impacts ✅ Fait

**Priorité : Must** · **Dépendances : STU-WORKFLOW-01, STU-AFFECT-01**
**Réalisé** : `lib/studio/publication-impact.ts` (`getImpactedCompanies()` — rg → toutes sociétés, ccn → sociétés ayant cette CCN et dont le palier l'inclut, ent/proc → la société propriétaire si son palier l'inclut ; recalculé côté serveur, jamais transmis par le client) ; `PublishPanel.tsx` remplace `WorkflowActions` pour les statuts `valid`/`scheduled` — aucun bouton de publication n'existe dans le DOM tant que l'aperçu n'a pas été ouvert (gate structurel) ; `transitionSheetVersion()` étendu pour valider/persister `scheduled_at` (date future obligatoire) et écrire `sheet_version_recipients` au moment réel où le statut passe à `published` (couvre `valid→published` et `scheduled→published`, un seul endroit).
**Vérifié** : test réel navigateur — aucun bouton "Publier" présent avant ouverture de l'aperçu ; publication immédiate d'une fiche `rg` → aperçu liste les 3 sociétés seedées, `sheet_version_recipients` peuplé pour les 3 après clic ; programmation à une date future → statut reste `scheduled`, `scheduled_at` persisté, aucun `sheet_version_recipients` créé tant que non publiée ; date passée refusée avec message explicite. Couches `ccn`/`ent` (sans écran d'auteur — STU-CCN-03 non fait) vérifiées directement via `getImpactedCompanies()` contre les données seedées réelles (`tsx`, client service-role) : CCN 1486 (Syntec) → ALPHA + GAMMA, pas BETA (n'a pas cette CCN) ; couche `ent` exclut ALPHA (palier 2, `includes_agreements=false`) et inclut BETA (palier 3).

**Contexte** : "Une publication peut être immédiate ou programmée" (§9) ; "Toute modification doit recalculer les impacts avant publication" et "Le Studio doit toujours permettre de savoir 'qui verra quoi' avant de publier" (§12).

**À faire** : écran de publication affichant, avant confirmation, la liste des sociétés impactées (calculée via `company_sheet_affectations`/CCN), avec option de programmation (`scheduled_at`).

**Critères d'acceptation**

- Impossible de publier sans avoir vu l'aperçu des clients impactés au préalable.
- Une publication programmée reste en statut `scheduled` jusqu'à l'échéance, sans être visible côté client avant.

---

## STU-WORKFLOW-04 — Historique de version ✅ Fait

**Priorité : Must** · **Dépendances : STU-WORKFLOW-03**
**Réalisé** : `app/(studio)/referentiel/[id]/historique/page.tsx` — toutes les versions d'une fiche (toutes couches, tous statuts), avec auteur, date, motif, statut, sociétés réceptrices (`sheet_version_recipients`) et contenu complet repliable (`<details>`). **Écart nécessaire découvert en testant** : rien n'empêchait jusqu'ici de modifier le contenu d'une version déjà publiée en place (`EditContentForm` toujours affiché, aucune vérification serveur) — ce qui aurait rendu "consulter le contenu exact de la version précédente" impossible à garantir. Corrigé : `updateSheetContent()` refuse désormais toute modification sur une version `published`/`historized`/`archived` (vérifié côté serveur, pas juste caché côté UI) ; nouvelle action `createNewVersion()` — seul chemin pour faire évoluer une fiche diffusée, copie le contenu courant comme point de départ, nouveau numéro de version, statut `draft` ; `NewVersionButton.tsx` remplace le formulaire d'édition une fois la version verrouillée.
**Vérifié** : test réel bout en bout — fiche créée via le vrai formulaire, publiée (v1), contenu verrouillé confirmé (formulaire absent), "Créer une nouvelle version" → v2 en brouillon avec le contenu de v1 copié comme point de départ, modifiée puis republiée (historise v1 automatiquement, STU-WORKFLOW-01) ; `/historique` affiche bien v1 (Historisé, contenu original exact) et v2 (Publié, contenu modifié exact), toutes deux avec leurs sociétés réceptrices. Refus serveur sur version verrouillée re-testé directement via le vrai formulaire (formulaire temporairement réaffiché pour le test, retiré ensuite) : message de refus confirmé.

**Contexte** : scénario E — "consulter version actuelle et version précédente, voir auteur, date, motif et clients diffusés".

**À faire** : écran d'historique par fiche/couche, listant chaque version avec auteur, date, motif, statut, et liste des sociétés réceptrices (`sheet_version_recipients`).

**Critères d'acceptation**

- On peut retrouver, pour n'importe quelle fiche publiée au moins deux fois, le contenu exact de la version précédente.

---

## STU-WORKFLOW-05 — Surlignage des modifications côté client ✅ Fait

**Priorité : Could** · **Dépendances : STU-WORKFLOW-04**
**Réalisé** : `lib/studio/content-diff.ts` — `diffText()` (diff mot-à-mot par LCS, reconstruction exacte garantie), `diffSheetContent()` (les 5 champs d'une fiche), `getPublishedContentDiff()` (résout version publiée + version précédente immédiate même couche/clé, `null` si publiée une seule fois — pas d'erreur, cas normal).
**Branchement visuel (27/09/2026)** : fait dans le mode visualisation (STU-CLIENT-04, `clients/[id]/vue-client/[sheetId]/page.tsx`), comme référencé ici et dans ce ticket depuis le 25/09 — `getPublishedContentDiff()` appelé sur la couche régime général, chaque `DiffSegment` rendu avec `changed ? "bg-yellow-200" : ""`.
**Vérifié** : tests réels contre des vraies lignes publiées en base (`tsx`, `getPublishedContentDiff` via client service-role) — mot modifié isolé correctement surligné, reste du texte intact, reconstruction exacte du texte publié à partir des segments, couche jamais publiée deux fois → `null` sans erreur. Plus une suite de cas limites sur `diffText` (identique, ajout, remplacement, texte totalement différent, depuis vide). Rendu visuel vérifié en navigateur réel via STU-CLIENT-04.

**Contexte** : amélioration UX mentionnée dans les CR antérieurs (surlignage jaune des passages modifiés) — non indispensable pour dérouler les scénarios A-F.

**Critères d'acceptation**

- Reporté si le temps manque avant le 15/10 — ne bloque aucun scénario de démonstration.

---

## STU-WORKFLOW-06 — Vue globale des publications (onglet dédié) ✅ Fait

**Priorité : Must** (ajouté après coup — l'onglet "Publications" de la navigation Studio n'avait aucun écran propre) · **Dépendances : STU-WORKFLOW-03, STU-WORKFLOW-04**
**Réalisé** : `app/(studio)/publications/page.tsx` — requête directe sur `sheet_versions` (statuts `valid`/`scheduled`/`published`), triée par la date la plus pertinente selon le statut (`published_at` ?? `scheduled_at` ?? `created_at`), avec fiche, couche, auteur, motif, et sociétés réceptrices (`sheet_version_recipients`) pour les publiées. Onglet nav "Publications" activé.
**Vérifié** : test réel navigateur — lien de nav cliquable et fonctionnel ; 3 fiches de test (validée/programmée/publiée) toutes affichées avec le bon statut, motif et destinataires (`ALPHA SAS`+`BETA GROUPE`, pas `GAMMA` — vérifié avec un sélecteur scopé à la bonne carte après un premier faux négatif dû à une recherche de texte non scopée) ; une fiche publiée via l'écran fiche (workflow complet) apparaît dans cette liste sans étape supplémentaire, confirmant l'absence de duplication de données.

**Contexte** : onglet "Publications" (§3 du dossier) — "Contenus validés, programmés, publiés, clients concernés, historique de diffusion". STU-WORKFLOW-03/04 gèrent la publication et l'historique _par fiche_ ; il manque une vue transverse listant les versions récemment validées/programmées/publiées toutes fiches confondues.

**À faire** : écran `/publications` — liste des `sheet_versions` en statut `valid`, `scheduled` ou `published`, triée par date, avec fiche, couche, auteur, motif, et (pour les publiées) les sociétés réceptrices via `sheet_version_recipients`.

**Critères d'acceptation**

- Accessible depuis la navigation Studio.
- Une version publiée via l'écran fiche (STU-WORKFLOW-01/03) apparaît sans délai dans cette liste — pas de duplication de données, requête directe sur `sheet_versions`.

---

## STU-WORKFLOW-07 — Pattern brouillon → publication → notification pour les contenus hors référentiel

**Priorité : Should** · **Dépendances : STU-WORKFLOW-01, STU-DATA-02**

**Ajouté (30/09/2026)**, suite à un audit exhaustif de `LBP_V9.9_Studio.html` demandé explicitement par l'utilisateur après une recommandation trop hâtive. V9.9 regroupe Chiffres/Dictionnaire/Actu/Calendrier/Offres sous un même écran `stContenus()` (L.9075) et applique à **chacun** le même pattern : statut brouillon/publié + historique + un appel à `openPublish()` qui crée une vraie notification ciblée aux clients ("Une définition a été ajoutée...", "Notre offre X évolue..."). Côté `projet-LBP/`, ces 5 écrans écrivent tous directement en base sans statut ni notification :

- **Chiffres Paie** (`administration/chiffres-paie/actions.ts`) — écriture directe, aucun brouillon, aucune notification.
- **Dictionnaire** (`administration/dictionnaire/actions.ts`) — simple booléen `published`, aucune notification.
- **Offres** (`lib/studio/offer-tiers.ts`) — **pas admin-éditable du tout**, en dur dans un fichier TypeScript. Contredit directement l'exigence déjà actée cette session : "tout se fait depuis l'espace G2S, Pauline ne touche jamais à du code."
- **Actu/Décrypt** (LBP-CLIENT-04, pas construit) — V9.9 précise en fait 4 statuts (draft/scheduled/published/archived) et un éditeur riche, plus large que ce qui était supposé.
- **Calendrier RH** (LBP-CLIENT-15, pas construit) — même pattern attendu.

**À faire** : un mécanisme de notification-à-la-publication réutilisable (pas 5 implémentations séparées) — table `notifications` déjà réelle côté schéma (cf. cahier V9.4 §12, entité `Notification` : audience/canal/type/titre/contenu/lu/date), à brancher une fois sur chacun des 5 écrans plutôt qu'à réinventer par écran. Offres à sortir du fichier TypeScript en dur vers une vraie table + écran admin, priorité la plus haute des 5 car contredit une exigence déjà validée.

**Critères d'acceptation**

- Publier une modification sur l'un des 5 contenus crée une notification réelle visible côté client (`notifications`), pas un simple changement silencieux de valeur.
- Une seule fonction/service de notification-à-la-publication, réutilisée par les 5 écrans — jamais 5 implémentations distinctes.
