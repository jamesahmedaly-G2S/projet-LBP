-- STU-INTERVIEW-02 : "identifier les impacts" (§11) suppose de comparer les
-- fiches affectées avant/pendant l'entretien. `company_sheet_affectations`
-- est une vue toujours "live" (recalculée à chaque lecture, STU-DATA-05) —
-- rien n'y garde l'état du moment où l'entretien a commencé. Un instantané
-- pris une seule fois, au démarrage de l'entretien (startInterview()),
-- permet de comparer cet instantané à la vraie vue relue en direct après
-- les modifications — jamais une deuxième implémentation du calcul
-- d'affectation, seulement une photo de son résultat à un instant T.
alter table company_interviews add column before_sheet_ids uuid[];
