-- LBP-CLIENT-02 : organigramme, suite au retour de l'utilisateur
-- ("il y a Camille Moreau avec un avatar (...) regarde bien sur la v9
-- et sois fidèle à ce qui y figure"). Les 124 avatars du prototype
-- (`var AVATARS`, `LBP_V9.9_Studio.html` ~L10175, base64 inline) avaient
-- été jugés "sans source réelle" lors de la construction initiale de ce
-- module -- erreur : ils sont bien réels, juste encodés en base64 dans
-- le même fichier. Extraits et servis comme assets statiques
-- (`public/avatars/0.jpg`..`123.jpg`), jamais stockés en base --
-- seul l'index choisi l'est ici.
alter table team_members add column if not exists avatar_index smallint not null default 0;
