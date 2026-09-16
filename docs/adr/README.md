# Architecture Decision Records (ADR)

Ce dossier trace les décisions d'architecture structurantes du LBP : une
décision par fichier, jamais réécrite après coup — une décision qui change
se **remplace** par un nouvel ADR qui la déprécie explicitement, l'historique
reste lisible.

## Créer un ADR

1. Copier [`0000-template.md`](0000-template.md) vers
   `NNNN-titre-court-en-kebab-case.md` (`NNNN` = prochain numéro séquentiel).
2. Renseigner les sections du gabarit.
3. Référencer l'ADR depuis le document source concerné si besoin (ex.
   `docs/ARCHITECTURE.md`).

## Index

| #                                                  | Titre                                                              | Statut  |
| -------------------------------------------------- | ------------------------------------------------------------------ | ------- |
| [0001](0001-stack-nextjs-supabase-vercel.md)       | Stack Next.js (App Router) + Supabase + Vercel                     | Proposé |
| [0002](0002-packages-partages-pour-schemas-zod.md) | Package partagé `packages/shared` pour les schémas Zod transverses | Accepté |
