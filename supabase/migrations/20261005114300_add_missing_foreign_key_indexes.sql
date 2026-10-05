-- Postgres n'indexe jamais automatiquement une colonne de cle etrangere.
-- Liste etablie via la requete catalogue de reference (pg_constraint /
-- pg_index), executee sur la base locale apres application de toutes les
-- migrations -- pas une estimation a la lecture du SQL. Tables systeme
-- auth.*/storage.* volontairement exclues (gerees par Supabase).
--
-- Sans ces index, chaque JOIN sur ces colonnes et chaque ON DELETE/SET NULL
-- declenche par une suppression sur la table referencee fait un scan
-- complet de la table enfant.

create index if not exists idx_companies_offer_tier on companies (offer_tier);

create index if not exists idx_quizzes_theme on quizzes (theme_id);
create index if not exists idx_quiz_scores_quiz on quiz_scores (quiz_id);
create index if not exists idx_quiz_scores_sheet on quiz_scores (sheet_id);

create index if not exists idx_calendar_rules_profil on calendar_rules (profil_id);
create index if not exists idx_articles_profil on articles (profil_id);
create index if not exists idx_key_figures_group on key_figures (group_id);
create index if not exists idx_user_chat_usage_company on user_chat_usage (company_id);

create index if not exists idx_master_sheets_family on master_sheets (family_id);
create index if not exists idx_master_sheets_subtheme on master_sheets (subtheme_id);
create index if not exists idx_sheet_versions_author on sheet_versions (author_id);
create index if not exists idx_master_questions_condition on master_questions (condition_question_code);

create index if not exists idx_company_interviews_conducted_by on company_interviews (conducted_by);
create index if not exists idx_company_sheet_overrides_created_by on company_sheet_overrides (created_by);
create index if not exists idx_legal_monitoring_qualifications_qualified_by on legal_monitoring_qualifications (qualified_by);

create index if not exists idx_offer_change_requests_profile on offer_change_requests (profile_id);
create index if not exists idx_offer_change_requests_current_tier on offer_change_requests (current_tier);
create index if not exists idx_offer_change_requests_requested_tier on offer_change_requests (requested_tier);

create index if not exists idx_company_documents_created_by on company_documents (created_by);

-- company_questionnaire_answers.interview_id et .question_code sont des FK
-- sans index (ci-dessus les couvre individuellement), mais la vue
-- company_current_answers (voir migration precedente) filtre et ordonne
-- par (company_id, question_code, answered_at desc) via un DISTINCT ON :
-- un index composite dans cet ordre sert a la fois la FK question_code et
-- ce pattern de requete, plutot que deux index separes.
create index if not exists idx_company_questionnaire_answers_interview on company_questionnaire_answers (interview_id);
create index if not exists idx_company_questionnaire_answers_lookup
  on company_questionnaire_answers (company_id, question_code, answered_at desc);
