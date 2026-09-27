# STU-CLIENT — Gestion clients (assistant + fiche + vue client)

---

## STU-CLIENT-01 — Assistant guidé de création client ✅ Fait

**Priorité : Must** · **Dépendances : STU-CCN-02, STU-QUEST-02, STU-AFFECT-01, STU-WORKFLOW-03**

**Contexte** : scénario A en entier, wizard à 8 étapes (§6) : Entreprise → Établissements → Questionnaire & CCN → Calcul automatique → Contrôle G2S → Validation → Publication → Accès client. "G2S crée le client et remplit le questionnaire ; le client ne remplit pas lui-même l'onboarding."

**Déclencheur (27/09/2026)** : l'utilisateur a signalé l'absence des boutons "+ Nouveau client" et "Quitter le Studio" dans l'en-tête (`.st-head-actions`, `LBP_V6_Studio.html`, `startWizard()`/`closeStudio()`). Le premier ouvre cet assistant ; le second, en attendant la vue "LBP Client" (STU-CLIENT-04, hors périmètre ici), déclenche une vraie déconnexion Supabase Auth — fonctionnalité qui n'existait nulle part (`app/login/actions.ts`, `logout()`), jusqu'ici explicitement hors périmètre de STU-AUTH-01.

**Écart d'architecture volontaire** : le prototype garde tout l'assistant en mémoire côté client (`var wz={...}`) et n'écrit qu'à l'étape 6. Notre Studio est entièrement serveur (Server Components/Actions) : la société est créée dès l'étape 1 (`companies`, nouvelle policy insert admin, cf. migration `20260927193000_wizard_creation_client.sql`) et chaque étape suivante écrit directement les vraies tables au fil de l'eau — ce qui permet à l'étape 4 d'interroger la vraie vue `company_sheet_affectations` plutôt que de dupliquer le calcul en JS.

**Réalisé** :

- Étape 1 (`/clients/nouvelle`) — création réelle de `companies` (raison sociale, `offer_tier` depuis `offer_tiers`).
- Étape 2 (`/clients/nouvelle/[id]/2`) — `establishments` (nom/adresse, lignes dynamiques).
- Étape 3 (`/clients/nouvelle/[id]/3`) — réutilise **tel quel** `CcnSection` (STU-CCN-02) et `QuestionnaireForm` (STU-QUEST-02), comme ces deux tickets l'annonçaient déjà.
- Étape 4 (`/clients/nouvelle/[id]/4`) — KPIs calculés depuis la vraie vue `company_sheet_affectations` (`getCompanyAffectations`, STU-AFFECT-01) ; bloque la suite tant qu'aucune CCN n'est sélectionnée (port du `alert()` du prototype).
- Étape 5 (`/clients/nouvelle/[id]/5`) — réutilise **tel quel** `AffectationList` (retrait inline) et `AddOverrideForm` (ajout, STU-AFFECT-03, motif obligatoire).
- Étape 6 (`/clients/nouvelle/[id]/6`) — relecture pure (rien à écrire, la société existe déjà).
- Étape 7 (`/clients/nouvelle/[id]/7`) — `companies.published_at` (colonne ajoutée par la migration), "le seul moment où les contenus entrent dans l'espace client", jamais un écran sans effet.
- Étape 8 (`/clients/nouvelle/[id]/8`) — `supabase.auth.admin.inviteUserByEmail()` (service_role, `lib/supabase/service-role.ts`) avec `company_id`/`full_name` en métadonnées ; `handle_new_user()` (trigger existant) crée `profiles` (role `client`, statut `invited`) sans aucun insert manuel.
- `lib/studio/wizard-steps.ts` (`WZ_STEPS`, `getWizardCompany()`), `app/(studio)/_components/WizardStepper.tsx` et `WizardNav.tsx` (port visuel de `.st-stepper`/`wzNav()`).

**Vérifié** : test réel navigateur bout en bout, les 8 étapes dans l'ordre, avec une vraie session admin — société "TEST WIZARD SAS" créée, 2 établissements enregistrés, 1 CCN sélectionnée, étape 4 affichant les vrais KPIs (6 fiches proposées, 1 CCN retenue) depuis la vraie vue, étape 6 récapitulant les vraies données, publication confirmée (`published_at` réel en base), invitation envoyée — confirmé en base (`profiles.status = 'invited'`) **et** via Mailpit (`/api/v1/messages`, local, remplace Inbucket dans cette version de la CLI Supabase) : un vrai e-mail "You've been invited" reçu à l'adresse saisie. Toutes les données de test nettoyées après vérification (cascade réelle `companies` → `establishments`/`company_ccns`, utilisateur Auth supprimé).

**Critères d'acceptation**

- Rejoue exactement le scénario A : création société + 2 établissements + 2 CCN + réponses au questionnaire + proposition d'affectation calculée + retrait d'1 fiche et ajout manuel d'1 fiche + validation + publication + accès à la vue client final.
- Aucune étape ne peut être sautée sans que la précédente soit complète.

---

## STU-CLIENT-02 — Fiche client complète ✅ Fait

**Priorité : Must** · **Dépendances : STU-CCN-02, STU-AFFECT-02, STU-WORKFLOW-04, STU-DATA-08**

**Contexte** : §5.2 — identité, établissements, offre, utilisateurs, CCN, questionnaire, fiches affectées, contenus spécifiques, mises à jour en attente, historique, bloc "Suivi annuel".

**Réalisé** : `lib/studio/settings.ts` (`STUDIO_SETTINGS`, port 1:1 de `ST_CFG` — `entretienSeuilRouge:15`, `entretienSeuilJaune:60`, `entretienPeriodeMois:12`) et `lib/studio/entretien.ts` (`summarizeEntretiens()`, port de `entretienColor()`/`daysUntil()`/`addMonths()`) — source unique, réutilisée par la fiche client ET la liste clients (STU-CLIENT-03). Écart assumé par rapport au prototype : celui-ci ne connaît qu'un `lastEntretien` unique ; notre `company_interviews` réel (STU-DATA-04) garde un historique à statut explicite (`to_plan`/`planned`/`done`/`late`) — `summarizeEntretiens()` en déduit le dernier entretien réellement fait et le prochain à échéance (un entretien planifié explicite prime, sinon calcul automatique depuis le dernier fait, sinon `tone: null` si aucune donnée plutôt qu'une couleur inventée). `EntretienSuiviBlock.tsx` (bloc "Suivi annuel", 4 cases + barre de couleur — **aucune classe d'animation/blink**, conformément à l'exigence explicite du §5.2). Page `clients/[id]/page.tsx` réécrite avec toutes les sections : établissements, utilisateurs (`profiles` role=client), CCN (STU-CCN-02, inchangé), questionnaire (dernière réponse réelle, `company_questionnaire_answers` — pas de statut "à revoir" fabriqué, notre schéma ne le distingue pas), fiches affectées (STU-AFFECT-02/03, inchangé), contenus spécifiques entreprise (`sheet_versions` `layer_kind='ent'`, réutilise la couche déjà existante — `lib/studio/client-fiche.ts`), mises à jour en attente (`sheet_versions` `status in ('review','valid')` sur les fiches actuellement affectées). `clients/[id]/historique/page.tsx` (port de `stOpenHisto()`) : timeline réelle construite à partir des seuls événements réellement horodatés (création, publication, overrides manuels avec motif, contenus spécifiques, entretiens réalisés) — pas de table d'historique/publications par client recréée hors périmètre. Bouton "Accéder au LBP du client" ajouté mais grisé (STU-CLIENT-04, pas encore construit), cohérent avec le principe déjà établi (StudioNav) de ne jamais pointer vers un écran inexistant.
**Correctif seed** : `companies.published_at` ajouté pour ALPHA/BETA/GAMMA (dates reprises de `createdAt` dans `LBP_V6_Studio.html`, `CLIENTS`) — ces 3 sociétés de démo sont des clients déjà établis, pas des configurations en cours.

**Vérifié** : test réel navigateur sur les 3 sociétés de démo (déjà seedées avec les 3 scénarios vert/jaune/rouge) — ALPHA (entretien fait 12/01/2026, 107 jours restants, "À JOUR"), BETA (38 jours, "À ANTICIPER"), GAMMA (aucun entretien jamais réalisé, uniquement un `late` planifié le 01/10/2025, 361 jours de retard, "URGENT", "Dernier entretien" affiché "—" plutôt qu'une date fabriquée). Historique d'ALPHA confirmé réel : création, ajout manuel avec motif, entretien réalisé, publication — tous avec leurs vraies dates.

**Critères d'acceptation**

- Modifier un seuil de couleur (rouge/jaune) à un seul endroit change le comportement partout où il est utilisé (fiche client + liste clients + vue globale entretiens).
- Pas de clignotement sur l'état rouge (exigence explicite du dossier, §5.2).

---

## STU-CLIENT-03 — Liste clients avec code couleur des entretiens ✅ Fait

**Priorité : Must** · **Dépendances : STU-CLIENT-02**

**Contexte** : §5.1 — "ne pas ajouter une colonne 'État'. La couleur est portée directement par la cellule 'Prochain entretien'."

**Réalisé** : `clients/page.tsx` réécrit en vrai tableau (entreprise, offre, CCN, questionnaire, fiches, prochain entretien) ; `EntretienCell.tsx` — port exact de `.st-pill` (`stClients()`) : pastille pleine colorée, format identique au prototype ("date · Xj" ou "date · +Xj" si en retard), **réutilise `summarizeEntretiens()`/`getEntretienTone()` de STU-CLIENT-02, aucune deuxième implémentation du calcul**.

**Vérifié** : test réel navigateur — les 3 pastilles s'affichent vert/ambre/rouge exactement comme sur la fiche client de chaque société, format "12/01/2027 · 107 j" / "04/11/2026 · 38 j" / "01/10/2025 · +361 j" confirmé identique au prototype.

**Critères d'acceptation**

- Aucune colonne "État"/"Statut" distincte de la cellule "Prochain entretien" n'existe dans ce tableau.

---

## STU-CLIENT-04 — Mode "Accéder au LBP du client" ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-07, STU-CLIENT-02**

**Contexte** : scénario F — "afficher le LBP exactement tel que le client le voit, avec un bandeau persistant... et un bouton 'Retour au LBP Studio'" (§5.3).

**Écart d'architecture nécessaire** : `client_sheet_content` (STU-DATA-07) applique la bonne règle via RLS, mais pour la session du **client connecté** (`current_company_id()`) — un admin qui prévisualise "en tant que" une société précise ne peut pas passer par cette vue : `is_admin()` y court-circuite tout, il verrait l'intégralité du contenu, pas ce qu'un vrai client de cette société verrait. `lib/studio/client-view.ts` (`getVisibleLayersForCompany()`) reproduit donc la même règle métier, paramétrée par un `companyId` explicite plutôt que par la session — en réutilisant `getOfferTierLayers()` (STU-DATA-06, déjà écrit pour cet usage), jamais une nouvelle règle inventée.

**Réalisé** :

- `clients/[id]/vue-client/layout.tsx` — bandeau persistant ambré "MODE VISUALISATION CLIENT — Vous consultez actuellement le LBP de [Entreprise]" + bouton "Retour au LBP Studio", enveloppant toutes les pages de ce mode (aucune page ne peut y échapper, c'est un layout Next.js, pas une bannière ajoutée page par page).
- `clients/[id]/vue-client/page.tsx` — arborescence Familles → Thèmes → Sous-thèmes → Fiches, même structure que `/referentiel` (STU-REF-01) mais limitée aux fiches publiées, sans aucun contrôle d'édition.
- `clients/[id]/vue-client/[sheetId]/page.tsx` — fiche réellement filtrée : couche régime général (toujours visible) puis, selon les vraies CCN et l'offre réelle de la société, les couches complémentaires applicables (`ccn`/`ent`/`proc`) en sections distinctes et labellisées — jamais fusionnées en un seul texte inventé.
- **STU-WORKFLOW-05 branché ici** (comme prévu par ce ticket et par STU-WORKFLOW-05 lui-même) : `getPublishedContentDiff()` appliqué sur la couche régime général, chaque `DiffSegment` changé rendu en surbrillance jaune (`bg-yellow-200`).
- Bouton "Accéder au LBP du client" (fiche client, précédemment grisé "pas encore construit") maintenant actif, lien réel vers ce mode.
- **Correctif seed** (trouvé en construisant cet écran) : les versions `rg`/`ccn` de démonstration n'avaient que le champ `essentiel` rempli sur les 5 attendus (`SheetContent`) — invisible côté admin (`EditContentForm` affiche juste un textarea vide, sans erreur), mais rendait 4 des 5 sections visiblement vides dans une vraie lecture intégrale. Corrigé dans `supabase/seed.sql`, même convention "contenu de démonstration" que le champ déjà présent — jamais un texte qui ressemble à une vraie règle rédigée.
- `SHEET_CONTENT_FIELDS` (libellés des 5 niveaux) extrait de `EditContentForm.tsx` vers `lib/studio/placeholder-content.ts` — source unique, réutilisée par le formulaire d'édition ET cette vue en lecture seule.

**Vérifié** : test réel navigateur — bandeau confirmé présent avec le vrai nom de société sur la liste ET sur une fiche ; ALPHA (CCN 1486 + offre incluant les conventions) voit bien la section "Complément conventionnel — [nom CCN]" en plus du régime général, avec les 5 champs réellement remplis ; BETA (n'a pas cette CCN) ne voit **pas** cette section sur la même fiche — confirme que le filtrage par société fonctionne réellement, pas un affichage systématique. "Retour au LBP Studio" ramène bien à la fiche client, sans bandeau résiduel.

**Critères d'acceptation**

- Ce mode n'accorde aucun droit d'écriture supplémentaire — il affiche exactement ce que verrait un vrai profil client de cette société, en lecture.
- Le bandeau est visible sur toutes les pages consultées dans ce mode, sans exception.
