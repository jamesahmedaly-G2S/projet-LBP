# @lbp/shared

Schémas de validation Zod et types partagés entre l'application Next.js
(pages, routes API `app/api/**/route.ts`, Server Actions) et, à terme,
d'autres consommateurs (mobile, phase ultérieure — voir
[`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)).

## Utilisation

Ce package est un workspace npm local, référencé par son nom (`@lbp/shared`)
depuis `package.json`. L'App Router de Next.js transpile automatiquement les
packages de workspace, aucune configuration supplémentaire n'est nécessaire
côté `next.config.ts`.

```ts
import { maSchema } from "@lbp/shared";
```

## Convention

Un schéma Zod par fichier dans `src/schemas/`, réexporté depuis
`src/index.ts`. Le type TypeScript associé se dérive du schéma avec
`z.infer<typeof maSchema>` plutôt que d'être redéclaré à la main (principe
DRY, voir `docs/ARCHITECTURE.md` §1).
