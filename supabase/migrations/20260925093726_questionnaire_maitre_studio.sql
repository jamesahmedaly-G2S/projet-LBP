-- STU-DATA-03 — Questionnaire maître du pivot Studio.
-- Piloté exclusivement par G2S (le client ne répond jamais lui-même) : voir
-- lecture/écriture réservées admin dans les policies ci-dessous.

create type question_type as enum ('ccn', 'select', 'bool', 'text');

create table master_questions (
  id                      uuid primary key default gen_random_uuid(),
  code                    text not null unique,
  type                    question_type not null,
  label                   text not null,
  required                boolean not null default false,
  options                 text[],
  condition_question_code text references master_questions(code) on delete set null,
  condition_value         text,
  display_order           integer not null default 0
);

create table master_question_impacts (
  id              uuid primary key default gen_random_uuid(),
  question_code   text not null references master_questions(code) on delete cascade,
  answer_value    text not null,
  master_sheet_id uuid not null references master_sheets(id) on delete cascade
);
create index idx_master_question_impacts_question on master_question_impacts (question_code, answer_value);
create index idx_master_question_impacts_sheet on master_question_impacts (master_sheet_id);

alter table master_questions enable row level security;
alter table master_question_impacts enable row level security;

create policy master_questions_admin_all on master_questions for all using (is_admin());
create policy master_question_impacts_admin_all on master_question_impacts for all using (is_admin());

grant select, insert, update, delete on master_questions, master_question_impacts to authenticated;
