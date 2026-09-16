# Migrations Supabase — procédure

Les migrations SQL sont versionnées dans `supabase/migrations/` et gérées
avec le [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
(installé en devDependency, s'utilise via `npx supabase` ou les scripts npm
ci-dessous). Deux environnements distants existent : **staging** et
**production** (projets Supabase séparés — voir la section Environnements).

## Prérequis

- Docker Desktop démarré (le CLI lance Postgres et les services Supabase en
  conteneurs pour le développement local).
- `npm install` (installe le CLI en local, `supabase/config.toml` déjà
  présent dans le dépôt).

## Workflow quotidien : créer et tester une migration

1. Créer le fichier de migration :

   ```bash
   npm run migration:new -- nom_court_en_snake_case
   ```

   Crée `supabase/migrations/<timestamp>_nom_court_en_snake_case.sql`. Une
   migration = un changement atomique (une table, une contrainte, une
   extension) — pas un fourre-tout de plusieurs changements sans rapport.

2. Écrire le SQL dans ce fichier (DDL uniquement en général : `create
table`, `alter table`, `create policy`, etc.).

3. Démarrer le stack local et vérifier que la migration s'applique sans
   erreur :

   ```bash
   npm run supabase:start
   ```

   Affiche les URLs locales (API, Studio sur `http://127.0.0.1:54323`, DB
   Postgres sur le port 54322) et applique toutes les migrations du dossier
   dans l'ordre de leur timestamp.

4. Vérifier que la migration est **rejouable sur un environnement propre** —
   c'est le test qui doit passer avant toute review :

   ```bash
   npm run db:reset
   ```

   Recrée entièrement la base locale et rejoue `supabase/migrations/*.sql`
   depuis zéro. Si cette commande échoue, la migration n'est pas prête (elle
   dépend probablement d'un état qui n'existe qu'en local, ou n'est pas
   idempotente — préférer `create extension if not exists`, `create table if
not exists`, etc. quand c'est possible).

5. `npm run supabase:stop` pour arrêter le stack local une fois terminé.

## Environnements — staging et production

Deux projets Supabase distincts (créés manuellement sur le dashboard, pas
par ce dépôt) : `lbp-staging` et `lbp-production`. Le lien entre le dépôt et
un projet distant se fait avec `supabase link --project-ref <ref>` :

```bash
npx supabase login              # une fois par poste, ouvre le navigateur
npx supabase link --project-ref <ref-staging>
```

Le dépôt reste lié à **staging** par défaut pour le travail quotidien.
Pour cibler explicitement un autre projet sans changer ce lien par défaut
(notamment la production), passer `--project-ref` sur la commande :

```bash
npx supabase db push --project-ref <ref-production>
```

Ce choix est volontaire : cibler la production doit toujours être un geste
explicite (le ref est écrit dans la commande), jamais la conséquence d'un
`supabase link` oublié.

## Déployer une migration

1. Merger la migration sur `main` après review (elle a déjà été testée en
   local avec `db:reset`, voir ci-dessus).
2. Déployer sur staging :

   ```bash
   npx supabase db push
   ```

   Applique les migrations locales non encore présentes sur le projet lié
   (staging par défaut).

3. Valider fonctionnellement sur staging.
4. Déployer sur production, explicitement :

   ```bash
   npx supabase db push --project-ref <ref-production>
   ```

## Convention de nommage

`<timestamp>_<verbe>_<objet>.sql`, généré automatiquement par `migration:new`
— ne pas renommer un fichier de migration après coup (le timestamp fait foi
de l'ordre d'application, un renommage désynchronise l'historique appliqué
sur les environnements distants).

## À ne jamais faire

- Modifier une migration déjà appliquée sur staging ou production — créer
  une nouvelle migration corrective à la place.
- Committer les clés `service_role` ou le mot de passe de la base (voir
  gestion des secrets du projet, hors périmètre de ce document).
