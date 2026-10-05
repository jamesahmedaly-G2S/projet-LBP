-- STU-DATA-04 — Entretiens annuels et historique des réponses entreprise.
-- Nécessaire au scénario D (entretien annuel) : comparer les réponses
-- actuelles à celles données lors d'un entretien précis.

create type interview_status as enum ('to_plan', 'planned', 'done', 'late');

create table company_interviews (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  status       interview_status not null default 'to_plan',
  planned_at   date,
  completed_at date,
  conducted_by uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index idx_company_interviews_company on company_interviews (company_id);

create table company_questionnaire_answers (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references companies(id) on delete cascade,
  interview_id  uuid references company_interviews(id) on delete set null,
  question_code text not null references master_questions(code) on delete cascade,
  answer_value  text not null,
  answered_at   timestamptz not null default now()
);
create index idx_company_questionnaire_answers_company on company_questionnaire_answers (company_id);

-- dernière réponse par (société, question), tous entretiens confondus
create view company_current_answers as
select distinct on (company_id, question_code)
  company_id, question_code, answer_value, answered_at, interview_id
from company_questionnaire_answers
order by company_id, question_code, answered_at desc;

alter table company_interviews enable row level security;
alter table company_questionnaire_answers enable row level security;

create policy company_interviews_select on company_interviews for select
  using (is_admin() or company_id = current_company_id());
create policy company_interviews_write_admin on company_interviews for insert with check (is_admin());
create policy company_interviews_update_admin on company_interviews for update using (is_admin());

create policy company_questionnaire_answers_select on company_questionnaire_answers for select
  using (is_admin() or company_id = current_company_id());
create policy company_questionnaire_answers_write_admin on company_questionnaire_answers for insert with check (is_admin());

grant select, insert, update, delete on company_interviews, company_questionnaire_answers to authenticated;
grant select on company_current_answers to authenticated;
