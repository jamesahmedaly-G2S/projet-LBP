# STU-DASH — Tableau de bord Studio

---

## STU-DASH-01 — KPI de pilotage

**Priorité : Should** · **Dépendances : STU-DATA-01, STU-DATA-02, STU-CLIENT-02**

**Contexte** : "L'ouverture du Studio doit répondre immédiatement à la question : 'Qu'est-ce que G2S doit traiter aujourd'hui ?'" (§4) — clients actifs, fiches publiées, MAJ à traiter, validations en attente.

**À faire** : requêtes de comptage simples (nombre de sociétés, `master_sheets` publiées, `sheet_versions` en `review`/`scheduled`) affichées en tuiles.

**Critères d'acceptation**

- Chaque chiffre correspond exactement à ce qu'on retrouve en filtrant les écrans détaillés correspondants (pas de logique de calcul divergente).

---

## STU-DASH-02 — Blocs à traiter / activité récente

**Priorité : Could** · **Dépendances : STU-DASH-01, STU-WORKFLOW-02**

**Contexte** : "À traiter", "Entretiens clients", "Dernières publications", "Alertes", "Activité récente" (§4).

**À faire** : blocs listant les éléments en attente d'action et un journal d'activité simple (création/modification/validation/publication), consultable mais non filtrable finement pour cette version.

**Critères d'acceptation**

- Reporté sans risque si le temps manque — n'empêche aucun des scénarios A-F d'être démontré.
