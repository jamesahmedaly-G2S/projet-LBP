# STU-OFFER — Offres et droits de contenu

---

## STU-OFFER-01 — Branchement front sur le filtre par couche

**Priorité : Must** · **Dépendances : STU-DATA-06, STU-DATA-07**

**Contexte** : "le moteur doit être conçu pour utiliser le niveau d'offre comme filtre d'accès... Le client ne doit pas pouvoir augmenter artificiellement son niveau d'accès" (§13). Ordre logique : applicabilité → CCN → offre → contrôle G2S → publication.

**À faire** : les pages client de bibliothèque consomment exclusivement `client_sheet_content` (jamais `sheet_versions` en direct), un composant d'affichage clair pour signaler qu'une couche existe mais n'est pas incluse dans l'offre actuelle (incite à la montée en gamme, sans exposer le contenu verrouillé). Brancher `getPublishedContentDiff()`/`diffSheetContent()` (`lib/studio/content-diff.ts`, STU-WORKFLOW-05 — logique faite et testée, aucun rendu visuel encore) pour surligner en jaune les segments modifiés depuis la version précédente.

**Critères d'acceptation**

- Modifier manuellement l'offre affichée côté client (falsification navigateur) n'a aucun effet — le filtrage est vérifié serveur (RLS sur la vue), pas seulement côté affichage.

---

## STU-OFFER-02 — Demande de montée en gamme 🟡 Partiellement fait

**Priorité : Should** · **Dépendances : STU-DATA-06**

**Réalisé (côté G2S, dans le Studio)** : `offer_change_requests` n'existait que dans la modélisation (`Nouveau dossier/Modelisation-BDD-LBP.md` lignes 575-584/744-749), jamais créée en base — migration `20260928110000_demandes_montee_en_gamme.sql` reprenant l'enum/table/policies telles que spécifiées. Bloc "Demandes de montée en gamme" ajouté à `/administration` (nom du palier via `offer_tiers`, société et demandeur via les embeds PostgREST, statut avec badge), actions `markOfferRequest()` (`administration/actions.ts`) pour Marquer contacté/Clôturer — ne touche jamais `companies.offer_tier`, uniquement `offer_change_requests.status`.

**Non fait — bloqué, pas oublié** : le bouton côté client ne peut pas exister, comme pour STU-OFFER-01 — aucune page du portail LBP Client (13 modules du dossier) n'est construite sur ce dépôt, réel ou pivot (confirmé via `git ls-tree -r origin/main`). Pour démontrer l'écran G2S sans ce bouton, `supabase/seed.sql` insère une demande de démonstration réaliste (ALPHA SAS / Camille Moreau, palier 2→3, `pending`) — un commentaire dans le seed explicite que c'est une simulation de ce que le bouton insérerait.

**Vérifié** : test réel navigateur (session admin réelle) — `/administration` affiche bien "ALPHA SAS", "La Branche → Le Référentiel", badge "En attente" ; clic sur "Marquer contacté" fait bien passer le badge à "Contacté" et fait disparaître le bouton (`revalidatePath`), aucune erreur console. Base reremise à `pending` après le test pour garder une donnée de démonstration cohérente au prochain `db:reset` (le seed la recrée de toute façon).

**Contexte** : "Il peut demander une évolution d'offre ; G2S conserve le contrôle" (§13) — mécanisme déjà conçu dans la modélisation (`offer_change_requests`).

**À faire** : bouton côté client déclenchant une demande, écran G2S pour la traiter (contacté/clôturée).

**Critères d'acceptation**

- Une demande n'a aucun effet automatique sur `companies.offer_tier` — seule une action explicite de G2S change le palier.
