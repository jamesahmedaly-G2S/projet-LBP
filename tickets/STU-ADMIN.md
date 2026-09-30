# STU-ADMIN — Administration Studio

Epic ajouté après coup : l'onglet "Administration" figurait dans la navigation Studio (§3 du dossier) sans qu'aucun ticket ne le couvre nulle part — trou complet, corrigé à la demande explicite de ne rien laisser de côté.

---

## STU-ADMIN-01 — Comptes G2S, paramètres globaux, journal d'activité ✅ Fait

**Priorité : Must** · **Dépendances : STU-DATA-01**

**Contexte** : §15 du dossier — "Gestion des utilisateurs Studio. Paramètres globaux : délais d'entretien, statuts, seuils de couleur, paramètres de publication. Journal d'activité. Préparer la gestion future de droits sans l'imposer visuellement aujourd'hui." Le cahier de gouvernance confirme : pour la V1, tous les utilisateurs Studio ont les mêmes droits (pas de RBAC fin tant que la matrice n'est pas tranchée par Pauline) — cet écran ne doit donc pas introduire de rôles différenciés.

**À faire** : écran `/administration` en 3 blocs :

1. **Comptes G2S** : liste des profils `role='admin'` (nom, email, statut) — lecture seule pour cette V1, pas de gestion de droits fins (conforme au principe KISS déjà acté).
2. **Paramètres globaux** : à ce stade, uniquement ceux réellement utilisés par du code déjà construit (aucun pour l'instant — les seuils de couleur d'entretien et délais de publication n'existent pas encore tant que STU-CLIENT-03/STU-INTERVIEW ne sont pas faits). Section affichée mais vide/"à venir" plutôt que d'inventer des réglages fictifs.
3. **Journal d'activité** : dernières transitions de statut (`sheet_versions` triées par `created_at`/mise à jour récente) — pas de table de log dédiée à ce stade, dérivé des données existantes.

**Réalisé** : `app/(studio)/administration/page.tsx` en 3 blocs. **Comptes G2S** : `profiles where role='admin'`, email résolu via `service-role.auth.admin.getUserById()` (STU-CLIENT-01, réutilisé), statut, un seul niveau d'accès affiché. **Paramètres globaux** : contrairement à la version initiale du ticket (écrite avant STU-CLIENT-02/STU-INTERVIEW, qui prévoyait une section vide "à venir" faute de code réel à refléter), ces seuils existent désormais réellement (`lib/studio/settings.ts`, `STUDIO_SETTINGS`) et sont affichés tels quels — en lecture seule pour cette V1 (les rendre éditables impliquerait de déplacer ces seuils vers une vraie table, un chantier distinct, hors périmètre de ce ticket qui ne demandait que l'affichage). **Journal d'activité** : `lib/studio/activity.ts` (`getRecentActivity()`), extrait du tableau de bord (STU-DASH-02) pour être réutilisé ici sans duplication — un seul endroit qui agrège les événements réellement horodatés (publications, overrides manuels, entretiens réalisés).
**Vérifié** : test réel navigateur — les 2 vrais comptes admin (Nicolas Seck, Pauline Letourneur) listés avec leurs vrais emails et statuts ; les 4 seuils réels affichés (15j/60j/12 mois/0j) ; 10 événements réels du journal d'activité, identiques à ceux du tableau de bord.

**Critères d'acceptation**

- Accessible depuis la navigation Studio.
- Aucun contrôle de rôle différencié n'apparaît dans l'interface (un seul niveau "admin" visible, conforme à la décision Note de cadrage p.13).
- Le journal d'activité reflète une transition de statut réelle effectuée ailleurs dans l'app (ex. via STU-WORKFLOW-01) sans duplication de données.

---

## STU-ADMIN-02 — RBAC à 5 rôles (décision consciente à trancher, pas à construire maintenant)

**Ajouté (30/09/2026)**, suite à l'audit de `LBP_V9.9_Studio.html`. `stAdmin()` (L.9846) montre un vrai écran de gestion des comptes Studio avec 5 rôles réels (`super`/`admin`/`redac`/`valid`/`lecture`, objet `ROLES` L.4567 — CRUD utilisateur complet, des noms réels dans la maquette : Pauline Letourneur en super admin, une rédactrice, un alternant en lecture seule).

**Ce n'est pas une régression ni un oubli** : le cahier des charges technique V9.4 §14.1 dit explicitement "la V1 Studio peut conserver des droits homogènes pour les utilisateurs internes autorisés, mais le modèle doit permettre sans refonte des rôles administrateur/rédacteur/validateur/commercial" — c'est-à-dire que rester au modèle binaire admin/client (décision Note de cadrage p.13, STU-ADMIN-01) est toujours conforme, tant que la table `profiles.role` ne bloquerait pas une évolution future. Le fichier `docs/adr/0004-modele-de-roles-a-2-valeurs.md` est référencé par le code (`lib/auth/session.ts`, `app/api/profiles/route.ts`) mais n'existe pas réellement sur disque (seul `docs/adr/0004-baseline-schema-reel-et-conventions-anglaises.md` existe, numérotation divergente) — dette de documentation à corriger séparément, indépendante de la question RBAC elle-même.

**À faire, si et seulement si validé par Pauline** : passer `profiles.role` d'un simple `admin`/`client` à une énumération à 5 valeurs, avec RLS différenciée par rôle. Ne pas construire tant que ce n'est pas une demande explicite — un chantier de cette taille mérite d'être choisi, pas déduit d'une maquette.
