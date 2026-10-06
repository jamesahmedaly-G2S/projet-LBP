# design.md — Charte graphique LBP (Client + Studio) · G2S

> Source : `LBP_V9_9_Studio.html` (maquette V9.9).
> Ce fichier est la **référence d'intégration** pour un agent de code (Claude, Antigravity…).
> Toutes les valeurs ci-dessous sont les **valeurs effectives** après la cascade CSS de la maquette
> (la maquette empile plusieurs couches ; c'est la dernière — « Couche charte G2S » + « Titres » — qui fait foi).

---

## 0. Règles impératives pour l'agent

1. **N'invente aucune couleur.** Utilise uniquement les tokens de la section 2. Si un besoin n'est pas couvert, réutilise le token sémantique le plus proche.
2. **Une seule famille de police : Archivo.** IBM Plex Mono uniquement pour le code et les identifiants techniques.
3. **Titres en 800, couleur `--titre` (#33405A)**, interlettrage négatif.
4. **Boutons, onglets, chips, recherche = pilule** (`border-radius: 999px`). Cartes = 14–18 px.
5. **Ombres très légères**, teintées carbone (jamais du noir pur), sauf modales/menus.
6. **Icônes : SVG style Lucide**, trait 2 px, `currentColor`. Pas d'emoji dans un nouveau composant (les emojis de la maquette sont en cours de remplacement).
7. Deux habillages partagent la même base : **LBP Client** (identité framboise) et **LBP Studio** (identité bleu-gris + claret). Ne pas les mélanger dans un même écran.
8. Langue de l'interface : **français**. Typographie française (espaces insécables avant `: ; ! ?`, guillemets « »).
9. Accessibilité : focus visible obligatoire, `prefers-reduced-motion` respecté, contrastes AA.
10. **Pas de nouveaux alias.** Les anciens noms (`--sage`, `--coral`, `--blue`, `--wine`…) existent pour compatibilité ; dans du code neuf, utiliser les noms canoniques (`--framboise`, `--carbone`, `--mineral`…).

---

## 1. Identité

| Élément                   | Valeur                                                             |
| ------------------------- | ------------------------------------------------------------------ |
| Produit                   | **LBP** — « Le Référentiel Paie & Droit social » · _by G2S_        |
| Back-office               | **LBP Studio** — administration G2S                                |
| Personnalité              | Éditorial, sobre, institutionnel, chaleureux (tons minéraux/crème) |
| Couleur signature         | **Framboise `#670626`**                                            |
| Couleur texte / structure | **Carbone `#445068`**                                              |
| Fond                      | **Minéral `#FAF9F7`**                                              |

Logo : image G2S (PNG) posée dans un badge blanc carré arrondi (`52×52`, radius `14px`, padding `6px`, filet `--ligne`), suivi d'un bloc texte séparé par un filet vertical de 3 px :

- `LBP` — Archivo 800, 20 px, `letter-spacing: .14em`
- sous-titre `RÉFÉRENTIEL PAIE · BY G2S` — 9.5 px, 500, uppercase, `letter-spacing: .14em`

---

## 2. Tokens de couleur

### 2.1 Palette de base (canonique)

```css
:root {
  /* Framboise — couleur de marque */
  --framboise: #670626;
  --framboise-dark: #3e0417; /* survol bouton primaire, KPI foncé */
  --framboise-light: #f5f0ec; /* fond barre de filtres, survol ghost */
  --framboise-soft: #f5e6eb; /* fonds rosés (famille C, rubrique Essentiel) */
  --framboise-text: #8c2447; /* texte secondaire sur fond rosé */

  /* Carbone — texte et structure */
  --carbone: #445068;
  --carbone-dark: #364054;
  --carbone-deep: #2a3244;
  --titre: #33405a; /* tous les titres (carbone assombri) */
  --bleu-gris-clair: #eaecef;
  --bleu-gris-mid: #d5d9e0;
  --bleu-gris-txt: #b9c0cc; /* texte secondaire sur fond carbone */

  /* Minéraux / neutres */
  --mineral: #faf9f7; /* fond de page */
  --cream: #f5f0ec; /* panneaux, hover, encarts */
  --cream-3: #efe7e1; /* onglet actif header, famille A, KPI clair */
  --card: #ffffff;
  --ligne: #ded9db; /* bordures standard */
  --ligne-forte: #c6bfc3; /* bordure au survol */
  --graphite: #686368;
  --ink-soft: #6b656b; /* texte secondaire */
  --gris-froid: #f4f5f7; /* fond neutre Studio (brouillon, hover table) */
  --gris-froid-txt: #6b7589;

  /* Ombres */
  --shadow: 0 18px 40px -26px rgba(68, 80, 104, 0.28);
  --shadow-sm: 0 10px 26px -20px rgba(68, 80, 104, 0.22);
  --pill: 999px;
}
```

### 2.2 Couleurs de statut

| Statut                                         | Couleur pleine    | Fond      | Texte sur fond |
| ---------------------------------------------- | ----------------- | --------- | -------------- |
| Succès / publié / à jour                       | `#0E8A87`         | `#EAF7F6` | `#0B6E6C`      |
| Attention / en relecture / brouillon éditorial | `#B8860B`         | `#FDF8E8` | `#7A5A00`      |
| Erreur / retard / obligatoire                  | `#C0343C`         | `#FDEEEF` | `#A3262C`      |
| Programmé (Studio)                             | `#670626`         | `#F5E6EB` | `#670626`      |
| Proposition de modification (veille)           | bordure `#F2D57A` | `#FDF8E8` | `#7A5A00`      |

Point de calendrier « perso » : `#EAAE18`.

### 2.3 Les 6 rubriques d'une fiche (système central du produit)

Chaque fiche du référentiel est découpée en 6 rubriques. Chaque rubrique a un trio **fond / texte / bordure**.

| Rubrique                     | Clé CSS           | Fond      | Texte (titre + icône) | Bordure   |
| ---------------------------- | ----------------- | --------- | --------------------- | --------- |
| L'essentiel                  | `lbp-essentiel`   | `#F5E6EB` | `#670626`             | `#D9A7B7` |
| Comprendre la règle          | `lbp-comprendre`  | `#EAECEF` | `#364054`             | `#B9C0CC` |
| Maîtriser la règle en détail | `lbp-maitriser`   | `#EFE7E1` | `#3E0417`             | `#C6BFC3` |
| Application concrète en paie | `lbp-application` | `#EAF7F6` | `#0B6E6C`             | `#9ED8D6` |
| Points de vigilance          | `lbp-vigilance`   | `#FDEEEF` | `#A3262C`             | `#F2B5B8` |
| Quiz                         | `lbp-quiz`        | `#FDF8E8` | `#7A5A00`             | `#F2D57A` |

```css
--lbp-essentiel: #f5e6eb;
--lbp-essentiel-tx: #670626;
--lbp-essentiel-bd: #d9a7b7;
--lbp-comprendre: #eaecef;
--lbp-comprendre-tx: #364054;
--lbp-comprendre-bd: #b9c0cc;
--lbp-maitriser: #efe7e1;
--lbp-maitriser-tx: #3e0417;
--lbp-maitriser-bd: #c6bfc3;
--lbp-application: #eaf7f6;
--lbp-application-tx: #0b6e6c;
--lbp-application-bd: #9ed8d6;
--lbp-vigilance: #fdeeef;
--lbp-vigilance-tx: #a3262c;
--lbp-vigilance-bd: #f2b5b8;
--lbp-quiz: #fdf8e8;
--lbp-quiz-tx: #7a5a00;
--lbp-quiz-bd: #f2d57a;
```

Ces mêmes trios servent aux encadrés d'article : `info` = comprendre, `clé` = essentiel, `vigilance` = vigilance, `conseil` = application.

### 2.4 Familles de la bibliothèque (3 grandes familles)

| Famille            | Classe | Fond      | Titre     | Texte secondaire |
| ------------------ | ------ | --------- | --------- | ---------------- |
| A — Vie du contrat | `.ta`  | `#EFE7E1` | `#3E0417` | `#8C2447`        |
| B — Rémunération   | `.tb`  | `#EAECEF` | `#364054` | `#445068`        |
| C — Cotisations    | `.tc`  | `#F5E6EB` | `#670626` | `#8C2447`        |

### 2.5 Habillage LBP Studio

```css
--st-bleugris: #445068; /* header, boutons primaires, barres d'admin */
--st-bleugris-2: #364054; /* survol */
--st-bleugris-soft: #eaecef;
--st-claret: #670626; /* accent : onglet actif, CTA dans barres sombres */
--st-claret-soft: #f5e6eb;
--st-bg: #faf9f7;
--st-card: #ffffff;
--st-line: #ded9db;
--st-muted: #6b656b;
```

---

## 3. Typographie

### 3.1 Familles

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700&family=IBM+Plex+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

```css
body {
  font-family: "Archivo", system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--carbone);
  background: var(--mineral);
  -webkit-font-smoothing: antialiased;
}
code,
kbd,
pre,
.tech-id {
  font-family: "IBM Plex Mono", monospace;
}
.mono {
  font-variant-numeric: tabular-nums;
} /* chiffres alignés dans les tableaux */
```

Graisses utilisées : 400 (texte), 500 (sous-textes), 600 (liens nav, libellés), 700 (boutons, labels), **800 (tous les titres et valeurs chiffrées)**.

### 3.2 Échelle

| Rôle                                    | Taille              | Graisse       | Interlettrage | Couleur                    | Remarques                                    |
| --------------------------------------- | ------------------- | ------------- | ------------- | -------------------------- | -------------------------------------------- |
| Titre Studio (`.st-h1`)                 | 35 px (27 px < 760) | 800           | −.02em        | `--titre`                  | lh 1.16                                      |
| Titre d'article (`.art-titre`)          | 34 px (26 px < 700) | 800           | −.015em       | `--titre`                  | lh 1.18                                      |
| Valeur KPI Studio                       | 34 px               | 800           | —             | `--titre`                  | lh 1                                         |
| Titre de page client (`.section-title`) | 29 px (24 px < 760) | 800           | −.018em       | `--titre`                  | lh 1.2, mb 20                                |
| Message d'accueil (`.greet h2`)         | 27 px               | 800           | −.015em       | blanc sur framboise        |                                              |
| Section large (`.sec-title.big`)        | 23 px               | 800           | −.015em       | `--titre`                  |                                              |
| Titre Studio N2 (`.st-h2`)              | 21 px               | 800           | −.012em       | `--titre`                  |                                              |
| Titre carte « à la une »                | 21 px               | 800           | —             | `--titre`                  | lh 1.25                                      |
| Modale (`h3`)                           | 20 px               | 800           | —             | `--carbone`                |                                              |
| Famille (bloc)                          | 19 px               | 800           | —             | selon famille              |                                              |
| Titre de rubrique (`.lbp-title`)        | 18 px               | 800           | —             | couleur rubrique           |                                              |
| Titre de section (`.sec-title`)         | 18 px               | 800           | −.01em        | `--titre`                  | `span` annexe : 12 px italique `#9A959A` 500 |
| Titre de carte actu                     | 16.5 px             | 800           | —             | `--titre`                  | lh 1.3, survol framboise                     |
| Corps d'article                         | 16 px               | 400           | —             | `--carbone`                | **lh 1.75**                                  |
| Chapô d'article                         | 17 px               | 400           | —             | `--ink-soft`               | lh 1.65                                      |
| Corps standard                          | 14–14.5 px          | 400           | —             | `--carbone` / `--ink-soft` | lh 1.5–1.7                                   |
| Texte secondaire                        | 13–13.5 px          | 400           | —             | `--ink-soft`               | taille la plus fréquente de la maquette      |
| Boutons / nav                           | 12.5–13.5 px        | 700 (nav 600) | —             | —                          |                                              |
| Méta, dates                             | 11.5–12 px          | 400–700       | —             | `--ink-soft`               |                                              |
| **Eyebrow / surtitre**                  | 11–11.5 px          | 800           | **.14–.16em** | `--framboise`              | **UPPERCASE**                                |
| Label de champ (uppercase)              | 10.5–11 px          | 700           | .06–.07em     | `--ink-soft`               | UPPERCASE                                    |
| Badge / tag                             | 9.5–10.5 px         | 800           | .04–.08em     | —                          | UPPERCASE                                    |

Motif récurrent d'en-tête de page :

```html
<div class="eyebrow">La bibliothèque RH &amp; Paie</div>
<div class="section-title">Tous les thèmes de la paie</div>
<p class="lead">…</p>
<!-- 14px, --ink-soft, max-width:720px, mb 18px -->
```

---

## 4. Espacements, rayons, ombres, mouvement

### 4.1 Espacements (échelle observée, base ≈ 2 px)

`4 · 6 · 7 · 8 · 9 · 10 · 12 · 13 · 14 · 16 · 18 · 20 · 22 · 24 · 26 · 28 · 30 · 32`

- Gouttières de grille : **12–16 px** (client), **16–20 px** (Studio).
- Padding de carte : `16px 18px` (compacte) · `18px 20px` (standard) · `24px 26px` (Studio) · `26px 28px` (panneau de lecture).
- Marge sous un bloc : 16–24 px.

### 4.2 Rayons

| Usage                                             | Rayon            |
| ------------------------------------------------- | ---------------- |
| Boutons, onglets, chips, recherche, avatars texte | `999px` (pilule) |
| Carte de connexion Studio                         | `22px`           |
| Grandes cartes de navigation (`.col` niveaux)     | `20px`           |
| Panneaux, modales, `.box`, familles               | `16–18px`        |
| Cartes de rubrique, tuiles, KPI, menus            | `14px`           |
| Encarts internes, lignes de liste, `.lbp-body`    | `10–12px`        |
| Champs de formulaire                              | `9–10px`         |
| Badges, tags                                      | `5–6px`          |

### 4.3 Ombres

| Token / valeur                         | Usage                                                  |
| -------------------------------------- | ------------------------------------------------------ |
| `var(--shadow-sm)`                     | Ombre par défaut des cartes                            |
| `var(--shadow)`                        | Survol de carte cliquable, modales, panneaux flottants |
| `0 1px 3px rgba(68,80,104,.05)`        | Cartes Studio « à plat »                               |
| `0 14px 38px rgba(68,80,104,.24)`      | Menu déroulant                                         |
| `0 18px 40px -26px rgba(103,6,38,.6)`  | Encart framboise mis en avant                          |
| `0 14px 32px -10px rgba(103,6,38,.75)` | Bouton flottant d'assistance                           |
| `0 24px 60px rgba(0,0,0,.28)`          | Carte de connexion Studio                              |

### 4.4 Mouvement

```css
.view.active {
  animation: fade 0.28s ease;
}
@keyframes fade {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes ddIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: none;
  }
} /* .13s ease-out */
@media (prefers-reduced-motion: reduce) {
  .view.active {
    animation: none;
  }
  * {
    transition: none !important;
  }
}
```

- Transitions : `.12s` – `.18s` (valeur par défaut `.15s`).
- Survol carte cliquable : `transform:translateY(-2px)` (−3/−4 px pour les grandes tuiles) + passage à `--shadow`.
- Survol ligne de liste : `translateX(2px)`.
- Bouton primaire : `translateY(-1px)` au survol.
- Chevron d'accordéon : `rotate(90deg)` ; caret de menu : `rotate(180deg)`.

---

## 5. Mise en page

|           | LBP Client                                                | LBP Studio                                                           |
| --------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| Conteneur | `max-width:1240px; margin:0 auto; padding:24px 30px 90px` | `max-width:1500px; margin:0 auto; padding:32px`                      |
| Header    | sticky, `z-index:50`                                      | sticky, `z-index:20` (app en `position:fixed; inset:0; z-index:150`) |

Grilles types :

- KPI : `repeat(4,1fr)` gap 12 (client) · `repeat(auto-fit,minmax(200px,1fr))` gap 16 (Studio)
- Cartes de rubrique : `repeat(3,1fr)` gap 12 → 2 col < 900 → 1 col < 600
- Actu : `minmax(0,1fr) 320px` (colonne latérale sticky) → 1 col < 1060
- Deux colonnes : `1fr 1fr` gap 16–20 → 1 col < 960/1000
- Fiche entreprise : `1fr 330px` → 1 col < 820

Points de rupture : **1060 · 1000 · 960 · 900 · 820 · 760 · 700 · 600 px** (desktop-first, `max-width`).
Sous 760 px : les fonds photo passent en `background-attachment:scroll`.

Z-index : contenu 1–3 · filtres 40 · header 50 · notifications 60 · bulle d'aide 90–91 · modales 100 · Studio 150 · bandeau d'admin 300 · menu déroulant 400.

---

## 6. Composants — LBP Client

### 6.1 Header (bandeau framboise)

```css
header.top {
  background: var(--framboise);
  color: #fff;
  padding: 18px 30px;
  position: sticky;
  top: 0;
  z-index: 50;
}
.top-row {
  display: flex;
  align-items: center;
  gap: 22px;
  flex-wrap: wrap;
}
.brand-text {
  border-left: 3px solid rgba(255, 255, 255, 0.55);
  padding-left: 13px;
  line-height: 1.1;
}
/* Navigation principale : pilules translucides */
.topnav {
  display: flex;
  gap: 7px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.topnav button {
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(245, 240, 236, 0.14);
  color: #fff;
  border: 1px solid rgba(245, 240, 236, 0.22);
}
.topnav button:hover {
  background: rgba(245, 240, 236, 0.24);
  border-color: rgba(245, 240, 236, 0.45);
}
.topnav button.on {
  background: var(--cream-3);
  color: var(--carbone);
  border-color: var(--cream-3);
  font-weight: 800;
}
.nav-ic {
  display: inline-flex;
  margin-right: 6px;
  vertical-align: -3px;
} /* icône 17px, blanche ; normale si .on */
header.top :focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
```

Éléments du header : logo · sélecteur de mode (Client / Studio) · recherche globale · cloche de notifications (pastille blanche, chiffre framboise) · bouton compte (nom + rôle + avatar rond carbone 32 px).

Navigation : Accueil · Mon entreprise · Calendrier RH · La bibliothèque · Actu-Veille · Chiffres Paie · Dictionnaire · Quizz · Offres · Prise en main.

### 6.2 Sélecteur de mode (segmenté)

```css
.modeswitch {
  display: flex;
  gap: 4px;
  background: var(--cream);
  border: 1px solid var(--ligne);
  border-radius: 999px;
  padding: 4px;
}
.modeswitch button {
  border-radius: 999px;
  padding: 6px 15px;
  color: var(--ink-soft);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.12;
}
.modeswitch .ms-t {
  font-size: 12.5px;
  font-weight: 800;
}
.modeswitch .ms-s {
  font-size: 10px;
  opacity: 0.85;
}
.modeswitch button.on {
  background: #fff;
  color: var(--carbone);
  box-shadow: var(--shadow-sm);
}
```

### 6.3 Boutons

```css
.btn {
  font: 700 12.5px/1 "Archivo";
  border-radius: 999px;
  padding: 9px 18px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
  transition: 0.15s;
}
.btn-primary {
  background: var(--framboise);
  color: #fff;
}
.btn-primary:hover {
  background: var(--framboise-dark);
  transform: translateY(-1px);
}
.btn-ghost {
  background: transparent;
  color: var(--carbone);
  border: 1.5px solid var(--ligne);
}
.btn-ghost:hover {
  background: var(--framboise-light);
  border-color: var(--carbone);
}
.btn-line {
  background: #fff;
  color: var(--framboise);
  border: 1.5px solid var(--framboise);
}
.btn-line:hover {
  background: var(--framboise);
  color: #fff;
}
.icon-btn {
  padding: 4px;
  border-radius: 6px;
  color: var(--ink-soft);
  line-height: 0;
}
.icon-btn:hover {
  background: var(--cream);
  color: var(--carbone);
}
```

Lien retour : `← Retour`, 12.5 px 700 framboise (ou `.btn-line`).
Bouton clair sur fond framboise : fond blanc, texte framboise, 800, hover `--cream-3`.

### 6.4 Contrôles segmentés et champs

```css
.seg {
  display: inline-flex;
  border: 1px solid var(--ligne);
  border-radius: 999px;
  overflow: hidden;
  background: #fff;
}
.seg button {
  font-size: 12.5px;
  font-weight: 600;
  padding: 7px 15px;
  color: var(--ink-soft);
  border-right: 1px solid var(--ligne);
}
.seg button.on {
  background: var(--carbone);
  color: #fff;
}

.form-field {
  margin-bottom: 12px;
}
.form-field label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-soft);
  margin-bottom: 5px;
}
.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  font: 13.5px "Archivo";
  border: 1px solid var(--ligne);
  border-radius: 9px;
  padding: 10px 12px;
  background: #fff;
  color: var(--carbone);
}
input:focus,
select:focus,
textarea:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(103, 6, 38, 0.28);
}

.gsearch {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid var(--ligne);
  border-radius: 999px;
  padding: 7px 14px;
  min-width: 210px;
}
.gsearch:focus-within {
  border-color: var(--framboise);
}
```

Barre de filtres : fond `--framboise-light`, filet bas `--ligne`, `padding:11px 30px`, libellés 11 px uppercase 700.

### 6.5 Cartes et conteneurs

```css
.box,
.dash-card {
  background: #fff;
  border: 1px solid var(--ligne);
  border-radius: 16px;
  padding: 18px 20px;
  box-shadow: var(--shadow-sm);
}
.pane,
.ov-panel {
  background: #fff;
  border: 1px solid var(--ligne);
  border-radius: 18px;
  padding: 26px 28px;
  box-shadow: var(--shadow-sm);
}
.callout {
  background: var(--cream);
  border-left: 4px solid var(--carbone);
  border-radius: 0 10px 10px 0;
  padding: 13px 17px;
  font-size: 13.5px;
}
```

Carte d'accueil (`.greet`) : fond framboise, tout le texte blanc, radius 16, `padding:24px 28px`, sans ombre.

### 6.6 KPI (chiffres clés)

```css
.kpi-card {
  border-radius: 16px;
  padding: 16px 18px;
  color: #fff;
  cursor: pointer;
  transition: 0.14s;
}
.kpi-card.ka {
  background: var(--carbone);
}
.kpi-card.kb {
  background: var(--framboise);
}
.kpi-card.kc {
  background: var(--framboise-dark);
}
.kpi-card.kd {
  background: var(--cream-3);
  color: var(--carbone);
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
```

Ordre impératif : carbone → framboise → framboise foncé → crème.

### 6.7 Tuiles / blocs de familles

```css
.fam-block {
  border-radius: 18px;
  padding: 26px 24px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: 0.16s;
}
.fam-block:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}
.fam-block .fam-n {
  font: 800 19px/1.2 "Archivo";
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 8px;
}
.fam-block .fam-ex {
  font-size: 13px;
  line-height: 1.5;
  flex: 1;
}
.fam-block .fam-c {
  font-size: 12.5px;
  font-weight: 800;
  margin-top: 14px;
}
/* couleurs : voir § 2.4 */
.th-tile {
  border-radius: 14px;
  padding: 14px;
  min-height: 98px;
} /* version compacte */
```

### 6.8 Accordéon des thèmes (bibliothèque)

```css
.theme {
  background: #fff;
  border: 1px solid var(--ligne);
  border-radius: 18px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.theme-head {
  display: grid;
  grid-template-columns: 48px 1fr auto;
  gap: 15px;
  align-items: center;
  padding: 15px 18px;
  cursor: pointer;
}
.theme-head:hover {
  background: var(--cream);
}
.pnum {
  width: 48px;
  height: 48px;
  border-radius: 11px;
  background: var(--bleu-gris-clair);
  display: flex;
  align-items: center;
  justify-content: center;
}
.pnum b {
  font-size: 19px;
  font-weight: 800;
}
.chev {
  color: var(--ink-soft);
  transition: transform 0.2s;
}
.theme.open .chev {
  transform: rotate(90deg);
}
.sub-item {
  display: flex;
  justify-content: space-between;
  padding: 13px 14px;
  border-radius: 9px;
}
.sub-item:hover {
  background: var(--cream);
}
```

### 6.9 Fiche — cartes de rubrique (navigation) et blocs de contenu

```css
.lbp-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 22px;
}
.lbp-cards .col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 7px;
  min-height: 118px;
  padding: 16px;
  background: #fff;
  border: 1px solid var(--ligne);
  border-top: 4px solid var(--lbp-<rubrique>-bd);
  border-radius: 14px;
  cursor: pointer;
  transition: 0.15s;
}
.lbp-cards .col .col-ic {
  color: var(--lbp-<rubrique>-tx);
}
.lbp-cards .col .col-t {
  font: 800 13.5px/1.28 "Archivo";
  color: var(--carbone);
}
.lbp-cards .col .colnote {
  font-size: 10.5px;
  color: var(--ink-soft);
}
.lbp-cards .col.sel {
  background: var(--lbp-<rubrique>);
  box-shadow: inset 0 0 0 1.5px var(--lbp-<rubrique>-bd);
}
.lbp-cards .col.locked {
  opacity: 0.5;
  cursor: not-allowed;
} /* + icône cadenas en haut à droite */

.lbp-block {
  border-radius: 16px;
  padding: 20px 24px;
  background: var(--lbp-<rubrique>);
  border: 1px solid var(--lbp-<rubrique>-bd);
}
.lbp-head {
  display: flex;
  gap: 12px;
  padding-bottom: 14px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
}
.lbp-title {
  font: 800 18px "Archivo";
  color: var(--lbp-<rubrique>-tx);
}
.lbp-body {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  font-size: 14px;
  line-height: 1.7;
}
.lbp-item {
  border: 1px solid var(--ligne);
  border-radius: 10px;
  background: #fff;
} /* <details> accordéon */
.lbp-item summary {
  padding: 11px 14px;
  font: 700 13.5px "Archivo";
  list-style: none;
}
```

Niveaux numérotés : pastille ronde 22 px, fond `--lbp-comprendre-tx`, chiffre blanc 11 px 800, filet gauche 3 px `--lbp-comprendre-bd`.

### 6.10 Tableaux de données (Chiffres Paie)

```css
table.grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}
table.grid th,
table.grid td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--ligne);
  text-align: left;
}
table.grid th {
  background: var(--bleu-gris-clair);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
table.grid td.val {
  font-weight: 800;
  color: var(--carbone);
  text-align: right;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}
table.grid td.src {
  color: var(--ink-soft);
  font-size: 12px;
}
table.grid tr:hover td {
  background: var(--cream);
}
table.grid .grp-row td {
  background: var(--cream);
  font-weight: 800;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

Conteneur : `.valo` = carte blanche radius 18 + `overflow:hidden`.

### 6.11 Actu-Veille

- Carte : blanc, radius 16, filet `--ligne`, image `aspect-ratio:16/9`, corps `padding:16px 18px 18px`.
- Catégorie : 11 px, 700, uppercase, `.16em`, framboise.
- Survol : `translateY(-2px)`, bordure `--ligne-forte`, titre framboise.
- Article « à la une » : horizontal, média 46 %, min-height 260 px, badge blanc pilule framboise en haut à gauche.
- Colonne latérale (320 px, sticky) : encart **« Ne rien manquer »** (fond framboise, texte blanc, cercle décoratif `border:18px solid rgba(255,255,255,.08)` en bas à droite) + encart **« En bref »** (lignes séparées par filets, valeur 20 px 800).
- **Couvertures sans image** (`.g2-cover`) : `aspect-ratio:16/9`, variantes `--framboise` (fond framboise / texte blanc), `--carbone` (fond carbone / blanc), `--mineral` (`#F1ECEE` / carbone). Motif : deux arcs de cercle concentriques en SVG (trait 14, opacité .10–.14) débordant en bas à droite ; catégorie en `clamp(1rem,8cqw,2.2rem)` 800.

### 6.12 Page article

```css
.art-page {
  max-width: 780px;
  margin: 0 auto;
}
.art-cat {
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--framboise);
}
.art-contenu {
  font-size: 16px;
  line-height: 1.75;
}
.art-contenu h2 {
  font: 800 22px "Archivo";
  margin: 26px 0 10px;
}
.art-contenu a {
  color: var(--framboise);
  text-decoration: underline;
}
.art-quote {
  border-left: 3px solid var(--framboise);
  padding: 6px 0 6px 18px;
  font-size: 17px;
  font-style: italic;
  color: var(--ink-soft);
}
.art-box {
  border-radius: 12px;
  padding: 14px 18px;
  border-left: 4px solid;
} /* --info --cle --vig --conseil, cf. § 2.3 */
.art-box b {
  display: block;
  font: 800 12.5px "Archivo";
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}
.art-hero {
  border-radius: 16px;
  overflow: hidden;
} /* image max-height 420 */
.art-cta,
.art-sources {
  background: var(--cream);
  border-radius: 12–16px;
}
```

### 6.13 Modales

```css
.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(68, 80, 104, 0.45);
  backdrop-filter: blur(3px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal {
  background: #fff;
  border-radius: 18px;
  padding: 28px;
  max-width: 440px;
  width: 100%;
  box-shadow: var(--shadow);
  animation: fade 0.25s;
}
/* variantes : 520 / 540 / 600 / 760 px ; max-height:88vh; overflow-y:auto */
.om-close {
  position: absolute;
  top: 14px;
  right: 16px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
}
.om-close:hover {
  background: var(--cream);
}
```

Liste à puces de bénéfices : `✓` couleur succès `#0E8A87`, 800 ; élément non inclus : `○` `--ink-soft`.

### 6.14 Divers

- **Calendrier** : cellules radius 8–9, aujourd'hui = fond carbone + texte blanc 800 ; points 6–7 px (national carbone, entreprise `#D5D9E0`, perso `#EAAE18`).
- **Panneau de notifications** : 330 px, max-height 440, radius 14, `--shadow`.
- **Bulle d'assistance** : pilule framboise fixe en bas à droite (`right:22px; bottom:86px`), panneau 352 px radius 18.
- **Tag** : 10 px 700, pilule ; `sub` = `rgba(103,6,38,.14)` + framboise ; `maj` = fond/texte succès.
- **Quiz** : options en lignes `border:1.5px solid var(--ligne); border-radius:11px; padding:13px 16px` ; puce ronde 16 px ; sélection = bordure carbone.
- **Accessibilité** : classe `.sr-only` standard ; `:focus-visible{outline:2px solid var(--framboise);outline-offset:2px}`.

### 6.15 Fonds photographiques par page (client)

Chaque vue a une photo plein écran (`center/cover fixed`) **toujours sous un voile minéral** `rgba(250,249,247,α)` :

| Page           | Sujet photo                            | α du voile |
| -------------- | -------------------------------------- | ---------- |
| Accueil        | sablier et pièces (tons beige)         | .60        |
| Mon entreprise | pot à stylos vert sur marbre           | .82        |
| Calendrier RH  | calendrier et punaise                  | .80        |
| Bibliothèque   | pile de livres                         | .80        |
| Actu-Veille    | pile de journaux                       | .82        |
| Chiffres Paie  | pièces en euros                        | .72        |
| Dictionnaire   | écran de dictionnaire (teinte carbone) | .80        |
| Quizz          | main en bois + point d'interrogation   | .80        |
| Offres         | ordinateur et lunettes                 | .70        |

```css
body:has(#v-biblio.active) {
  background:
    linear-gradient(rgba(250, 249, 247, 0.8), rgba(250, 249, 247, 0.8)),
    url(...) center/cover fixed no-repeat;
  background-color: var(--mineral);
}
```

Les cartes restent blanches et opaques par-dessus (exception : calendrier d'accueil en `rgba(255,255,255,.62)`).

---

## 7. Composants — LBP Studio

### 7.1 Header et navigation

```css
.st-header {
  background: var(--st-bleugris);
  position: sticky;
  top: 0;
  z-index: 20;
  box-shadow: 0 2px 16px rgba(68, 80, 104, 0.22);
}
.st-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 32px 14px;
}
.st-logo {
  font: 800 25px/1.1 "Archivo";
  color: #fff;
}
.st-sub {
  font-size: 11.5px;
  color: #b9c0cc;
}
.st-nav {
  display: flex;
  gap: 2px;
  background: #fff;
  padding: 0 26px;
  overflow-x: auto;
  border-bottom: 1px solid var(--st-line);
}
.st-nav button {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--st-muted);
  padding: 14px 16px;
  border-bottom: 3px solid transparent;
}
.st-nav button:hover {
  color: var(--st-bleugris);
}
.st-nav button.on {
  color: var(--st-claret);
  font-weight: 800;
  border-bottom-color: var(--st-claret);
}
.st-crumb {
  background: #efe7e1;
  border-bottom: 1px solid var(--st-line);
} /* fil d'Ariane */
```

Logo Studio : badge blanc 48×48, radius 13, `border:1px solid rgba(255,255,255,.22)`.

### 7.2 Boutons Studio

```css
.st-btn {
  font: 700 13.5px "Archivo";
  border-radius: 999px;
  padding: 11px 22px;
  border: 1px solid transparent;
  transition: 0.15s;
}
.st-btn-sm {
  padding: 7px 14px;
  font-size: 12.5px;
}
.st-btn-primary {
  background: var(--st-bleugris);
  color: #fff;
}
.st-btn-primary:hover {
  background: var(--st-bleugris-2);
}
.st-btn-line {
  background: #fff;
  color: var(--st-bleugris);
  border-color: var(--st-line);
}
.st-btn-line:hover {
  border-color: var(--st-bleugris);
}
.st-btn-light {
  background: #fff;
  color: var(--st-bleugris);
}
.st-btn-light:hover {
  background: #eaecef;
} /* sur fond sombre */
.st-btn-ghost {
  background: transparent;
  color: #b9c0cc;
  border-color: rgba(255, 255, 255, 0.26);
}
.st-btn-ghost:hover {
  color: #fff;
  border-color: #fff;
}
/* Dans une barre sombre (.fi-bar, .st-cbar) le primaire devient claret */
.fi-bar .st-btn-primary,
.st-cbar .st-btn-primary {
  background: var(--st-claret);
}
```

### 7.3 Titres, cartes, KPI

```css
.st-h1 {
  font: 800 35px/1.16 "Archivo";
  letter-spacing: -0.02em;
  color: var(--titre);
  margin: 0 0 4px;
}
.st-lead {
  font-size: 14.5px;
  color: var(--st-muted);
  margin: 0 0 26px;
}
.st-h2 {
  font: 800 21px "Archivo";
  letter-spacing: -0.012em;
  color: var(--titre);
  margin: 0 0 16px;
}
.st-card {
  background: #fff;
  border: 1px solid var(--st-line);
  border-radius: 16px;
  padding: 24px 26px;
  box-shadow: var(--shadow-sm);
}
.st-kpi {
  background: #fff;
  border: 1px solid var(--st-line);
  border-radius: 16px;
  padding: 20px 22px;
  position: relative;
  overflow: hidden;
}
.st-kpi-l {
  font-size: 13px;
  color: var(--st-muted);
  margin-bottom: 8px;
}
.st-kpi-v {
  font: 800 34px/1 "Archivo";
  color: var(--titre);
}
.st-kpi-ic {
  position: absolute;
  top: 16px;
  right: 16px;
  opacity: 0.28;
}
.st-kpi.k-alert {
  background: linear-gradient(180deg, #f5f0ec, #f5e6eb);
  border-color: #ebcfd8;
} /* valeur + libellé claret */
```

### 7.4 Tableaux Studio

```css
.st-table-wrap {
  background: #fff;
  border: 1px solid var(--st-line);
  border-radius: 16px;
  overflow-x: auto;
  box-shadow: var(--shadow-sm);
}
.st-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}
.st-table th {
  text-align: left;
  font-size: 12.5px;
  font-weight: 800;
  color: var(--st-muted);
  padding: 18px 20px;
  border-bottom: 1px solid var(--st-line);
}
.st-table td {
  padding: 16px 20px;
  font-size: 14px;
  color: var(--st-bleugris);
  border-bottom: 1px solid var(--st-line);
}
.st-table tbody tr:hover {
  background: #faf9f7;
}
.st-table .name {
  font-weight: 800;
  color: var(--titre);
}
```

### 7.5 Badges de workflow éditorial

```css
.st-badge {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-radius: 6px;
  padding: 3px 9px;
}
```

| État         | Classe      | Fond      | Texte     |
| ------------ | ----------- | --------- | --------- |
| Brouillon    | `.b-draft`  | `#F4F5F7` | `#6B7589` |
| En relecture | `.b-review` | `#FDF8E8` | `#7A5A00` |
| Validé       | `.b-valid`  | `#EAECEF` | `#445068` |
| Programmé    | `.b-sched`  | `#F5E6EB` | `#670626` |
| Publié       | `.b-pub`    | `#EAF7F6` | `#0B6E6C` |
| Historique   | `.b-hist`   | `#F4F5F7` | `#6B656B` |
| Archivé      | `.b-arch`   | `#F5F0EC` | `#857E82` |

Pastilles de suivi client (`.st-pill`) : radius 12, `padding:10px 22px`, 13 px 800 blanc, min-width 116 ; `vert #0E8A87` · `jaune #B8860B` · `rouge #C0343C`. Lignes équivalentes : `border-left:4px solid <statut>`.

Étiquettes (`.tg`) : 9.5 px 800 uppercase `.05em`, radius 5, `padding:3px 8px`, couples fond/texte pris dans les palettes ci-dessus.

### 7.6 Formulaires Studio

```css
.st-field label {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--st-bleugris);
  margin-bottom: 6px;
}
.st-field input,
.st-field select,
.st-field textarea {
  width: 100%;
  font-size: 14px;
  border: 1px solid var(--st-line);
  border-radius: 10px;
  padding: 11px 13px;
  background: #fff;
}
.st-field :focus {
  outline: none;
  border-color: var(--st-bleugris);
}
.st-check {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border: 1.5px solid var(--st-line);
  border-radius: 11px;
  background: #fff;
}
.st-check.on {
  border-color: var(--st-bleugris);
  background: var(--st-bleugris-soft);
}
.st-check input {
  width: 20px;
  height: 20px;
  accent-color: var(--st-bleugris);
}
.req {
  color: #c0343c;
} /* astérisque obligatoire */
```

### 7.7 Stepper, workflow, barres d'administration

- **Stepper** : pastilles rondes 38 px, bordure 2 px bleu-gris, chiffre 15 px 800 ; faites/courante = pleines ; liaison 2 px (`--st-line` → bleu-gris si franchie) ; libellé 11.5 px muted, courant 800.
- **Workflow** (`.wf-s`) : radius 12, `padding:13px 18px`, 12.5 px 800, fond bleu-gris doux + bordure 1.5 px ; étape courante = vert succès plein, texte blanc.
- **Barre d'admin de fiche / contenu** (`.fi-bar`, `.st-cbar`) : fond bleu-gris, texte blanc, radius 14, `padding:12px 18px` ; clés 10.5 px 800 `#B9C0CC` ; CTA claret.
- **Bandeau fixe de visualisation client** (`.cv-banner`, `.scb`) : `position:fixed; top:0; z-index:300`, fond bleu-gris, pastille d'état 9 px (ambre ou claret), décale le `body` de 46 px.
- **Identifiant technique** (`.tech-id`) : IBM Plex Mono 10.5 px, fond `#F5F0EC`, texte `#9A959A`, radius 5.

### 7.8 Menu déroulant, onglets, éditeur riche

```css
.dd-menu {
  position: fixed;
  z-index: 400;
  background: #fff;
  border: 1px solid var(--st-line);
  border-radius: 14px;
  box-shadow: 0 14px 38px rgba(68, 80, 104, 0.24);
  padding: 7px;
  min-width: 262px;
}
.dd-i {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--st-bleugris);
  padding: 10px 13px;
  border-radius: 10px;
}
.dd-i:hover {
  background: #faf9f7;
}
.dd-sep {
  height: 1px;
  background: var(--st-line);
  margin: 5px 9px;
}
.ct-tab {
  font-size: 13px;
  font-weight: 700;
  color: var(--st-muted);
  background: #fff;
  border: 1px solid var(--st-line);
  border-radius: 999px;
  padding: 9px 16px;
}
.ct-tab.on {
  background: var(--st-claret);
  color: #fff;
  border-color: var(--st-claret);
}
/* Éditeur riche */
.art-tb {
  display: flex;
  gap: 3px;
  background: #fff;
  border: 1px solid var(--st-line);
  border-radius: 12px 12px 0 0;
  padding: 7px 9px;
}
.art-tb-b {
  min-width: 30px;
  height: 30px;
  border-radius: 7px;
  color: var(--st-bleugris);
}
.art-tb-b:hover {
  background: var(--st-bleugris-soft);
  border-color: var(--st-line);
}
.art-ed {
  min-height: 340px;
  border: 1px solid var(--st-line);
  border-top: none;
  border-radius: 0 0 12px 12px;
  padding: 20px 22px;
  font-size: 15.5px;
  line-height: 1.75;
}
```

**Comparaison avant/après** (prépublication) : ancienne valeur fond `#F5F0EC`, texte `#8C96A8` barré ; nouvelle valeur fond succès, texte `#0B6E6C` 800.

### 7.9 Écran de connexion Studio

```css
.st-login {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(155deg, #445068, #364054 45%, #670626);
}
.st-login-card {
  background: #fff;
  border-radius: 22px;
  padding: 44px 42px;
  width: min(430px, 92vw);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
  text-align: center;
}
.st-login-logo {
  font: 800 32px "Archivo";
  letter-spacing: -0.015em;
  color: var(--titre);
}
```

---

## 8. Iconographie

Jeu SVG inspiré de **Lucide** :

```js
function ico(name, size = 18) {
  return `<svg class="ic-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}
```

- Taille : **17 px** dans la navigation, 18 px par défaut, 20–24 px dans les en-têtes de rubrique.
- Couleur : toujours `currentColor` (hérite du texte).
- Icônes présentes : `zap home users calendar book news chart trophy tag radar help search bell user edit trash plus check x eye send alert clock lock chat file book2 history logout settings`.
- Pour tout nouveau pictogramme : utiliser `lucide` (même grille, même trait), jamais d'emoji.

---

## 9. Tonalité de contenu (micro-copie)

- Vouvoiement, ton expert et rassurant : « Cliquez sur une journée pour consulter le détail ».
- Libellés d'action à l'infinitif ou impératif court : « + Nouvel article », « Ajouter », « ← Retour », « ⬇ Exporter la structure ».
- Surtitres descriptifs + titre court : « Votre année RH » / « Calendrier RH ».
- Sources toujours citées et datées (veille, chiffres) : note 11.5 px italique `--ink-soft` sur fond crème.

---

## 10. Check-list d'intégration

- [ ] Polices Archivo (400→800 + italiques) et IBM Plex Mono chargées.
- [ ] Bloc `:root` des § 2.1 → 2.5 copié tel quel.
- [ ] `body` : Archivo 14 px / 1.5, carbone sur minéral.
- [ ] Tous les titres : 800, `--titre`, letter-spacing négatif.
- [ ] Chaque page client : eyebrow framboise uppercase + `section-title` 29 px.
- [ ] Boutons/onglets/chips en pilule ; cartes 14–18 px ; champs 9–10 px.
- [ ] Ombres = `--shadow-sm` par défaut, `--shadow` au survol.
- [ ] Les 6 rubriques utilisent strictement leurs trios fond/texte/bordure.
- [ ] Client = header framboise ; Studio = header bleu-gris + accents claret.
- [ ] Icônes Lucide 2 px `currentColor`.
- [ ] Focus visible, `prefers-reduced-motion`, `.sr-only` pour les labels masqués.
- [ ] Responsive testé à 1060 / 900 / 760 / 600 px.
