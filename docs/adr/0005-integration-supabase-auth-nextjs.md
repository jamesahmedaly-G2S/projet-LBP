# 0005 — Intégration Supabase Auth dans l'app Next.js (AUTH-01)

**Statut** : Accepté
**Date** : 2026-09-23
**Pilotes** : Authentification & comptes

## Contexte

Next.js 16 a déprécié et renommé `middleware.ts` en `proxy.ts` (fonction
exportée `proxy`, plus `middleware` ; runtime Node.js par défaut). Le
ticket AUTH-01 (rédigé avant cette version) demande un `middleware.ts` —
adapté ici en `proxy.ts` pour rester correct vis-à-vis de la version
réellement utilisée (voir AGENTS.md sur les breaking changes de Next 16).

`@supabase/ssr` (0.12.7) expose `getSession()`, `getUser()` et
`getClaims()` pour lire la session côté serveur. `getClaims()` est
recommandée par le SDK lui-même (voir ses types/doc) : elle vérifie le JWT
(localement via WebCrypto si le projet utilise des clés de signature
asymétriques, sinon via une requête à l'API Auth si secret symétrique),
contrairement à `getSession()` qui fait confiance au cookie sans
validation — `getUser()` fait aussi une validation serveur mais via un
aller-retour réseau systématique.

## Décision

- `proxy.ts` (racine du dépôt) rafraîchit la session sur chaque requête
  via `lib/supabase/proxy.ts` (`updateSession()`) et bloque avec 401 toute
  requête sans claims valides sur les préfixes listés dans
  `PROTECTED_PREFIXES`. Le contrôle fin par rôle reste dans chaque route
  (pas dans le proxy), pour éviter qu'un matcher mal réglé masque un trou
  de sécurité (voir la mise en garde de la doc Next.js sur les Server
  Functions qui contournent le proxy si le matcher les exclut).
- `lib/supabase/server.ts` fournit le client pour Route Handlers/Server
  Components/Server Actions (cookies via `next/headers`).
- `lib/auth/session.ts` expose `requireSession()` (401 si non
  authentifié) et `requireRole(roles)`/`requireAdmin()` (403 si rôle
  insuffisant), qui chargent le profil applicatif (`role`, `company_id`,
  `offer_tier` via la société liée) à partir des claims du JWT.
- `lib/auth/with-role.ts` fournit `withRole()`, un wrapper pour Route
  Handlers qui convertit `AuthError` en réponse HTTP.
- `is_editor()`/rôle "editor" (annexe 5.4) restent couverts par
  `requireAdmin()` : le modèle de rôles est réduit à 2 valeurs
  (`admin`/`client`), décision actée avant ce ticket — voir
  `docs/adr/0004-baseline-schema-reel-et-conventions-anglaises.md`.

## Régression corrigée au passage : GRANTs de table manquants

En testant `GET /api/profiles/me` avec une vraie session, la requête
échouait avec `permission denied for table profiles` (SQLSTATE 42501),
alors que les policies RLS étaient correctes. Cause : le script baseline
(`20260923121802_baseline_schema_reel.sql`) fait
`drop schema public cascade; create schema public;` puis ne réaccorde que
`grant usage` sur le schéma — jamais les privilèges de table
(`SELECT`/`INSERT`/`UPDATE`/`DELETE`) que Supabase accorde par défaut à
`anon`/`authenticated`/`service_role`. PostgreSQL vérifie le GRANT de
table **avant** d'évaluer RLS : sans lui, RLS ne s'exécute jamais, quelle
que soit la policy. **Ce bug était déjà live sur staging et production**
(même script baseline exécuté sur les deux) — corrigé par
`20260923135149_grant_table_privileges_to_supabase_roles.sql`.

## Alternatives considérées

- **`getSession()`/`getUser()` au lieu de `getClaims()`** : écarté,
  `getSession()` ne valide pas le JWT (le SDK lui-même déconseille de lui
  faire confiance côté serveur), `getUser()` fait un aller-retour réseau
  systématique alors que `getClaims()` peut valider localement.
- **Contrôle de rôle dans le proxy plutôt que dans chaque route** : écarté
  — la doc Next.js elle-même met en garde contre un matcher de proxy mal
  réglé qui laisserait passer une Server Function ; vérifier dans chaque
  route/Server Action est la defense-in-depth recommandée.

## Conséquences

- Toute nouvelle route protégée doit être ajoutée à `PROTECTED_PREFIXES`
  dans `proxy.ts` **et** appeler `requireSession()`/`requireRole()` dans
  son propre code — le proxy seul ne suffit pas.
- `.env.local` (non commité) doit définir `NEXT_PUBLIC_SUPABASE_URL` et
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` ; `.env.example` documente le format.
