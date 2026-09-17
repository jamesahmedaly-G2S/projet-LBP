# LBP — Livre Blanc de la Paie

Application web du Livre Blanc de la Paie : Next.js (App Router) +
Supabase. Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) pour
l'architecture cible et [`docs/G2S-LBP-01.md`](docs/G2S-LBP-01.md) pour le
cahier technique de gouvernance.

## Prérequis

- Node.js 20 ou supérieur
- npm 10 ou supérieur

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

`npm install` installe aussi les hooks Git locaux (voir
[Contribuer](#contribuer) ci-dessous) via le script `prepare`.

## Démarrage avec Docker

```bash
docker compose -f docker-compose.dev.yml up
```

Ouvrir [http://localhost:3000](http://localhost:3000) — le rechargement à
chaud fonctionne sur les fichiers modifiés depuis l'hôte. Le conteneur de
développement utilise webpack plutôt que Turbopack (voir
[`docs/adr/0003-docker-dev-utilise-webpack.md`](docs/adr/0003-docker-dev-utilise-webpack.md)
pour la raison).

L'image de production (`Dockerfile`, build standalone Next.js) se construit
avec `docker build .` : elle ne contient pas les dépendances de
développement et tourne avec un utilisateur non privilégié.

## Scripts disponibles

| Script                   | Effet                                                 |
| ------------------------ | ----------------------------------------------------- |
| `npm run dev`            | Serveur de développement Next.js                      |
| `npm run build`          | Build de production                                   |
| `npm run start`          | Sert le build de production                           |
| `npm run lint`           | ESLint sur tout le dépôt                              |
| `npm run format`         | Reformate le dépôt avec Prettier                      |
| `npm run format:check`   | Vérifie le formatage sans le modifier (utilisé en CI) |
| `npm run supabase:start` | Démarre le stack Supabase local (Docker)              |
| `npm run supabase:stop`  | Arrête le stack Supabase local                        |
| `npm run db:reset`       | Recrée la base locale et rejoue toutes les migrations |
| `npm run migration:new`  | Crée un nouveau fichier de migration horodaté         |

## Base de données (Supabase)

Migrations SQL versionnées dans `supabase/migrations/`. Procédure complète
(créer une migration, la tester en local, la déployer sur staging puis
production) : voir [`docs/supabase/MIGRATIONS.md`](docs/supabase/MIGRATIONS.md).

## Structure du dépôt

```
.
├── app/            # Next.js App Router — pages, routes API (app/api/**/route.ts), Server Actions
├── packages/
│   └── shared/     # Workspace npm @lbp/shared — schémas Zod et types partagés
├── docs/
│   ├── ARCHITECTURE.md    # Architecture cible détaillée
│   ├── G2S-LBP-01.md      # Cahier technique de gouvernance
│   ├── front/              # Spécification du prototype existant
│   ├── adr/                # Décisions d'architecture (ADR)
│   └── supabase/           # Procédure de migration
├── supabase/
│   └── migrations/         # Migrations SQL versionnées
└── .github/workflows/      # CI
```

Ce dépôt est un unique workspace npm (`workspaces` dans `package.json`) :
`packages/*` regroupe le code destiné à être partagé au-delà de
l'application Next.js elle-même (mobile en phase ultérieure). Le code
propre à l'application vit dans `app/`.

## Contribuer

Convention de nommage des branches et des commits (Conventional Commits),
hooks Git, et process de décision d'architecture : voir
[`CONTRIBUTING.md`](CONTRIBUTING.md).
