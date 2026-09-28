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
