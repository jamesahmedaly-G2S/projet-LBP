-- LBP-CLIENT-05 (admin) : `key_figures` n'a pas de colonne `label` — les
-- libellés d'affichage vivaient uniquement dans lib/client/key-figure-labels.ts.
-- Correct pour les repères déjà connus, mais un vrai repère ajouté par
-- G2S depuis l'écran d'admin n'aurait alors qu'un libellé de repli (la
-- clé technique brute) tant qu'un développeur n'ajoute pas l'entrée dans
-- le code — contraire à l'exigence explicite de l'utilisateur ("tout
-- doit se faire depuis l'espace G2S, Pauline ne touche jamais au code").
-- `label` optionnel : quand renseigné, prioritaire sur la table de code.
alter table key_figures add column label text;
