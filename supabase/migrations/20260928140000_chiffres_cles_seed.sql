-- LBP-CLIENT-01 (Accueil) : chiffres clés (SMIC horaire/mensuel, PMSS,
-- PASS) affichés sur l'accueil client, avec historique par année.
-- `key_figures` existe déjà dans le schéma réel de James
-- (baseline_schema_reel.sql §9.6), jamais peuplée. Valeurs réelles
-- portées 1:1 depuis `var HISTO={...}` (LBP_V6_Studio.html, lignes
-- 1804-1809) — 6 années (2021-2026) par indicateur, `note` conserve le
-- détail complet (ex. double revalorisation dans l'année) quand
-- `value` (numérique, pour un affichage simple) ne retient que la
-- valeur la plus récente de l'année.
insert into key_figures (key, year, value, unit, source, note) values
  ('smic-h', 2026, 12.31, '€', 'service-public / BOSS / URSSAF', '12,02 € (janv.) · 12,31 € (juin)'),
  ('smic-h', 2025, 11.88, '€', 'service-public / BOSS / URSSAF', '11,88 €'),
  ('smic-h', 2024, 11.88, '€', 'service-public / BOSS / URSSAF', '11,65 € (janv.) · 11,88 € (nov.)'),
  ('smic-h', 2023, 11.52, '€', 'service-public / BOSS / URSSAF', '11,27 € (janv.) · 11,52 € (mai)'),
  ('smic-h', 2022, 11.07, '€', 'service-public / BOSS / URSSAF', '10,57 € (janv.) · 11,07 € (août)'),
  ('smic-h', 2021, 10.25, '€', 'service-public / BOSS / URSSAF', '10,25 €'),
  ('smic-m', 2026, 1867.02, '€', 'service-public / BOSS / URSSAF', '1 823,03 € (janv.) · 1 867,02 € (juin)'),
  ('smic-m', 2025, 1801.8, '€', 'service-public / BOSS / URSSAF', '1 801,80 €'),
  ('smic-m', 2024, 1766.92, '€', 'service-public / BOSS / URSSAF', '1 766,92 €'),
  ('smic-m', 2023, 1709.28, '€', 'service-public / BOSS / URSSAF', '1 709,28 €'),
  ('smic-m', 2022, 1603.12, '€', 'service-public / BOSS / URSSAF', '1 603,12 €'),
  ('smic-m', 2021, 1554.58, '€', 'service-public / BOSS / URSSAF', '1 554,58 €'),
  ('pmss', 2026, 4005, '€', 'service-public / BOSS / URSSAF', '4 005 €'),
  ('pmss', 2025, 3925, '€', 'service-public / BOSS / URSSAF', '3 925 €'),
  ('pmss', 2024, 3864, '€', 'service-public / BOSS / URSSAF', '3 864 €'),
  ('pmss', 2023, 3666, '€', 'service-public / BOSS / URSSAF', '3 666 €'),
  ('pmss', 2022, 3428, '€', 'service-public / BOSS / URSSAF', '3 428 €'),
  ('pmss', 2021, 3428, '€', 'service-public / BOSS / URSSAF', '3 428 €'),
  ('pass', 2026, 48060, '€', 'service-public / BOSS / URSSAF', '48 060 €'),
  ('pass', 2025, 47100, '€', 'service-public / BOSS / URSSAF', '47 100 €'),
  ('pass', 2024, 46368, '€', 'service-public / BOSS / URSSAF', '46 368 €'),
  ('pass', 2023, 43992, '€', 'service-public / BOSS / URSSAF', '43 992 €'),
  ('pass', 2022, 41136, '€', 'service-public / BOSS / URSSAF', '41 136 €'),
  ('pass', 2021, 41136, '€', 'service-public / BOSS / URSSAF', '41 136 €');
