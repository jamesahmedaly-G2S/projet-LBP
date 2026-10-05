-- STU-CLIENT-01 : l'assistant de création client a besoin d'insérer une
-- société (étape 1) — aucune policy insert n'existait sur `companies` dans
-- la baseline (seules select/update, cf. 20260923121802), un vrai blocage
-- RLS qui aurait empêché toute écriture, pas un oubli à contourner.
create policy companies_insert_admin on companies for insert
  with check (is_admin());

-- Étape 7 "Publication" du prototype réel (LBP_V6_Studio.html, WZ_STEPS) :
-- "le seul moment où les contenus entrent dans l'espace client". Sans
-- colonne dédiée, rien ne distingue une société en cours de configuration
-- d'une société réellement publiée — ajouté pour que cette transition soit
-- réelle et traçable, pas seulement un écran de l'assistant sans effet.
alter table companies add column published_at timestamptz;
