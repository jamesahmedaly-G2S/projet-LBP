# 0002 — Package partagé `packages/shared` pour les schémas Zod transverses

**Statut** : Accepté
**Date** : 2026-09-16
**Pilotes** : Infrastructure & Setup (`INFRA-01`)

## Contexte

Le cahier des charges (§0.2, livrables de référence) demande une structure
de dépôt avec un dossier `packages/` pour les types et schémas Zod
partagés, à côté de l'application Next.js unique. `docs/ARCHITECTURE.md`
(§4) propose par ailleurs un découpage feature-based où chaque feature
porte son propre `model.ts` (schéma + type). Les deux ne s'opposent pas :
un schéma spécifique à une seule feature reste dans son `model.ts` ; un
schéma réellement transverse (utilisé par plusieurs features, ou par un
futur consommateur hors de cette application — mobile en phase ultérieure)
n'a pas de raison d'être dupliqué ou artificiellement rattaché à une seule
feature.

## Décision

Créer un workspace npm `packages/shared` (paquet `@lbp/shared`) dédié aux
schémas Zod et types véritablement transverses. L'App Router de Next.js
transpile les packages de workspace automatiquement (Turbopack et webpack),
aucune configuration `next.config.ts` supplémentaire n'est nécessaire. Le
paquet est initialisé vide : le premier schéma réellement partagé y sera
ajouté par la feature qui en a besoin, pas anticipé ici.

## Alternatives considérées

- **Tout dans `lib/`, à l'intérieur de l'app** : fonctionne aussi pour du
  code purement interne à cette application, mais ne prépare pas la
  réutilisation par un futur consommateur externe (mobile) sans déplacer le
  code plus tard.
- **Dupliquer le schéma dans chaque feature qui en a besoin** : viole DRY,
  écarté explicitement par `docs/ARCHITECTURE.md` §1.

## Conséquences

- Une nouvelle feature qui a besoin d'un schéma déjà présent dans
  `packages/shared` l'importe via `@lbp/shared` plutôt que de le
  redéclarer.
- `packages/shared` ne doit contenir que des schémas/types réutilisés par
  au moins deux consommateurs — un schéma à usage unique reste dans le
  `model.ts` de sa feature.
