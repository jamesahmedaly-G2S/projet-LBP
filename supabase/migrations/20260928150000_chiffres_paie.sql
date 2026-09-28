-- LBP-CLIENT-05 : "Chiffres Paie" [§1.6, p.11 : "Comparatif N-1→N, plafonds
-- toutes périodicités, taux de cotisations"]. Vérifié contre le vrai code
-- du prototype (LBP_V6_Studio.html, var CHIFFRES + renderChiffres(),
-- lignes 3113-3202) avant de construire. §1.6 du cahier des charges dit
-- explicitement "Édition G2S : la page est entièrement pilotée par des
-- données modifiables" — ce ticket ferme aussi le manque d'écran
-- d'administration déjà signalé pour `key_figures` (utilisée par
-- l'Accueil, LBP-CLIENT-01), en unifiant les deux sur la même table
-- plutôt que de dupliquer les mêmes indicateurs (SMIC/PMSS/PASS)
-- ailleurs.
--
-- Simplification assumée : le prototype stocke une "variation" (ex.
-- "▲ +3,6 %") comme un champ texte librement édité par G2S, avec un
-- risque réel d'incohérence avec les valeurs affichées. Ici, la
-- variation est calculée à l'affichage à partir des deux dernières
-- années présentes pour une clé donnée — jamais stockée, jamais
-- désynchronisable.

create table key_figure_groups (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  title         text not null,
  sub           text,
  display_order integer not null default 0
);

alter table key_figures
  add column group_id uuid references key_figure_groups(id) on delete set null,
  add column show_as_card boolean not null default false,
  add column show_in_ceiling_table boolean not null default false;

create table contribution_rates (
  id             uuid primary key default gen_random_uuid(),
  category       text,
  label          text not null,
  base           text,
  employee_rate  text,
  employer_rate  text,
  is_header      boolean not null default false,
  display_order  integer not null default 0
);

create table payroll_reference_settings (
  id             smallint primary key default 1 check (id = 1),
  title          text not null,
  intro          text not null,
  plafond_title  text not null,
  cot_title      text not null,
  source         text not null
);

alter table key_figure_groups enable row level security;
alter table contribution_rates enable row level security;
alter table payroll_reference_settings enable row level security;

create policy key_figure_groups_read on key_figure_groups for select using (true);
create policy key_figure_groups_write_admin on key_figure_groups for insert with check (is_admin());
create policy key_figure_groups_update_admin on key_figure_groups for update using (is_admin());
create policy key_figure_groups_delete_admin on key_figure_groups for delete using (is_admin());

create policy contribution_rates_read on contribution_rates for select using (true);
create policy contribution_rates_write_admin on contribution_rates for insert with check (is_admin());
create policy contribution_rates_update_admin on contribution_rates for update using (is_admin());
create policy contribution_rates_delete_admin on contribution_rates for delete using (is_admin());

create policy payroll_reference_settings_read on payroll_reference_settings for select using (true);
create policy payroll_reference_settings_write_admin on payroll_reference_settings for insert with check (is_admin());
create policy payroll_reference_settings_update_admin on payroll_reference_settings for update using (is_admin());

-- key_figures avait une policy de lecture réelle (`key_figures_read`,
-- baseline_schema_reel.sql) mais aucune policy d'écriture : jamais
-- géré par aucun écran avant ce ticket.
create policy key_figures_write_admin on key_figures for insert with check (is_admin());
create policy key_figures_update_admin on key_figures for update using (is_admin());
create policy key_figures_delete_admin on key_figures for delete using (is_admin());

grant select, insert, update, delete on key_figure_groups to authenticated;
grant select, insert, update, delete on contribution_rates to authenticated;
grant select, insert, update, delete on payroll_reference_settings to authenticated;

-- 1) Groupes
insert into key_figure_groups (code, title, sub, display_order) values
  ('smic', 'SMIC', '2026 en vigueur au 1er juin', 0),
  ('plafond-ss', 'Plafond de la Sécurité sociale', '2026 au 1er janvier', 1),
  ('autres', 'Autres repères', null, 2);

-- 2) Rattacher les repères déjà en base (Accueil) à leur groupe + activer leur affichage carte
update key_figures set group_id = (select id from key_figure_groups where code = 'smic'), show_as_card = true where key = 'smic-h';
update key_figures set group_id = (select id from key_figure_groups where code = 'smic'), show_as_card = true where key = 'smic-m';
update key_figures set group_id = (select id from key_figure_groups where code = 'plafond-ss'), show_as_card = true where key = 'pmss';
update key_figures set group_id = (select id from key_figure_groups where code = 'plafond-ss'), show_as_card = true where key = 'pass';
update key_figures set show_in_ceiling_table = true where key in ('pass','pmss');

-- 3) Nouveaux repères (cartes comparatives, 2 années comme dans le prototype)
insert into key_figures (key, year, value, unit, note, group_id, show_as_card) values
  ('smic-net', 2025, 1426, '€', '≈ 1 426 €', (select id from key_figure_groups where code = 'smic'), true),
  ('smic-net', 2026, 1477.93, '€', '≈ 1 477,93 €', (select id from key_figure_groups where code = 'smic'), true),
  ('mg', 2025, 4.22, '€', '4,22 €', (select id from key_figure_groups where code = 'autres'), true),
  ('mg', 2026, 4.25, '€', '4,25 €', (select id from key_figure_groups where code = 'autres'), true),
  ('an-repas-hcr', 2025, 4.22, '€', '4,22 €', (select id from key_figure_groups where code = 'autres'), true),
  ('an-repas-hcr', 2026, 4.25, '€', '4,25 €', (select id from key_figure_groups where code = 'autres'), true),
  ('gratification-stage', 2025, 4.35, '€', '≈ 4,35 €', (select id from key_figure_groups where code = 'autres'), true),
  ('gratification-stage', 2026, 4.50, '€', '≈ 4,50 €', (select id from key_figure_groups where code = 'autres'), true);

-- 4) Nouvelles clés du tableau plafond (périodicités), 2025+2026 uniquement
insert into key_figures (key, year, value, unit, note, show_in_ceiling_table) values
  ('plafond-trimestriel', 2025, 11775, '€', '11 775 €', true),
  ('plafond-trimestriel', 2026, 12015, '€', '12 015 €', true),
  ('plafond-quinzaine', 2025, 1963, '€', '1 963 €', true),
  ('plafond-quinzaine', 2026, 2003, '€', '2 003 €', true),
  ('plafond-hebdomadaire', 2025, 906, '€', '906 €', true),
  ('plafond-hebdomadaire', 2026, 924, '€', '924 €', true),
  ('plafond-journalier', 2025, 216, '€', '216 €', true),
  ('plafond-journalier', 2026, 220, '€', '220 €', true),
  ('plafond-horaire', 2025, 29, '€', '29 €', true),
  ('plafond-horaire', 2026, 30, '€', '30 €', true);

-- 5) Table des cotisations (35 lignes réelles — 8 en-têtes de catégorie + 27 taux)
insert into contribution_rates (category, label, base, employee_rate, employer_rate, is_header, display_order) values
  (null, 'Santé', null, null, null, true, 0),
  (null, 'Maladie, maternité, invalidité, décès', 'Salaire total', '—', '13 %', false, 1),
  (null, 'Complémentaire santé', 'Selon contrat', 'variable', 'variable', false, 2),
  (null, 'Accidents du travail – maladies professionnelles', null, null, null, true, 3),
  (null, 'Cotisation AT/MP', 'Salaire total', '—', 'variable', false, 4),
  (null, 'Retraite', null, null, null, true, 5),
  (null, 'Assurance vieillesse déplafonnée', 'Salaire total', '0,40 %', '2,11 %', false, 6),
  (null, 'Assurance vieillesse plafonnée', 'Dans la limite d''1 PSS', '6,90 %', '8,55 %', false, 7),
  (null, 'AGIRC-ARRCO tranche 1', 'Dans la limite d''1 PSS', '3,15 %', '4,72 %', false, 8),
  (null, 'AGIRC-ARRCO tranche 2', 'De 1 à 8 PSS', '8,64 %', '12,95 %', false, 9),
  (null, 'Contribution d''équilibre général (T1)', 'Dans la limite d''1 PSS', '0,86 %', '1,29 %', false, 10),
  (null, 'Contribution d''équilibre général (T2)', 'De 1 à 8 PSS', '1,08 %', '1,62 %', false, 11),
  (null, 'Contribution d''équilibre technique', 'Salaire > 1 PSS', '0,14 %', '0,21 %', false, 12),
  (null, 'Famille', null, null, null, true, 13),
  (null, 'Allocations familiales', 'Salaire total', '—', '5,25 %', false, 14),
  (null, 'Chômage', null, null, null, true, 15),
  (null, 'Assurance chômage', 'Salaire total (limite 4 PSS)', '—', '4,00 %', false, 16),
  (null, 'Cotisation AGS (FNGS)', 'Salaire total (limite 4 PSS)', '—', '0,25 %', false, 17),
  (null, 'APEC', 'Salaire total (limite 4 PSS)', '0,024 %', '0,036 %', false, 18),
  (null, 'Autres contributions patronales', null, null, null, true, 19),
  (null, 'Contribution solidarité autonomie (CSA)', 'Salaire total', '—', '0,30 %', false, 20),
  (null, 'FNAL (− de 50 salariés)', 'Limité à 1 PSS', '—', '0,10 %', false, 21),
  (null, 'FNAL (50 salariés et +)', 'Salaire total', '—', '0,50 %', false, 22),
  (null, 'Forfait social (cas général)', 'Somme assujettie', '—', '20 %', false, 23),
  (null, 'Versement mobilité', 'Salaire total', '—', 'variable', false, 24),
  (null, 'Contribution au dialogue social', 'Salaire total', '—', '0,016 %', false, 25),
  (null, 'Contribution formation professionnelle', 'Salaire total', '—', '0,55 % ou 1 %', false, 26),
  (null, 'Taxe d''apprentissage', 'Salaire total', '—', '0,68 %', false, 27),
  (null, 'CSG / CRDS', null, null, null, true, 28),
  (null, 'CSG déductible', 'Somme assujettie', '6,80 %', '—', false, 29),
  (null, 'CSG non déductible', 'Somme assujettie', '2,90 %', '—', false, 30),
  (null, 'CRDS non déductible', 'Somme assujettie', '0,50 %', '—', false, 31),
  (null, 'Réduction générale de cotisations patronales', null, null, null, true, 32),
  (null, 'Entreprises de − de 50 salariés', 'Salaire total', '—', 'max 39,81 %', false, 33),
  (null, 'Entreprises d''au moins 50 salariés', 'Salaire total', '—', 'max 40,21 %', false, 34);

-- 6) Réglages de page
insert into payroll_reference_settings (id, title, intro, plafond_title, cot_title, source) values (
  1,
  'Les chiffres de la paie 2026',
  'Comparatif 2025 → 2026 des repères de paie et taux de cotisations, à jour des derniers textes (SMIC au 1er juin 2026, plafonds au 1er janvier 2026).',
  'Plafond Sécurité sociale — toutes périodicités',
  'Taux de cotisations 2026',
  'Repères à jour des textes en vigueur — SMIC : arrêté du 22 mai 2026 (JO 24/05) ; plafonds : arrêté du 22 décembre 2025 (BOSS/URSSAF). Les taux de cotisations sont les taux de droit commun applicables ; des taux spécifiques peuvent s''appliquer selon l''effectif, la localisation ou des dispositifs d''exonération.'
);
