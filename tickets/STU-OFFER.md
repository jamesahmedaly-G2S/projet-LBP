# STU-OFFER — Offres et droits de contenu

---

## STU-OFFER-01 — Branchement front sur le filtre par couche 🟡 Partiellement débloqué

**Priorité : Must** · **Dépendances : STU-DATA-06, STU-DATA-07**

**Mise à jour (28/09/2026)** : le portail LBP Client a démarré (LBP-CLIENT-00) — `app/(client)/bibliotheque/` consomme bien exclusivement `client_sheet_content` (jamais `sheet_versions` en direct), premier critère de ce ticket satisfait. Restent non construits : le composant signalant qu'une couche existe mais n'est pas incluse dans l'offre actuelle (nécessite une requête côté admin pour savoir ce qui est masqué, sans l'exposer au client — pas tenté), et le surlignage jaune des modifications (bloqué pour une raison différente, déjà documentée dans `tickets/LBP-CLIENT.md`, LBP-CLIENT-00 : `client_sheet_content` n'expose la version historisée nécessaire au diff qu'à un admin).

**Contexte** : "le moteur doit être conçu pour utiliser le niveau d'offre comme filtre d'accès... Le client ne doit pas pouvoir augmenter artificiellement son niveau d'accès" (§13). Ordre logique : applicabilité → CCN → offre → contrôle G2S → publication.

**À faire** : les pages client de bibliothèque consomment exclusivement `client_sheet_content` (jamais `sheet_versions` en direct), un composant d'affichage clair pour signaler qu'une couche existe mais n'est pas incluse dans l'offre actuelle (incite à la montée en gamme, sans exposer le contenu verrouillé). Brancher `getPublishedContentDiff()`/`diffSheetContent()` (`lib/studio/content-diff.ts`, STU-WORKFLOW-05 — logique faite et testée, aucun rendu visuel encore) pour surligner en jaune les segments modifiés depuis la version précédente.

**Critères d'acceptation**

- Modifier manuellement l'offre affichée côté client (falsification navigateur) n'a aucun effet — le filtrage est vérifié serveur (RLS sur la vue), pas seulement côté affichage.

---

## STU-OFFER-02 — Demande de montée en gamme ✅ Fait

**Priorité : Should** · **Dépendances : STU-DATA-06**

**Réalisé (côté G2S, dans le Studio)** : `offer_change_requests` n'existait que dans la modélisation (`Nouveau dossier/Modelisation-BDD-LBP.md` lignes 575-584/744-749), jamais créée en base — migration `20260928110000_demandes_montee_en_gamme.sql` reprenant l'enum/table/policies telles que spécifiées. Bloc "Demandes de montée en gamme" ajouté à `/administration` (nom du palier via `offer_tiers`, société et demandeur via les embeds PostgREST, statut avec badge), actions `markOfferRequest()` (`administration/actions.ts`) pour Marquer contacté/Clôturer — ne touche jamais `companies.offer_tier`, uniquement `offer_change_requests.status`.

**Réalisé (côté client, une fois le portail LBP Client démarré)** : `app/(client)/offres/` (LBP-CLIENT-07) — `RequestOfferButton.tsx` + `requestOfferChange()` insèrent dans `offer_change_requests`, avec un garde-fou serveur (une seule demande `pending` à la fois par société). Le bouton, noté bloqué le 28/09/2026 faute de portail client, existe maintenant que ce portail a démarré (LBP-CLIENT-00).

**Vérifié** : test réel navigateur (session admin réelle) — `/administration` affiche bien "ALPHA SAS", "La Branche → Le Référentiel", badge "En attente" ; clic sur "Marquer contacté" fait bien passer le badge à "Contacté" et fait disparaître le bouton (`revalidatePath`), aucune erreur console. Côté client (session réelle ALPHA) : demande réellement créée en base, garde-fou vérifié serveur (pas juste masqué à l'affichage) — après création, `/offres` affiche "en attente de traitement" même après un rechargement complet. Base remise à `pending` après chaque test pour garder une donnée de démonstration cohérente au prochain `db:reset` (le seed la recrée de toute façon).

**Contexte** : "Il peut demander une évolution d'offre ; G2S conserve le contrôle" (§13) — mécanisme déjà conçu dans la modélisation (`offer_change_requests`).

**À faire** : bouton côté client déclenchant une demande, écran G2S pour la traiter (contacté/clôturée).

**Critères d'acceptation**

- Une demande n'a aucun effet automatique sur `companies.offer_tier` — seule une action explicite de G2S change le palier.

---

## STU-OFFER-03 — Rendre les 4 offres éditables depuis le Studio

**Priorité : Must** · **Dépendances : —**

**Ajouté (30/09/2026)**, suite à l'audit de `LBP_V9.9_Studio.html`. `stContenus()` traite les offres comme un contenu éditable au même titre que Chiffres Paie/Dictionnaire (brouillon/publié + notification client à chaque évolution, ex. "Notre offre X évolue..."). Chez nous, `lib/studio/offer-tiers.ts` est un **fichier TypeScript en dur** — non éditable sans toucher au code.

**Ce n'est pas un simple manque de finition** : ça contredit directement l'exigence déjà actée cette session (voir tickets/LBP-CLIENT.md, contexte général) — "tout se fait depuis l'espace G2S, Pauline n'a aucune compétence technique et ne touchera jamais à du code ou à une ligne de commande." Les 3 autres écrans "Données de référence" (Chiffres Paie, Dictionnaire, CCN) ont déjà été corrigés sur exactement ce principe ; les offres ont été oubliées.

**À faire** : extraire `StudioOfferTier`/`OFFER_TIERS` vers une vraie table (name/sub/price/users/extraUserPrice/badge/reco/promesse/desc/pourqui/inc/why/foot/cta/cta2/highlight/formula/blocs/note — cf. `lib/studio/offer-tiers.ts` pour la forme exacte des champs), écran admin CRUD sous `/administration` (même famille que chiffres-paie/dictionnaire/ccn/prise-en-main), `getAllStudioOfferTiers()`/`computeOfferPrice()` adaptés pour lire la table au lieu du fichier en dur. Rejoint STU-WORKFLOW-07 pour la notification à la publication.

**Critères d'acceptation**

- G2S peut modifier le prix, la description ou les droits d'une offre depuis `/administration`, sans toucher au code, et voir le changement immédiatement côté client (LBP-CLIENT-07).
