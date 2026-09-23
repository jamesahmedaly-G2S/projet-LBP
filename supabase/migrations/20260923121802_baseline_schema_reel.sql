-- =============================================================================
-- BASELINE — capture du schema reellement deploye sur staging et production
-- =============================================================================
-- Ce fichier remplace l'historique de migrations incremental precedent
-- (enable_pgcrypto, profiles_roles_and_signup_trigger) : le schema a ete
-- construit directement sur Supabase (staging et production, via le SQL
-- Editor du dashboard) en avance sur le decoupage par ticket du backlog,
-- pour ne pas bloquer l'avancement. Ce fichier fait converger le depot
-- (migrations versionnees, environnement local) vers cette realite plutot
-- que l'inverse.
--
-- Contenu identique a ce qui a ete execute sur staging (tppwmwqmldjsjqkdwqmf)
-- et production (cltrtdxhduwhbutdtdbs) le 2026-09-23, fourni via
-- db/schema.sql (hors depot git). Conventions de nommage en anglais
-- (rupture avec le premier jet francise de DATA-02) -- voir
-- docs/adr/0005-baseline-schema-et-conventions-anglaises.md.
--
-- A NOTER pour la suite : ce schema couvre largement le perimetre de
-- DATA-01 a DATA-13 (companies, profiles, bibliotheque, veille, quiz,
-- organigramme, calendrier, articles, notifications, chiffres cles) EN
-- PLUS d'un module non planifie au backlog (chatbot IA -- section 10,
-- user_chat_usage/chat_conversations/chat_messages). Les tickets DATA-XX
-- correspondants devront etre re-values (fait/a documenter a posteriori)
-- plutot que ré-implementes.

-- =============================================================================
-- RESET COMPLET DU SCHÉMA PUBLIC (Supabase)
-- =============================================================================
drop schema public cascade;
create schema public;

-- Réattributions des droits par défaut pour Supabase
grant all on schema public to postgres;
grant all on schema public to public;
grant usage on schema public to anon, authenticated, service_role;

-- =============================================================================
-- 0. EXTENSIONS & ACCÈS AUTH
-- =============================================================================
create extension if not exists pgcrypto; -- gen_random_uuid()

-- Accessibilité du schéma auth pour les clés étrangères
grant usage on schema auth to postgres, anon, authenticated, service_role;

-- =============================================================================
-- 1. TYPES ÉNUMÉRÉS (ENUMS EN ANGLAIS)
-- =============================================================================
create type user_role as enum ('admin', 'client');
create type event_scope as enum ('national', 'company', 'personal');
create type event_type as enum ('mandatory', 'advisory', 'news');
create type task_status as enum ('todo', 'doing', 'done');
create type recurrence_type as enum ('fixed', 'monthly', 'nth_day_of_week', 'last_day_of_week', 'easter');
create type article_type as enum ('article', 'pdf');
create type regulatory_status as enum ('new', 'linked', 'processed');
create type account_status as enum ('invited', 'active', 'disabled');
create type message_role as enum ('user', 'assistant', 'system');

-- =============================================================================
-- 2. FONCTIONS UTILITAIRES COMMUNES
-- =============================================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- 3. OFFRES COMMERCIALES & SOCIÉTÉS
-- =============================================================================
create table offer_tiers (
  tier_level             smallint primary key,
  name                   text not null,
  price_label            text not null,
  includes_cba           boolean not null default false,
  includes_agreements    boolean not null default false,
  unlocks_detail         boolean not null default false,
  max_messages_per_month integer not null default 50
);
comment on table offer_tiers is 'Référentiel des 4 offres commerciales.';

insert into offer_tiers (tier_level, name, price_label, includes_cba, includes_agreements, unlocks_detail, max_messages_per_month) values
  (1, 'Le Socle',        '149 € HT',                         false, false, false, 50),
  (2, 'La Branche',      '349 € HT',                         true,  false, true,  200),
  (3, 'Le Référentiel',  '600 € HT',                         true,  true,  true,  500),
  (4, 'Le Sur-mesure',   'À partir de 990 € HT sur devis', true,  true,  true,  0); -- 0 = Illimité

create table companies (
  id           uuid primary key default gen_random_uuid(),
  company_name text not null,
  legal_form   text,
  headcount    text,
  cba          text,
  url_pictures text,
  offer_tier   smallint not null default 1 references offer_tiers(tier_level),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_companies_updated_at
  before update on companies
  for each row execute function set_updated_at();

create table establishments (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name       text not null,
  address    text,
  created_at timestamptz not null default now()
);
create index idx_establishments_company on establishments(company_id);

-- =============================================================================
-- 4. COMPTES & PROFILS UTILISATEURS
-- =============================================================================
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  role       user_role not null default 'client',
  full_name  text not null,
  job_title  text,
  department text,
  phone      text,
  status     account_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_company on profiles(company_id);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- =============================================================================
-- 5. FONCTIONS D'AIDE RLS (CENTRALISÉES)
-- =============================================================================
create or replace function current_company_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select company_id from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

create or replace function current_offer_tier()
returns smallint
language sql stable
security definer
set search_path = public
as $$
  select c.offer_tier from companies c
  join profiles p on p.company_id = c.id
  where p.id = auth.uid();
$$;

-- =============================================================================
-- 6. BIBLIOTHÈQUE & VUE SÉCURISÉE (SHEETS)
-- =============================================================================
create table families (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  icon          text,
  display_order integer not null default 0
);

create table themes (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families(id) on delete cascade,
  display_order integer not null default 0,
  title         text not null,
  description   text
);
create index idx_themes_family on themes(family_id);

create table sheets (
  id         uuid primary key default gen_random_uuid(),
  theme_id   uuid not null references themes(id) on delete cascade,
  title      text not null,
  summary    text,
  understand jsonb not null default '{}'::jsonb,
  detail     jsonb not null default '{}'::jsonb,
  caution    text,
  quick_quiz text,
  published  boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index idx_sheets_theme on sheets(theme_id);
create index idx_sheets_published on sheets(published);

create trigger trg_sheets_updated_at
  before update on sheets
  for each row execute function set_updated_at();

create table sheet_updates (
  id           uuid primary key default gen_random_uuid(),
  sheet_id     uuid not null references sheets(id) on delete cascade,
  summary      text not null,
  source       text,
  validated    boolean not null default false,
  validated_at timestamptz,
  created_at   timestamptz not null default now()
);
create index idx_sheet_updates_sheet on sheet_updates(sheet_id);

-- Vue sécurisée restreignant le contenu selon l'offre souscrite
create view sheets_secured as
select
  s.id,
  s.theme_id,
  s.title,
  s.summary,
  case
    when is_admin() then s.understand
    else jsonb_build_object(
      'law', s.understand->'law',
      'cba', case when (select includes_cba from offer_tiers where tier_level = current_offer_tier()) then s.understand->'cba' else null end,
      'agreements', case when (select includes_agreements from offer_tiers where tier_level = current_offer_tier()) then s.understand->'agreements' else null end
    )
  end as understand,
  case
    when is_admin() then s.detail
    when (select unlocks_detail from offer_tiers where tier_level = current_offer_tier()) then s.detail
    else null
  end as detail,
  s.caution,
  s.quick_quiz,
  s.published,
  s.updated_at
from sheets s
where s.published = true or is_admin();

-- =============================================================================
-- 7. VEILLE RÉGLEMENTAIRE
-- =============================================================================
create table legal_monitoring (
  id               uuid primary key default gen_random_uuid(),
  source           text not null,
  text_type        text,
  title            text not null,
  text_date        date,
  publication_date date,
  effective_date   date,
  link             text,
  summary          text,
  impact           text,
  sheet_id         uuid references sheets(id) on delete set null,
  status           regulatory_status not null default 'new',
  created_at       timestamptz not null default now()
);
create index idx_legal_monitoring_sheet on legal_monitoring(sheet_id);

-- =============================================================================
-- 8. QUIZZES
-- =============================================================================
create table quizzes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  theme_id    uuid references themes(id) on delete set null,
  description text,
  questions   text not null,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_quizzes_updated_at
  before update on quizzes
  for each row execute function set_updated_at();

create table quiz_scores (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  sheet_id   uuid references sheets(id) on delete cascade,
  quiz_id    uuid references quizzes(id) on delete cascade,
  score      numeric(5,2) not null,
  taken_at   timestamptz not null default now(),
  constraint quiz_scores_one_origin check (
    (sheet_id is not null and quiz_id is null) or
    (sheet_id is null and quiz_id is not null)
  )
);
create index idx_quiz_scores_profile on quiz_scores(profile_id);

-- =============================================================================
-- 9. MODULES RH & COMPLÉMENTS
-- =============================================================================

-- 9.1 Organigramme
create table team_members (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id) on delete cascade,
  manager_id   uuid references team_members(id) on delete set null,
  name         text not null,
  job_title    text,
  department   text,
  email        text,
  phone        text,
  avatar_index smallint,
  created_at   timestamptz not null default now()
);
create index idx_team_members_company on team_members(company_id);
create index idx_team_members_manager on team_members(manager_id);

-- 9.2 Paie & Outils RH
create table payroll_org (
  company_id     uuid primary key references companies(id) on delete cascade,
  operating_mode text,
  provider_name  text
);

create table software_stack (
  company_id         uuid primary key references companies(id) on delete cascade,
  payroll_software   text,
  hris               text,
  time_management    text,
  other_tools        text,
  has_specifications boolean not null default false
);

-- 9.3 Calendrier RH & Rappels
create table calendar_rules (
  id                uuid primary key default gen_random_uuid(),
  profil_id         uuid references profiles(id) on delete set null,
  title             text not null,
  category          text,
  event_type        event_type not null,
  format_label      text,
  priority          text,
  recurrence        recurrence_type not null,
  recurrence_params jsonb not null,
  company_sizes     text[] not null,
  description       text,
  created_at        timestamptz not null default now()
);

create table calendar_events (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  scope      event_scope not null,
  event_date date not null,
  title      text not null,
  event_type event_type,
  category   text,
  priority   smallint,
  note       text,
  created_at timestamptz not null default now()
);
create index idx_calendar_events_company on calendar_events(company_id);
create index idx_calendar_events_profile on calendar_events(profile_id);
create index idx_calendar_events_date on calendar_events(event_date);

create table tasks (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title      text not null,
  due_date   date,
  note       text,
  status     task_status not null default 'todo',
  created_at timestamptz not null default now()
);
create index idx_tasks_profile on tasks(profile_id);

-- 9.4 Actu & Articles
create table articles (
  id            uuid primary key default gen_random_uuid(),
  profil_id     uuid references profiles(id) on delete set null,
  type          article_type not null default 'article',
  title         text not null,
  category      text,
  subcategories text[],
  author        text,
  published_at  date not null default current_date,
  reading_time  text,
  image_url     text,
  pdf_url       text,
  content       text,
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_articles_published on articles(published);

create trigger trg_articles_updated_at
  before update on articles
  for each row execute function set_updated_at();

-- 9.5 Notifications
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  audience   user_role not null,
  kind       text not null,
  title      text not null,
  detail     text,
  link       jsonb,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_profile on notifications(profile_id);
create index idx_notifications_company on notifications(company_id);

-- 9.6 Chiffres Clés Paie
create table key_figures (
  id     uuid primary key default gen_random_uuid(),
  key    text not null,
  year   smallint not null,
  value  numeric(12,2) not null,
  unit   text not null default '€',
  source text,
  note   text,
  unique (key, year)
);

-- =============================================================================
-- 10. AI CHATBOT (STOCKAGE & N8N)
-- =============================================================================

-- Suivi d'usage mensuel
create table user_chat_usage (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  company_id    uuid not null references companies(id) on delete cascade,
  year_month    text not null, -- Format "YYYY-MM"
  message_count integer not null default 0,
  unique (profile_id, year_month)
);
create index idx_user_chat_usage_lookup on user_chat_usage(profile_id, year_month);

-- Conversations
create table chat_conversations (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  title      text not null default 'Nouvelle conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_chat_conversations_profile on chat_conversations(profile_id);
create index idx_chat_conversations_company on chat_conversations(company_id);

create trigger trg_chat_conversations_updated_at
  before update on chat_conversations
  for each row execute function set_updated_at();

-- Messages bruts
create table chat_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references chat_conversations(id) on delete cascade,
  role            message_role not null,
  content         text not null,
  created_at      timestamptz not null default now()
);
create index idx_chat_messages_conversation on chat_messages(conversation_id);

-- Fonction de contrôle/incrémentation de quota
create or replace function check_and_increment_chat_quota(p_profile_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_tier smallint;
  v_max_allowed integer;
  v_current_month text;
  v_current_count integer;
begin
  select p.company_id, c.offer_tier
  into v_company_id, v_tier
  from profiles p
  join companies c on c.id = p.company_id
  where p.id = p_profile_id;

  select max_messages_per_month into v_max_allowed
  from offer_tiers
  where tier_level = v_tier;

  if v_max_allowed = 0 then
    return true;
  end if;

  v_current_month := to_char(now(), 'YYYY-MM');

  select message_count into v_current_count
  from user_chat_usage
  where profile_id = p_profile_id and year_month = v_current_month;

  if v_current_count is null then
    v_current_count := 0;
  end if;

  if v_current_count >= v_max_allowed then
    return false;
  end if;

  insert into user_chat_usage (profile_id, company_id, year_month, message_count)
  values (p_profile_id, v_company_id, v_current_month, 1)
  on conflict (profile_id, year_month)
  do update set message_count = user_chat_usage.message_count + 1;

  return true;
end;
$$;

-- =============================================================================
-- 11. ROW LEVEL SECURITY (RLS) - ACTIVATION ET POLITIQUES
-- =============================================================================

alter table offer_tiers        enable row level security;
alter table key_figures        enable row level security;
alter table companies          enable row level security;
alter table establishments     enable row level security;
alter table profiles           enable row level security;
alter table families           enable row level security;
alter table themes             enable row level security;
alter table sheets             enable row level security;
alter table sheet_updates      enable row level security;
alter table legal_monitoring   enable row level security;
alter table quizzes            enable row level security;
alter table quiz_scores        enable row level security;
alter table team_members       enable row level security;
alter table payroll_org        enable row level security;
alter table software_stack     enable row level security;
alter table calendar_rules     enable row level security;
alter table calendar_events    enable row level security;
alter table tasks              enable row level security;
alter table articles           enable row level security;
alter table notifications      enable row level security;
alter table user_chat_usage    enable row level security;
alter table chat_conversations enable row level security;
alter table chat_messages       enable row level security;

-- Référentiels globaux (lecture publique pour utilisateurs authentifiés)
create policy offer_tiers_read     on offer_tiers     for select using (true);
create policy families_read        on families        for select using (true);
create policy themes_read          on themes          for select using (true);
create policy calendar_rules_read  on calendar_rules  for select using (true);
create policy key_figures_read     on key_figures     for select using (true);

-- Bibliothèque de fiches (Sheets)
create policy sheets_read_admin    on sheets for select using (is_admin());
create policy sheets_write_admin   on sheets for insert with check (is_admin());
create policy sheets_update_admin  on sheets for update using (is_admin());
create policy sheets_delete_admin  on sheets for delete using (is_admin());

create policy sheet_updates_admin_all    on sheet_updates    for all using (is_admin());
create policy legal_monitoring_admin_all on legal_monitoring for all using (is_admin());

-- Sociétés & Établissements
create policy companies_select on companies for select
  using (is_admin() or id = current_company_id());
create policy companies_update_admin on companies for update
  using (is_admin());

create policy establishments_select on establishments for select
  using (is_admin() or company_id = current_company_id());
create policy establishments_write_own on establishments for insert
  with check (is_admin() or company_id = current_company_id());
create policy establishments_update_own on establishments for update
  using (is_admin() or company_id = current_company_id());
create policy establishments_delete_own on establishments for delete
  using (is_admin() or company_id = current_company_id());

-- Profils utilisateurs
create policy profiles_select on profiles for select
  using (is_admin() or id = auth.uid() or company_id = current_company_id());
create policy profiles_update_self on profiles for update
  using (is_admin() or id = auth.uid());

-- Scope Société Cliente
create policy team_members_scope on team_members for all
  using (is_admin() or company_id = current_company_id());
create policy payroll_org_scope on payroll_org for all
  using (is_admin() or company_id = current_company_id());
create policy software_stack_scope on software_stack for all
  using (is_admin() or company_id = current_company_id());
create policy calendar_events_scope on calendar_events for all
  using (is_admin() or company_id = current_company_id() or profile_id = auth.uid());
create policy notifications_scope on notifications for all
  using (is_admin() or company_id = current_company_id() or profile_id = auth.uid());

-- Données personnelles
create policy tasks_own on tasks for all
  using (is_admin() or profile_id = auth.uid());
create policy quiz_scores_own on quiz_scores for all
  using (is_admin() or profile_id = auth.uid());

-- Quizzes & Articles
create policy quizzes_read_published on quizzes for select
  using (published = true or is_admin());
create policy quizzes_write_admin  on quizzes for insert with check (is_admin());
create policy quizzes_update_admin on quizzes for update using (is_admin());
create policy quizzes_delete_admin on quizzes for delete using (is_admin());

create policy articles_read_published on articles for select
  using (published = true or is_admin());
create policy articles_write_admin  on articles for insert with check (is_admin());
create policy articles_update_admin on articles for update using (is_admin());
create policy articles_delete_admin on articles for delete using (is_admin());

-- Chatbot IA
create policy user_chat_usage_own on user_chat_usage for select
  using (is_admin() or profile_id = auth.uid());

create policy chat_conversations_own on chat_conversations for all
  using (is_admin() or profile_id = auth.uid());

create policy chat_messages_own on chat_messages for all
  using (
    is_admin() or conversation_id in (
      select id from chat_conversations where profile_id = auth.uid()
    )
  );
