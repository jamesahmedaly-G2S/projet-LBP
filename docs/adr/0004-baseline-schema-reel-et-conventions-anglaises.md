# 0004 — Baseline du schéma réel, conventions de nommage en anglais

**Statut** : Accepté
**Date** : 2026-09-23
**Pilotes** : Modèle de données & Supabase

## Contexte

Le schéma de base de données a été construit directement sur Supabase
(staging `tppwmwqmldjsjqkdwqmf` et production `cltrtdxhduwhbutdtdbs`, via
un script SQL exécuté dans le SQL Editor du dashboard) en avance sur le
découpage incrémental du backlog par ticket, pour ne pas bloquer
l'avancement pendant que les tickets `DATA-01` à `DATA-13` (et au-delà)
étaient encore en file d'attente. Ce script :

- démarre par `drop schema public cascade` (reset complet du schéma
  `public` — `auth.users` n'est pas affecté, autre schéma) ;
- renomme l'ensemble des tables/colonnes en anglais (`fiches` → `sheets`,
  `raison_sociale` → `company_name`, `poste` → `job_title`, etc.), rupture
  avec le premier jet francisé de la migration DATA-02 initiale ;
- ajoute un module non planifié au backlog : chatbot IA
  (`user_chat_usage`, `chat_conversations`, `chat_messages`,
  `check_and_increment_chat_quota()`), avec un quota mensuel de messages
  par palier d'offre (`offer_tiers.max_messages_per_month`).

Ce script a été exécuté à l'identique sur staging et production. Le dépôt
avait deux migrations antérieures (`enable_pgcrypto`,
`profiles_roles_and_signup_trigger`, cf. ticket `DATA-02` et
`docs/adr/0004-modele-de-roles-a-2-valeurs.md` sur l'autre branche) qui ne
décrivent plus l'état réel des environnements distants.

## Décision

Le dépôt convergent vers la réalité déployée plutôt que l'inverse :

- Les deux anciennes migrations sont supprimées de
  `supabase/migrations/`.
- Une migration unique `baseline_schema_reel` les remplace, capturant
  l'intégralité du schéma tel qu'exécuté sur staging/production.
- Les conventions de nommage anglaises de ce script font foi pour toute
  la suite du projet (tables, colonnes, enums) — la doc et le code
  applicatif à venir doivent s'aligner dessus, pas l'inverse.
- Le module chatbot IA est conservé dans la baseline (il est déjà en
  production) ; un ticket rétroactif devra être écrit pour le documenter
  formellement dans le backlog (non fait à ce jour).

Sur staging et production, seuls les objets SQL existaient déjà
correctement (le script y a été exécuté directement) ; seule la table de
suivi du CLI (`supabase_migrations.schema_migrations`, hors schéma
`public`, donc non affectée par le `drop schema public cascade`) a dû
être resynchronisée manuellement (suppression des 2 anciennes entrées,
insertion de la nouvelle version baseline) via le SQL Editor du dashboard,
la connexion directe du CLI au pooler Postgres ayant été intermittente
depuis ce poste.

## Alternatives considérées

- **Reconstituer l'historique incrémental ticket par ticket** (une
  migration par `DATA-XX`) à partir du script global : écarté, travail de
  reverse-engineering sans valeur ajoutée puisque le schéma cible est déjà
  connu et déployé.
- **Revenir aux noms français** (aligner le script sur l'existant plutôt
  que l'inverse) : écarté, le script est déjà en production ; le
  renommer reviendrait à re-livrer une migration destructive supplémentaire
  sans bénéfice.

## Conséquences

- La migration DATA-02 (nommage français, `is_editor()` alias,
  `profiles.company_id` sans FK) est intégralement obsolète — la branche
  qui la porte ne doit plus être mergée telle quelle ; son travail utile
  (le trigger `handle_new_user()` !) doit être vérifié : **absent** de la
  baseline actuelle, à réintroduire (voir suivi séparé).
- Le backlog (`DATA-01` à `DATA-13` et le module chatbot non planifié)
  doit être revu à la lumière de ce qui est déjà livré, plutôt que
  réimplémenté — voir l'audit de cohérence backlog ↔ schéma déjà produit
  dans cette conversation.
- Toute nouvelle migration doit désormais utiliser les noms anglais de
  cette baseline (`sheets`, `company_name`, `job_title`, etc.), pas les
  noms français de `docs/ARCHITECTURE.md`/`docs/G2S-LBP-01.md` (à mettre à
  jour séparément).
