-- STU-DATA-08 — Seed de démonstration du pivot Studio.
-- Rejoué automatiquement par `supabase db reset`. Données fictives
-- reprises de LBP_V6_Studio.html (CCN_CAT, CLIENTS, QUESTIONS) : réalisme
-- des sociétés/CCN/réponses, pas les 153 fiches complètes (cf. STU-REF-04,
-- qui reste à faire pour la nomenclature intégrale).

-- --- Référentiel minimal de démonstration ---
insert into master_themes (id, code, family_id, name, display_order)
select gen_random_uuid(), 'T-VIE-DEMO', id, 'Contrats particuliers & alternance', 1 from master_families where code = 'FAM-VIE'
union all
select gen_random_uuid(), 'T-REM-DEMO', id, 'Avantages & périphériques de rémunération', 1 from master_families where code = 'FAM-REM'
union all
select gen_random_uuid(), 'T-REM-PRI-DEMO', id, 'Primes & indemnités', 2 from master_families where code = 'FAM-REM'
union all
select gen_random_uuid(), 'T-COT-DEMO', id, 'Cotisations & contributions', 1 from master_families where code = 'FAM-COT';

insert into master_sheets (id, code, family_id, theme_id, title, status)
select gen_random_uuid(), 'VIE-DEMO-001', f.id, t.id, 'Contrat d''apprentissage', 'published'::workflow_status
from master_families f join master_themes t on t.family_id = f.id and t.code = 'T-VIE-DEMO' where f.code = 'FAM-VIE'
union all
select gen_random_uuid(), 'REM-DEMO-001', f.id, t.id, 'Titres-restaurant', 'published'::workflow_status
from master_families f join master_themes t on t.family_id = f.id and t.code = 'T-REM-DEMO' where f.code = 'FAM-REM'
union all
select gen_random_uuid(), 'REM-DEMO-002', f.id, t.id, 'Véhicule de fonction', 'published'::workflow_status
from master_families f join master_themes t on t.family_id = f.id and t.code = 'T-REM-DEMO' where f.code = 'FAM-REM'
union all
select gen_random_uuid(), 'REM-DEMO-003', f.id, t.id, 'Télétravail : allocation forfaitaire', 'published'::workflow_status
from master_families f join master_themes t on t.family_id = f.id and t.code = 'T-REM-DEMO' where f.code = 'FAM-REM'
union all
select gen_random_uuid(), 'REM-DEMO-004', f.id, t.id, 'Prime d''ancienneté', 'published'::workflow_status
from master_families f join master_themes t on t.family_id = f.id and t.code = 'T-REM-PRI-DEMO' where f.code = 'FAM-REM'
union all
select gen_random_uuid(), 'COT-DEMO-001', f.id, t.id, 'Assurance chômage', 'published'::workflow_status
from master_families f join master_themes t on t.family_id = f.id and t.code = 'T-COT-DEMO' where f.code = 'FAM-COT';

-- version rg publiée pour chaque fiche (sinon rien n'est visible, cf. STU-DATA-07)
insert into sheet_versions (master_sheet_id, layer_kind, version, status, content, motif, published_at)
select id, 'rg'::layer_kind, 1, 'published'::workflow_status, jsonb_build_object('essentiel', 'Contenu de démonstration pour ' || title), 'Version initiale de démonstration', now()
from master_sheets
where code in ('VIE-DEMO-001', 'REM-DEMO-001', 'REM-DEMO-002', 'REM-DEMO-003', 'REM-DEMO-004', 'COT-DEMO-001');

-- couche CCN de démonstration (Syntec) sur la fiche prime d'ancienneté
insert into sheet_versions (master_sheet_id, layer_kind, ccn_idcc, version, status, content, published_at)
select id, 'ccn'::layer_kind, '1486', 1, 'published'::workflow_status, '{"txt":"specificite Syntec"}'::jsonb, now()
from master_sheets where code = 'REM-DEMO-004';

-- --- Questionnaire maître : les 17 questions réelles de LBP_V6_Studio.html
-- (var QUESTIONS) reprises telles quelles (STU-QUEST-01). Seules celles
-- dont l'impact correspond à une fiche de démonstration existante ont une
-- ligne dans master_question_impacts ci-dessous : le référentiel complet
-- (139 fiches) n'est pas seedé (cf. STU-REF-04), donc la plupart des 17
-- questions existent et s'affichent correctement (y compris les
-- conditionnelles) mais ne déclenchent visiblement rien sur ce jeu de
-- données réduit — fidèle au mécanisme, pas à la profondeur du catalogue.
insert into master_questions (code, type, label, required, options, condition_question_code, condition_value, display_order) values
  ('q_ccn', 'ccn', 'Sous quelle(s) convention(s) collective(s) l''entreprise est-elle soumise ?', true, null, null, null, 1),
  ('q_effectif', 'select', 'Effectif de l''entreprise', true, array['Moins de 11', '11 à 49', '50 à 249', '250 et plus'], null, null, 2),
  ('q_tr', 'bool', 'L''entreprise attribue-t-elle des titres-restaurant ?', false, null, null, null, 3),
  ('q_tr_part', 'text', 'Quel est le montant de la participation patronale ?', false, null, 'q_tr', 'oui', 4),
  ('q_vehicule', 'bool', 'Des véhicules de fonction sont-ils mis à disposition ?', false, null, null, null, 5),
  ('q_elec', 'bool', 'Ces véhicules sont-ils électriques ?', false, null, 'q_vehicule', 'oui', 6),
  ('q_logement', 'bool', 'Des logements sont-ils mis à disposition ?', false, null, null, null, 7),
  ('q_teletravail', 'bool', 'L''entreprise pratique-t-elle le télétravail ?', false, null, null, null, 8),
  ('q_mobilites', 'bool', 'Le forfait mobilités durables est-il mis en place ?', false, null, null, null, 9),
  ('q_apprentis', 'bool', 'L''entreprise emploie-t-elle des apprentis ou des alternants ?', false, null, null, null, 10),
  ('q_nuit', 'bool', 'Y a-t-il du travail de nuit ?', false, null, null, null, 11),
  ('q_forfait', 'bool', 'Des salariés sont-ils en forfait annuel en jours ?', false, null, null, null, 12),
  ('q_interessement', 'bool', 'Un accord d''intéressement ou de participation existe-t-il ?', false, null, null, null, 13),
  ('q_ppv', 'bool', 'La prime de partage de la valeur a-t-elle été versée ?', false, null, null, null, 14),
  ('q_multi_etab', 'bool', 'L''entreprise compte-t-elle plusieurs établissements ?', false, null, null, null, 15),
  ('q_dfs', 'bool', 'Une déduction forfaitaire spécifique est-elle appliquée ?', false, null, null, null, 16),
  ('q_oeth', 'bool', 'L''entreprise est-elle assujettie à l''obligation d''emploi (OETH) ?', false, null, null, null, 17);

insert into master_question_impacts (question_code, answer_value, master_sheet_id)
select 'q_tr', 'oui', id from master_sheets where code = 'REM-DEMO-001'
union all
select 'q_vehicule', 'oui', id from master_sheets where code = 'REM-DEMO-002'
union all
select 'q_teletravail', 'oui', id from master_sheets where code = 'REM-DEMO-003'
union all
select 'q_apprentis', 'oui', id from master_sheets where code = 'VIE-DEMO-001'
union all
select 'q_effectif', '250 et plus', id from master_sheets where code = 'COT-DEMO-001'
union all
select 'q_oeth', 'oui', id from master_sheets where code = 'COT-DEMO-001';

-- --- Sociétés de démonstration (reprises de CLIENTS dans LBP_V6_Studio.html) ---
insert into companies (id, company_name, legal_form, headcount, offer_tier) values
  ('a1000000-0000-0000-0000-000000000001', 'ALPHA SAS', 'SAS', '50 à 249 salariés', 2),
  ('a1000000-0000-0000-0000-000000000002', 'BETA GROUPE', 'SA', '250 et plus', 3),
  ('a1000000-0000-0000-0000-000000000003', 'GAMMA', 'SAS', '50 à 249 salariés', 4);

insert into establishments (company_id, name, address) values
  ('a1000000-0000-0000-0000-000000000001', 'Siège — Paris', '24 rue de la Paix, 75002 Paris'),
  ('a1000000-0000-0000-0000-000000000001', 'Agence Lyon', '12 rue de la République, 69002 Lyon'),
  ('a1000000-0000-0000-0000-000000000002', 'Siège — Marseille', '8 quai du Port, 13002 Marseille'),
  ('a1000000-0000-0000-0000-000000000003', 'Siège — Lille', '3 rue Nationale, 59000 Lille');

insert into company_ccns (company_id, ccn_idcc) values
  ('a1000000-0000-0000-0000-000000000001', '1486'),
  ('a1000000-0000-0000-0000-000000000001', '1527'),
  ('a1000000-0000-0000-0000-000000000002', '3043'),
  ('a1000000-0000-0000-0000-000000000003', '2149'),
  ('a1000000-0000-0000-0000-000000000003', '1486');

-- --- Utilisateurs de démonstration ---
-- Un simple INSERT dans auth.users ne suffit pas : GoTrue ignore ces
-- comptes tant qu'ils n'ont pas exactement la forme d'un utilisateur créé
-- via l'API (instance_id/aud/role/confirmed_at + une ligne auth.identities
-- correspondante) -- constaté en essayant de se connecter avec un compte
-- seedé "à la main" pour vérifier STU-REF-01. Mot de passe de démo commun :
-- Demo1234! (uniquement en local, jamais en staging/production).
-- handle_new_user() (migration de James) crée automatiquement le profil
-- (company_id + full_name) depuis raw_user_meta_data ; on complète ensuite.
-- GoTrue scanne confirmation_token/recovery_token/... en Go string (non
-- nullable) meme si la colonne SQL est nullable : NULL y fait echouer
-- toute authentification avec "converting NULL to string is unsupported"
-- (constate en testant un vrai login avec ce seed).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  phone_change, phone_change_token, email_change_token_current, reauthentication_token,
  created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  crypt('Demo1234!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb, u.meta,
  '', '', '', '', '', '', '', '',
  now(), now()
from (values
  ('a2000000-0000-0000-0000-000000000001'::uuid, 'c.moreau@alpha.fr', jsonb_build_object('company_id', 'a1000000-0000-0000-0000-000000000001', 'full_name', 'Camille Moreau')),
  ('a2000000-0000-0000-0000-000000000002'::uuid, 's.bakkali@beta.fr', jsonb_build_object('company_id', 'a1000000-0000-0000-0000-000000000002', 'full_name', 'Sonia Bakkali')),
  ('a2000000-0000-0000-0000-000000000003'::uuid, 'm.lefevre@gamma.fr', jsonb_build_object('company_id', 'a1000000-0000-0000-0000-000000000003', 'full_name', 'Marc Lefèvre')),
  ('a2000000-0000-0000-0000-000000000099'::uuid, 'pauline@groupe-2s.com', jsonb_build_object('full_name', 'Pauline Letourneur'))
) as u(id, email, meta);

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select
  gen_random_uuid(), u.id::text, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email', now(), now(), now()
from auth.users u
where u.id in (
  'a2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000002',
  'a2000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000099'
);

update profiles set job_title = 'Directrice RH', status = 'active' where id = 'a2000000-0000-0000-0000-000000000001';
update profiles set job_title = 'DRH', status = 'active' where id = 'a2000000-0000-0000-0000-000000000002';
update profiles set job_title = 'Directeur administratif', status = 'active' where id = 'a2000000-0000-0000-0000-000000000003';
update profiles set role = 'admin', status = 'active' where id = 'a2000000-0000-0000-0000-000000000099';

-- --- Réponses au questionnaire (réalisme repris de CLIENTS) ---
insert into company_questionnaire_answers (company_id, question_code, answer_value) values
  ('a1000000-0000-0000-0000-000000000001', 'q_effectif', '50 à 249'),
  ('a1000000-0000-0000-0000-000000000001', 'q_tr', 'oui'),
  ('a1000000-0000-0000-0000-000000000001', 'q_vehicule', 'oui'),
  ('a1000000-0000-0000-0000-000000000001', 'q_teletravail', 'oui'),
  ('a1000000-0000-0000-0000-000000000001', 'q_apprentis', 'oui'),
  ('a1000000-0000-0000-0000-000000000002', 'q_effectif', '250 et plus'),
  ('a1000000-0000-0000-0000-000000000002', 'q_tr', 'non'),
  ('a1000000-0000-0000-0000-000000000002', 'q_vehicule', 'oui'),
  ('a1000000-0000-0000-0000-000000000002', 'q_teletravail', 'non'),
  ('a1000000-0000-0000-0000-000000000002', 'q_apprentis', 'oui'),
  ('a1000000-0000-0000-0000-000000000003', 'q_effectif', '50 à 249'),
  ('a1000000-0000-0000-0000-000000000003', 'q_tr', 'oui'),
  ('a1000000-0000-0000-0000-000000000003', 'q_vehicule', 'non'),
  ('a1000000-0000-0000-0000-000000000003', 'q_teletravail', 'oui'),
  ('a1000000-0000-0000-0000-000000000003', 'q_apprentis', 'non');

-- --- Entretiens de démonstration (vert/jaune/rouge selon échéance) ---
insert into company_interviews (company_id, status, planned_at, completed_at, conducted_by) values
  ('a1000000-0000-0000-0000-000000000001', 'done', null, '2026-01-12', 'a2000000-0000-0000-0000-000000000099'),
  ('a1000000-0000-0000-0000-000000000002', 'done', null, '2025-11-04', 'a2000000-0000-0000-0000-000000000099'),
  ('a1000000-0000-0000-0000-000000000003', 'late', '2025-10-01', null, null);

-- --- Overrides manuels G2S (add/remove, repris de CLIENTS.manual) ---
insert into company_sheet_overrides (company_id, master_sheet_id, action, reason, created_by)
select 'a1000000-0000-0000-0000-000000000001', id, 'add', 'Demande spécifique client, hors règle automatique', 'a2000000-0000-0000-0000-000000000099'
from master_sheets where code = 'REM-DEMO-004';

insert into company_sheet_overrides (company_id, master_sheet_id, action, reason, created_by)
select 'a1000000-0000-0000-0000-000000000002', id, 'remove', 'Non applicable à ce client (motif G2S)', 'a2000000-0000-0000-0000-000000000099'
from master_sheets where code = 'REM-DEMO-002';
