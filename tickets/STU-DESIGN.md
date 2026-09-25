# STU-DESIGN — Identité visuelle Studio

---

## STU-DESIGN-00 — Passe légère : ui-kit minimal + accent bleu ✅ Fait

**Priorité : Must** (ajouté en cours de route, à la demande explicite — les écrans construits sans aucun style structurant nuisaient à la lisibilité du travail en cours) · **Dépendances : aucune**

**Contexte** : ni le plein périmètre de STU-DESIGN-01 (navigation à 10 onglets — prématurée, la plupart des onglets n'ont pas encore d'écran) ni son report en toute fin de séquence n'étaient tenables : les écrans STU-REF/STU-CCN/STU-WORKFLOW construits jusqu'ici (Tailwind brut, sans composants partagés) étaient illisibles à l'usage.

**Réalisé** : `ui-kit/Button.tsx`, `LinkButton.tsx`, `Card.tsx`, `Field.tsx` (TextField/TextAreaField/SelectField), `Badge.tsx` (dès maintenant, conformément à `ARCHITECTURE.md` §4 qui prévoit ce dossier dès la phase 1) ; accent bleu Studio (`blue-600`/`blue-900`) sur boutons primaires et en-tête ; `app/(studio)/layout.tsx` (en-tête minimal "LBP STUDIO", pas de navigation complète) ; refactorisation de tous les écrans existants (login, référentiel, nouvelle fiche, fiche, société) pour utiliser ces composants au lieu de classes dupliquées.

**Non fait (reste à STU-DESIGN-01)** : navigation à 10 onglets, port de `lib/design-tokens.ts`, différenciation visuelle poussée avec le LBP Client (qui n'existe pas encore côté écrans).

**Vérifié** : capture d'écran des 5 écrans (login, référentiel, nouvelle fiche, fiche, société), aucune erreur console, lint/typecheck propres.

---

## STU-DESIGN-01 — Charte bleu Studio + navigation dédiée

**Priorité : Should** · **Dépendances : aucune**

**Contexte** : §2 — le Studio doit être "immédiatement identifiable comme appartenant au pôle LBP" sans copier le LBP Client : univers bleu structurant, cartes claires, navigation plus dense, header "LBP STUDIO / Administration G2S · Référentiel & clients". Explicitement interdit : un dark mode générique ou un simple recolorage du mode G2S actuel.

**À faire** : tokens de couleur Studio dérivés de `lib/design-tokens.ts` existant (pas redérivés from scratch — principe DRY d'`ARCHITECTURE.md`), nouvelle navigation avec les 10 onglets du §3 (Tableau de bord, Clients, Référentiel, Questionnaires, Affectations, Publications, Veille & mises à jour, Entretiens, Quiz & formations, Administration).

**Critères d'acceptation**

- Le Studio reste lisible et cohérent avec l'identité LBP (typographies, arrondis) tout en étant visuellement distinct du LBP Client au premier coup d'œil.

---

## STU-DESIGN-02 — Harmonisation icônes/composants

**Priorité : Could** · **Dépendances : STU-DESIGN-01**

**Contexte** : continuité avec le travail déjà engagé côté maquette client (remplacement des emojis par des icônes Lucide, cf. CR du 08/09) — à étendre au Studio.

**À faire** : réutiliser les composants `ui-kit/` déjà identifiés comme à construire dans `ARCHITECTURE.md`, pas de nouvelle bibliothèque de composants spécifique au Studio.

**Critères d'acceptation**

- Aucun composant dupliqué entre LBP Client et LBP Studio pour un même usage (bouton, carte, badge) — un seul `ui-kit/` partagé, conformément à la règle de frontière stricte d'`ARCHITECTURE.md` §4.
