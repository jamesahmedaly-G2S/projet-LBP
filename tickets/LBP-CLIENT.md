# LBP-CLIENT — Portail client (app/(client)/)

Chantier distinct du backlog Studio (tickets/STU-*.md, clos) — la vraie
vue "LBP Client" que le cahier des charges décrit en 13 modules (§1.1-1.14
via `docs/G2S-LBP-01.md`), jamais construite ni côté réel ni côté pivot
avant ce chantier. Architecture définie par `docs/ARCHITECTURE.md` §4 :
`app/(client)/` dans le même projet Next.js que `app/(studio)/`, même base
Supabase, ui-kit/ partagé — jamais deux applis séparées.

---

## LBP-CLIENT-00 — Fondations (layout, thème, authentification, premier écran réel) ✅ Fait

**Contexte** : poser la base technique avant d'attaquer les 13 modules un par un — layout, palette visuelle distincte du Studio (exigée par STU-DESIGN-01), authentification, et un premier écran réel bout en bout pour valider que la base tient, plutôt que 13 squelettes vides.

**Réalisé** :

- **Couche de thème partagée** : `ui-kit/` (Button, Card, Badge, Field, LinkButton) consommait des classes Tailwind `studio-*` en dur — refactorisé vers une couche sémantique (`bg-primary`, `text-ink`, `border-border`...) définie dans `app/globals.css`. Valeurs par défaut = alias exact des `studio-*` existants (zéro risque de régression, vérifié : couleur du bouton primaire Studio testée en réel après refactor, `rgb(46, 91, 135)` = `#2E5B87`, identique au pixel près). `.theme-client` redéfinit ces mêmes variables avec la vraie palette du prototype LBP Client (`lib/design-tokens-client.ts`, port 1:1 de `Nouveau dossier/LBP_V2-20.html` lignes 12-33 — sauge/encre/crème, "aucune couleur ajoutée" comme le dit le prototype lui-même).
- `app/(client)/layout.tsx` — chrome statique (pas de vérification de session ici, voir plus bas pourquoi), applique `.theme-client`.
- `lib/auth/session.ts` — `requireClient()` ajouté, pendant de `requireAdmin()` déjà existant.
- `app/(client)/error.tsx` — pendant de `app/(studio)/error.tsx` (session invalide → redirection `/login`, rôle refusé → "Accès refusé" affiché).
- `app/login/actions.ts` — redirection post-login d'un compte `client` pointait vers `/` (placeholder create-next-app jamais remplacé) ; corrigée vers `/bibliotheque`.
- **Premier écran réel : bibliothèque en lecture seule** (`app/(client)/bibliotheque/page.tsx` + `[sheetId]/page.tsx`) — même arborescence Familles → Thèmes → Sous-thèmes → Fiches et même logique d'affectation que le mode "Accéder au LBP du client" déjà construit côté Studio (`app/(studio)/clients/[id]/vue-client/`, STU-CLIENT-04) : `getCompanyAffectations()` réutilisé tel quel.

**Écart architectural trouvé en testant en réel** (pas en le lisant) : `getVisibleLayersForCompany()` (STU-CLIENT-04) interroge `sheet_versions` directement — table strictement admin-only par RLS (`sheet_versions_admin_all`, STU-DATA-02). Pour l'aperçu admin "en tant que client", ça fonctionne (session admin, RLS contournée par `is_admin()`). Pour une vraie session cliente, ça renvoie silencieusement zéro ligne : la fiche s'ouvrait mais restait vide, aucune erreur. `lib/client/sheet-content.ts` (`getSheetLayersForClient()`) corrige ça en interrogeant `client_sheet_content` (STU-DATA-07) — la vue conçue précisément pour une session cliente réelle (filtre CCN/offre déjà appliqué via `current_company_id()`/`current_offer_tier()`), jamais une nouvelle règle de filtrage inventée.

**Non fait — bloqué, documenté, pas masqué** : le surlignage jaune des modifications (STU-WORKFLOW-05) n'est pas branché côté client réel. `getPublishedContentDiff()` a le même problème RLS que ci-dessus, et la version précédente nécessaire au diff est `historized` — un statut que `client_sheet_content` n'expose qu'à `is_admin()`, jamais à un client réel (sa clause `WHERE` ne retient que `status = 'published'` pour un non-admin). Réparable par une extension ciblée de cette vue (exposer la version historisée immédiatement précédente, scopée à la même règle de visibilité) — pas tentée dans cette passe de fondations pour rester dans un périmètre raisonnable.

**Vérifié** : test réel navigateur bout en bout — login réel `c.moreau@alpha.fr` → redirection `/bibliotheque` → nom réel "ALPHA SAS" affiché → ouverture d'une vraie fiche (`Prime d'ancienneté`) → couche régime général affichée avec ses 5 champs réels **et** la couche complémentaire CCN Syntec (ALPHA a cette CCN) affichée en plus, nom de la CCN résolu correctement. Contrôle négatif : `s.bakkali@beta.fr` (BETA, pas la CCN Syntec) sur la même fiche voit le régime général mais **pas** le complément Syntec — confirme un filtrage réel par société, pas un affichage systématique. Contrôle croisé de rôles : un compte admin sur `/bibliotheque` voit "Accès refusé" (pas de crash) ; un compte client sur `/tableau-de-bord` (Studio) pareil. Couleurs réelles vérifiées via `getComputedStyle` : fond de page `rgb(245, 243, 238)` = `#F5F3EE`, header `rgb(24, 24, 24)` = `#181818` — palette client, pas la navy Studio. Régression Studio : `tsc`/`eslint` propres sur tout le repo, les 10 écrans Studio testés en session réelle après le refactor `ui-kit/` (tous 200, couleur du bouton primaire inchangée au pixel près).

**Reste à faire** : les 13 modules du cahier des charges (§1.1-1.14) restent à découper en tickets un par un — cette fondation ne couvre que le module "Bibliothèque Synchro" (#1), en lecture seule, sans encore la recherche/filtre, les favoris, ni les autres modules (veille lecture seule côté client, quiz, demande de montée en gamme — cf. STU-OFFER-02 déjà à moitié faite côté G2S, entretien annuel côté client, etc.).
