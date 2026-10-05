-- Écran G2S manquant, signalé par l'utilisateur ("tout doit se faire
-- depuis l'espace G2S") : ccn_catalog n'avait qu'une policy de lecture
-- (`ccn_catalog_read`, migration 20260925085051), jamais de policy
-- d'écriture — jamais géré par aucun écran depuis le début du projet.
alter table ccn_catalog enable row level security;

create policy ccn_catalog_write_admin on ccn_catalog for insert with check (is_admin());
create policy ccn_catalog_update_admin on ccn_catalog for update using (is_admin());
create policy ccn_catalog_delete_admin on ccn_catalog for delete using (is_admin());
