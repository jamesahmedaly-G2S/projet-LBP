# STU-DASH — Tableau de bord Studio

---

## STU-DASH-01 — KPI de pilotage ✅ Fait

**Priorité : Should** · **Dépendances : STU-DATA-01, STU-DATA-02, STU-CLIENT-02**

**Contexte** : "L'ouverture du Studio doit répondre immédiatement à la question : 'Qu'est-ce que G2S doit traiter aujourd'hui ?'" (§4) — clients actifs, fiches publiées, MAJ à traiter, validations en attente.

**Réalisé** : `app/(studio)/tableau-de-bord/page.tsx` — port de `stDash()`, devenu la vraie page d'accueil (logo, `/login` pour un admin, onglet "Tableau de bord" de la navigation). Écart volontaire et documenté par rapport au prototype : celui-ci gonfle artificiellement plusieurs chiffres (`+5`, `+7`, `CLIENTS.length*4+2`...) pour paraître plus actif en démo — remplacé par 4 comptages réels (`companies`, `master_sheets.status='published'`, `legal_monitoring.status='new'`, `sheet_versions.status='review'`), chacun identique à ce qu'on obtient en filtrant l'écran détaillé correspondant.

**Vérifié** : test réel navigateur — connexion admin redirige bien vers `/tableau-de-bord` ; les 4 tuiles cliquables mènent aux bons écrans ; chiffres confirmés cohérents avec `/clients`, `/referentiel`, `/veille`, `/referentiel/controle`.

**Critères d'acceptation**

- Chaque chiffre correspond exactement à ce qu'on retrouve en filtrant les écrans détaillés correspondants (pas de logique de calcul divergente).

---

## STU-DASH-02 — Blocs à traiter / activité récente ✅ Fait

**Priorité : Could** · **Dépendances : STU-DASH-01, STU-WORKFLOW-02**

**Contexte** : "À traiter", "Entretiens clients", "Dernières publications", "Alertes", "Activité récente" (§4).

**Réalisé** : sur la même page — "À traiter" (veille à analyser, fiches à valider, clients sans réponse au questionnaire, clients potentiellement impactés par les validations en attente via `getImpactedCompanies()`, STU-WORKFLOW-03, jamais une deuxième implémentation) ; "Entretiens à venir" (réutilise `summarizeEntretiens()`/`EntretienCell`, STU-CLIENT-02/03) ; "Dernières publications" (`sheet_versions.status='published'`, mêmes données que `/publications`) ; "Alertes" réelles (CCN non renseignée, entretien en urgence — jamais une condition inventée, les deux autres alertes du prototype `quest.statut!=='ok'` et `specifics.length` n'ont pas d'équivalent réel dans notre schéma, omises plutôt que fabriquées) ; "Activité récente" composée d'événements réellement horodatés (publications, overrides manuels, entretiens réalisés) — aucune table de journal d'activité dédiée n'existe dans le schéma réel, comme déjà constaté en construisant l'historique client (STU-CLIENT-02) ; n'en crée pas une nouvelle, se contente d'agréger ce qui existe déjà.

**Correctif important trouvé en vérifiant cet écran** : les embeds PostgREST `sheet_versions.select("...,master_sheets(title)")` (et `ccn_catalog(name)`, et `profiles.select("...,companies(offer_tier)")` dans `lib/auth/session.ts`) étaient partout lus comme des **tableaux** (`?.[0]?.title`), alors qu'une vraie FK to-one renvoie un **objet unique** à l'exécution — vérifié en réel via une requête authentifiée directe. Ce n'était pas une supposition ponctuelle : un commentaire dans `lib/auth/session.ts` affirmait explicitement (et à tort) que "le client infère les relations comme des tableaux même pour une FK to-one", ce qui a fait passer inaperçu que **`session.profile.offer_tier` n'a jamais été résolu pour aucune session cliente réelle** (toujours `null`, silencieusement) — resté invisible faute d'écran côté client qui le consulte jusqu'ici. Corrigé dans 6 endroits : `lib/auth/session.ts`, `lib/studio/client-view.ts`, `lib/studio/client-fiche.ts` (2 fonctions), `clients/[id]/historique/page.tsx`, `tableau-de-bord/page.tsx`. Recherché exhaustivement dans tout le code pour ne pas en laisser d'autre.

**Vérifié** : test réel navigateur après correctif — le nom réel de la CCN s'affiche enfin dans le mode "Accéder au LBP du client" (`SYNTEC — BUREAUX D'ÉTUDES TECHNIQUES`, plus le simple code IDCC) ; le titre réel de la fiche s'affiche dans l'historique client et dans "Dernières publications"/"Activité récente" du tableau de bord (auparavant "?" partout).

**Critères d'acceptation**

- Reporté sans risque si le temps manque — n'empêche aucun des scénarios A-F d'être démontré.
