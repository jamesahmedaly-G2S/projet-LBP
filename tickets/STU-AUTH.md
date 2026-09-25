# STU-AUTH — Login minimal pour vérification manuelle

Epic ajouté en cours de route (absent du découpage initial — je supposais le login couvert côté James, AUTH-07/08/09). Sans lui, chaque revue visuelle d'un écran Studio nécessitait une session fabriquée à la main. Ne remplace pas AUTH-08/09 : périmètre volontairement minimal, juste de quoi débloquer les revues.

---

## STU-AUTH-01 — Écran de login email/mot de passe ✅ Fait

**Priorité : Must** (infrastructure de vérification, bloquant pour toute revue manuelle) · **Dépendances : aucune**

**Réalisé** : `app/login/page.tsx` (formulaire client) + `app/login/actions.ts` (Server Action `login()`, `supabase.auth.signInWithPassword()`, redirection selon le rôle du profil : `/referentiel` pour admin, `/` pour client).

**Vérifié** : parcours réel via navigateur piloté (Playwright) — remplir email + mot de passe → clic → redirection automatique vers `/referentiel`, page rendue avec les données réelles, aucune erreur console.

**Non couvert (hors périmètre volontaire)** : mot de passe oublié, invitation, déconnexion, design — relève d'AUTH-08/09 (James) ou d'un futur ticket si besoin.
