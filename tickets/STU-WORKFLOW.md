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

## STU-WORKFLOW-04 — Historique de version

**Priorité : Must** · **Dépendances : STU-WORKFLOW-03**

**Contexte** : scénario E — "consulter version actuelle et version précédente, voir auteur, date, motif et clients diffusés".

**À faire** : écran d'historique par fiche/couche, listant chaque version avec auteur, date, motif, statut, et liste des sociétés réceptrices (`sheet_version_recipients`).

**Critères d'acceptation**

- On peut retrouver, pour n'importe quelle fiche publiée au moins deux fois, le contenu exact de la version précédente.

---

## STU-WORKFLOW-05 — Surlignage des modifications côté client

**Priorité : Could** · **Dépendances : STU-WORKFLOW-04**

**Contexte** : amélioration UX mentionnée dans les CR antérieurs (surlignage jaune des passages modifiés) — non indispensable pour dérouler les scénarios A-F.

**À faire** : calcul de diff entre version publiée et version précédente, rendu visuel côté LBP Client.

**Critères d'acceptation**

- Reporté si le temps manque avant le 15/10 — ne bloque aucun scénario de démonstration.

---

## STU-WORKFLOW-06 — Vue globale des publications (onglet dédié)

**Priorité : Must** (ajouté après coup — l'onglet "Publications" de la navigation Studio n'avait aucun écran propre) · **Dépendances : STU-WORKFLOW-03, STU-WORKFLOW-04**

**Contexte** : onglet "Publications" (§3 du dossier) — "Contenus validés, programmés, publiés, clients concernés, historique de diffusion". STU-WORKFLOW-03/04 gèrent la publication et l'historique _par fiche_ ; il manque une vue transverse listant les versions récemment validées/programmées/publiées toutes fiches confondues.

**À faire** : écran `/publications` — liste des `sheet_versions` en statut `valid`, `scheduled` ou `published`, triée par date, avec fiche, couche, auteur, motif, et (pour les publiées) les sociétés réceptrices via `sheet_version_recipients`.

**Critères d'acceptation**

- Accessible depuis la navigation Studio.
- Une version publiée via l'écran fiche (STU-WORKFLOW-01/03) apparaît sans délai dans cette liste — pas de duplication de données, requête directe sur `sheet_versions`.
