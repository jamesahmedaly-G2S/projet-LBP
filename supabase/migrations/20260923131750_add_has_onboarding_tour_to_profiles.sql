-- =============================================================================
-- DATA-15 — profiles.has_onboarding_tour
-- =============================================================================
-- Sait si l'utilisateur a deja vu le tour guide de premiere connexion
-- (epic Onboarding guide, driver.js). Demande explicite G2S, hors cahier
-- des charges initial.
alter table profiles
  add column has_onboarding_tour boolean not null default false;
