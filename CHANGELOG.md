# CHANGELOG — LBP Client & LBP Studio

Toutes les évolutions notables du projet sont consignées ici.
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et la numérotation reprend celle des maquettes (`V<majeure>.<mineure>`).

> **Note sur l'historique antérieur à V9.9** : les entrées ci-dessous ont été **reconstituées à partir des commentaires du code** de la maquette `LBP_V9_9_Studio.html`. Les dates exactes et le découpage précis entre versions ne sont pas documentés dans le fichier : ils sont donc indiqués comme _non datés_. Il faut les compléter à partir des archives des maquettes précédentes si elles existent.

---

## [Non publié]

### Ajouté

- Intégration du pivot « LBP Studio » (2026-10-05) — voir section dédiée ci-dessous, détail complet dans `tickets/`.

---

## [Pivot LBP Studio] — 2026-10-05 (intégré depuis la branche `chore/environnement-de-travail-perso`)

Construction d'une **maquette de validation réelle** (code + base de données, pas une maquette HTML) du pivot Studio décrit dans le dossier de cadrage, en parallèle du développement « officiel » suivi par ticket GitHub (`DATA-XX`/`AUTH-XX`…). 186 commits, 60 tickets locaux (16 epics, voir `tickets/README.md`) + 17 entrées du backlog LBP Client. Fusionné en fast-forward (zéro conflit, zéro divergence de `main`), validé par build + lint + migrations rejouées deux fois avant intégration.

### Ajouté

- **Référentiel maître & versioning** : hiérarchie familles/thèmes/sous-thèmes/fiches indépendante de l'ancienne bibliothèque (`families`/`themes`/`sheets`, conservée telle quelle), versionnement par couche (RG/CCN/entreprise/process) à 7 statuts de workflow, 153 fiches réelles importées (nomenclature V1).
- **Multi-CCN** : catalogue IDCC normalisé, sélection par société, édition de couche CCN.
- **Moteur d'affectation** (6 origines : référentiel, questionnaire, CCN, offre, manuel, mise à jour) et sa vue `/affectations`.
- **Questionnaire maître** (17 questions réelles) et **entretiens clients annuels** (snapshot figé, comparaison, 4 paniers).
- **Veille réglementaire connectée au référentiel** : qualification, lien veille → version, connecteurs réels pour 2 sources sur 7 (Ministère du travail, Ameli) — 5 autres non configurées ou bloquées (voir `tickets/STU-VEILLE.md`).
- **Gestion clients** : assistant de création en 8 étapes, fiche client complète, liste avec code couleur, prévisualisation réelle du LBP d'un client (9 pages rejouées).
- **Tableau de bord Studio**, **identité visuelle Studio** (charte bleu/claret réelle, derniers emojis éliminés), **administration** (comptes G2S, paramètres, journal d'activité).
- **Offres** : demande de montée en gamme, offres éditables par l'admin (contenu marketing sorti du code en dur).
- **Quiz rattachés au référentiel maître**.
- **Import Word natif** (DOCX) : lecture, détection CCN, écran de contrôle du mapping — testé uniquement contre des fichiers synthétiques à ce jour.
- **Portail LBP Client (re-thème complet charte V37)** : accueil, bibliothèque, actu/décrypt, chiffres paie, dictionnaire, quiz (25 s/question), offres (simulateur tarification), mon compte, mon entreprise (identité éditable, organigramme 124 avatars réels, **premier vrai stockage de fichiers de l'appli** pour les documents société), notifications (+ préférences par canal), recherche globale, prise en main, calendrier RH (56 événements 2026 réels).
- Login minimal (`app/login/`), `requireClient()`/`requireAdmin()` au niveau de chaque route.
- `lib/client/`, `lib/studio/` (dont `docx-import/`, `monitoring-connectors/`), `ui-kit/` (composants partagés Client/Studio).

### Corrigé

- **Bug transverse réel** : les relations PostgREST to-one (ex. `profiles.company_id → companies`) étaient lues comme des tableaux dans 6 endroits du code (dont `lib/auth/session.ts`) — `offer_tier` n'était en réalité jamais résolu pour aucune session client avant ce correctif.
- RCE critique Next.js (`next/og ImageResponse`, GHSA-vcvr-r3jv-pc5j) : 16.3.4 → 16.3.8.
- KPI du tableau de bord Studio artificiellement gonflés dans la maquette — recalculés sur données réelles.
- Divers écarts de fidélité texte/structure avec le prototype réel, corrigés après audit comparatif (voir `tickets/LBP-CLIENT.md`, section « audit de fidélité »).

### Connu — non fait, documenté comme tel (pas silencieusement oublié)

- Import Word : idempotence par numéro de fiche (bloqué, attend les fichiers étalons du cahier §7.6, jamais transmis).
- Assistance client (dépend d'un service tiers non choisi).
- RBAC Studio à 5 rôles (`super`/`admin`/`redac`/`valid`/`lecture`) : volontairement non construit, le modèle réel reste `admin`/`client`.
- Aucune clé réelle configurée pour Légifrance/PISTE, Brevo (e-mail/SMS), l'analyse IA de veille — fonctionnalités prêtes côté code, jamais exécutées avec succès.
- Cron de collecte de veille 10 h 30 : non mis en place (hors périmètre du dépôt local).
- `proxy.ts` ne couvre pas les nouvelles routes `app/(client)/*`/`app/(studio)/*` (protection au niveau page uniquement, pas de deuxième couche — voir `ARCHITECTURE.md` §8).

---

## [V9.9] — Maquette « Studio » (non datée)

État de référence actuel : un fichier HTML unique regroupant le LBP Client et le LBP Studio.

### Modifié

- **Titres renforcés** : plus gros et en graisse 800 sur les deux applications. La couleur des titres passe à `#33405A` (bleu-gris assombri) pour gagner en lisibilité sans changer la palette (`section-title` 29 px, `st-h1` 35 px).

### Constaté (à corriger, voir `TASK.md` Phase 6)

- Heure de notification de veille incohérente entre le texte d'aide (10 h 30) et la configuration (`11:00`).
- Mots de passe de démonstration en clair et sanitisation du contenu riche par regex.

---

## [V9.4] (non datée)

### Ajouté

- Styles complémentaires conservés tels quels : marqueur d'import `.imp-s`, introduction CCN `.ccn-intro`, encarts de mapping existant `.map-exist` (variante `.diff` en ambre).

---

## [V9.x] — Alignement sur la charte du site vitrine G2S V37 (non daté)

### Modifié

- **Nouvelle charte G2S** : framboise `#670626`, carbone `#445068`, minéral `#FAF9F7`, police **Archivo**. Elle est appliquée par une couche CSS finale qui prime sur les styles historiques. Les anciens noms de variables (`--sage`, `--coral`, `--blue`…) sont conservés comme alias, seules leurs valeurs changent.
- **Header Client** : il devient un bandeau framboise, avec une navigation en pilules translucides et un onglet actif crème.
- **Boutons** : pilules framboise, qui passent au framboise foncé au survol.
- **Message d'accueil** : il s'affiche sur fond framboise, comme le hero du site vitrine.
- **Chiffres clés** : suite de couleurs carbone · framboise · framboise foncé · crème.
- **Points de vigilance** : la rubrique passe du jaune au **rouge brique**.
- Le **LBP Studio** adopte le même habillage que le Client (fond crème, arrondis, typographie). Seules les couleurs d'identité diffèrent : bleu-gris et claret.

### Ajouté

- **Fonds photographiques par page** côté Client, sous un voile minéral (accueil, entreprise, calendrier, bibliothèque, actu, chiffres, dictionnaire, quiz, offres).
- **Actu-Veille** : nouvelle mise en page avec article « à la une », grille, colonne « Ne rien manquer » et « En bref », et couvertures éditoriales G2S sans image (`.g2-cover`).
- **Page article Client** pleine page (jamais une modale) et **éditeur riche** dans le Studio (gras, italique, surlignage, listes, encadrés, tableaux).
- **Jeu d'icônes SVG** de style Lucide, qui remplace progressivement les emojis.
- Barre d'administration Studio sur les pages de contenu, et menu déroulant « Contenus LBP ».
- **Import Word** : lecture native du `.docx` sans dépendance, détection par styles (Titre 1/2/3) et reconnaissance générique des sous-rubriques.

### Modifié

- **Import Word** : il n'existe plus qu'un **moteur unique**, qui passe obligatoirement par l'écran de contrôle du mapping. Le remplissage direct et silencieux du formulaire est supprimé, car il court-circuitait le contrôle et perdait les tableaux et les listes.
- **`ARTICLES`** devient la source unique des articles Actu (l'ancienne collection distincte est supprimée).
- **Offres** : le client ne peut plus changer artificiellement de niveau d'accès. Il consulte son offre et peut demander une évolution.
- **Gestion des CCN** : rapprochement par **IDCC normalisé**, jamais par libellé. L'ancienne gestion est remplacée et reste présente en code mort `_old_*`.
- **Blocs conventionnels** : remplacés convention par convention, jamais fusionnés.

---

## [V7] — LBP Studio · socle (non daté)

### Ajouté

- **LBP Studio** : application interne G2S distincte du Client (coque autonome, URL distincte prévue en production).
- **Base partagée simulée** : toutes les données appartiennent à G2S et non au compte connecté. Une modification faite par un utilisateur G2S est visible par les autres.
- **Utilisateurs et rôles G2S** : super administrateur, administrateur, rédacteur, validateur, lecture seule.
- **Journal commun** des actions et **tâches « À traiter »** synchronisées, avec résolution automatique.
- **Référentiel maître** à 4 niveaux (Famille → Thème → Sous-thème → Fiche → Version RG/CCN), entièrement administrable.
- **Versions conventionnelles** : socle national hérité et surcharges par CCN (seules les parties modifiées sont stockées).
- **Moteur d'affectation** à 5 origines traçables (référentiel, questionnaire, CCN, offre, manuel) et désaffectation tracée.
- **Contenus maîtres** : trois origines de données (`MASTER`, `CLIENT_SPEC`, `CLIENT_OWN`), avec une source de vérité et plusieurs emplacements d'affichage.
- **Composant commun de publication et de notification** : diff, emplacements, clients impactés, canaux, programmation.
- **Circuit complet de veille réglementaire** (§ 53), des 7 sources officielles jusqu'à l'historique.
- **Assistant de création client** en 9 étapes.
- **Visualisation du LBP d'un client** depuis le Studio.
- Paramètres administrables : seuils d'entretien et heure et canaux de notification de veille.

### Supprimé

- Le **« Mode G2S édition »** du LBP Client : veille, création et modification de fiche, prévisualisation, validation et publication sont reprises dans le Studio.
- La **veille réglementaire côté client** : elle devient un outil strictement interne G2S.
- Les **onglets Studio** « Affectations », « Quiz » et « Validation » : ils sont intégrés respectivement aux fiches client et au référentiel, aux fiches, et aux workflows de veille, de fiche et de publication.

---

## [V6] et antérieures

Mentionnées dans le code sans détail exploitable. À compléter à partir des archives de maquettes.
