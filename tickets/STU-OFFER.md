# STU-OFFER — Offres et droits de contenu

---

## STU-OFFER-01 — Branchement front sur le filtre par couche

**Priorité : Must** · **Dépendances : STU-DATA-06, STU-DATA-07**

**Contexte** : "le moteur doit être conçu pour utiliser le niveau d'offre comme filtre d'accès... Le client ne doit pas pouvoir augmenter artificiellement son niveau d'accès" (§13). Ordre logique : applicabilité → CCN → offre → contrôle G2S → publication.

**À faire** : les pages client de bibliothèque consomment exclusivement `client_sheet_content` (jamais `sheet_versions` en direct), un composant d'affichage clair pour signaler qu'une couche existe mais n'est pas incluse dans l'offre actuelle (incite à la montée en gamme, sans exposer le contenu verrouillé). Brancher `getPublishedContentDiff()`/`diffSheetContent()` (`lib/studio/content-diff.ts`, STU-WORKFLOW-05 — logique faite et testée, aucun rendu visuel encore) pour surligner en jaune les segments modifiés depuis la version précédente.

**Critères d'acceptation**

- Modifier manuellement l'offre affichée côté client (falsification navigateur) n'a aucun effet — le filtrage est vérifié serveur (RLS sur la vue), pas seulement côté affichage.

---

## STU-OFFER-02 — Demande de montée en gamme

**Priorité : Should** · **Dépendances : STU-DATA-06**

**Contexte** : "Il peut demander une évolution d'offre ; G2S conserve le contrôle" (§13) — mécanisme déjà conçu dans la modélisation (`offer_change_requests`).

**À faire** : bouton côté client déclenchant une demande, écran G2S pour la traiter (contacté/clôturée).

**Critères d'acceptation**

- Une demande n'a aucun effet automatique sur `companies.offer_tier` — seule une action explicite de G2S change le palier.
