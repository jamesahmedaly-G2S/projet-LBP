# 0001 — Stack Next.js (App Router) + Supabase + Vercel

**Statut** : Proposé — reprend une décision de cadrage déjà actée en amont
(non re-débattue ici), formalisée en ADR pour traçabilité.
**Date** : 2026-09-16
**Pilotes** : Direction technique (Almamy CAMARA), porteur produit (Pauline LETOURNEUR)

## Contexte

Le LBP doit être reconstruit en application web (mobile en phase
ultérieure) en remplacement du prototype statique `LBP_V2-20.html`. Un
comparatif de stacks transmis en amont note l'option Next.js + Supabase +
Vercel à 95 %, contre 70 % pour Firebase/Docker ; une troisième option
(Node/NestJS + PostgreSQL sur mesure) n'est pas chiffrée [Note de cadrage,
§03, p.6]. Le code d'authentification déjà écrit dans le cahier technique
cible Supabase.

## Décision

Application web unique en Next.js (App Router), déployée sur Vercel,
adossée à Supabase pour l'authentification, la base PostgreSQL (avec Row
Level Security) et le stockage de fichiers. Détail complet dans
[`docs/ARCHITECTURE.md`](../ARCHITECTURE.md).

## Alternatives considérées

- **Firebase/Docker** : notée 70 % au comparatif, écartée.
- **Back-end sur mesure Node/NestJS + PostgreSQL** : non chiffrée, écartée
  pour éviter de ré-implémenter authentification, RLS et stockage from
  scratch (principe KISS).

## Conséquences

- Une seule application Next.js héberge pages front, routes API
  (`app/api/**/route.ts`) et Server Actions — pas de back-end séparé en
  phase 1.
- Le RBAC reste volontairement limité à `ADMIN`/`CLIENT` tant que la
  matrice de droits n'est pas tranchée par le porteur produit.
- Dépendance forte à Supabase : bascule vers un autre fournisseur = refonte
  significative de l'authentification et de l'accès aux données.
