# 0003 — Le conteneur de développement Docker utilise webpack, pas Turbopack

**Statut** : Accepté
**Date** : 2026-09-16
**Pilotes** : Infrastructure & Setup (`INFRA-02`)

## Contexte

`next dev` utilise Turbopack par défaut depuis Next.js 16. Testé sur cette
machine (Windows, dépôt synchronisé OneDrive, Docker Desktop), le watcher de
fichiers de Turbopack ne redétecte pas fiablement les changements faits sur
un fichier monté en volume Docker depuis l'hôte : ni son mode natif
(évènements du système de fichiers), ni son mode polling
(`watchOptions.pollIntervalMs` dans `next.config.ts`, testé explicitement)
ne rechargent la page après une modification du code — dans un cas la
recompilation ne se déclenche même pas, dans l'autre elle se déclenche mais
sert un contenu périmé.

De plus, `watchOptions.pollIntervalMs` s'applique globalement (il n'existe
pas d'option Turbopack dédiée dans `next.config.ts` pour ne l'activer que
dans Turbopack) : l'activer casse le rechargement à chaud natif en dehors de
Docker sur cette machine (vérifié). Il est donc conditionné par la variable
d'environnement `DOCKER_DEV`, définie uniquement dans
`docker-compose.dev.yml`.

## Décision

`docker-compose.dev.yml` lance `next dev --webpack` plutôt que le `next dev`
par défaut. Le polling de webpack (`watchOptions.pollIntervalMs`, actif
seulement quand `DOCKER_DEV=true`) recharge fiablement la page après
modification d'un fichier monté en volume — testé à plusieurs reprises.

Le développement natif (hors Docker, `npm run dev`) continue d'utiliser
Turbopack par défaut, sans `watchOptions` actif : c'est l'environnement où
il fonctionne correctement et le plus rapide des deux.

## Alternatives considérées

- **Turbopack + polling partout** : rejeté, casse le rechargement à chaud
  natif sur cette machine (voir Contexte).
- **Turbopack sans polling dans Docker** : rejeté, ne détecte aucun
  changement de fichier monté en volume.
- **Déplacer le dépôt hors de OneDrive / hors Windows pour le développement
  Docker** : écarté comme solution à ce ticket — contrainte d'environnement
  du poste de travail, pas du projet ; à réévaluer si l'équipe standardise
  un environnement de développement différent.

## Conséquences

- Le conteneur de développement Docker n'utilise pas le bundler par défaut
  de Next.js — si un comportement diffère entre webpack et Turbopack
  (rare, mais documenté dans `docs/ARCHITECTURE.md`/notes Next.js), le
  déboguer en priorité en dehors de Docker avant de suspecter le bundler.
- Si Turbopack corrige son support du polling dans une version future de
  Next.js, retester et simplifier `docker-compose.dev.yml` /
  `next.config.ts` en conséquence.
