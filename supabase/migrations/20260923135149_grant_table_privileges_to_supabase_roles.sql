-- =============================================================================
-- Corrige une regression du script baseline (20260923121802) : celui-ci
-- fait `drop schema public cascade; create schema public;` puis ne
-- reaccorde que `grant usage` sur le schema -- pas les privileges de
-- table que Supabase accorde par defaut a anon/authenticated/
-- service_role. Consequence, reproduite en local ET constatee cote
-- staging/production : toute requete authentifiee echoue avec
-- "permission denied for table ..." (SQLSTATE 42501), quelle que soit
-- la policy RLS definie -- Postgres verifie le GRANT de table AVANT
-- d'evaluer RLS.
--
-- Convention standard Supabase : GRANTs larges au niveau role, RLS comme
-- seule veritable barriere de securite (une policy qui retourne false
-- bloque un role qui a pourtant le GRANT). ALTER DEFAULT PRIVILEGES
-- couvre aussi les tables/sequences/fonctions futures, pas seulement
-- celles qui existent au moment de cette migration.
-- =============================================================================

grant select, insert, update, delete on all tables in schema public
  to anon, authenticated, service_role;
grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;
grant execute on all routines in schema public
  to anon, authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on routines to anon, authenticated, service_role;
