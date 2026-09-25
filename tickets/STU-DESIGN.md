# STU-DESIGN — Identité visuelle Studio

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
