-- LBP-CLIENT-13 : "Assistance" [§1.14, "widget de chat"], suite à la
-- demande explicite de l'utilisateur d'un chatbot à arbre de décision
-- (question -> choix -> question affinée ou solution, remontée vers n8n
-- si aucun choix ne convient). Jamais simulé jusqu'ici
-- (`AssistanceButton.tsx` : "toujours bloqué faute de service tiers
-- choisi... jamais simulé") -- ce correctif construit le vrai mécanisme,
-- pas un service IA tiers (aucune clé/API externe requise pour ce flux,
-- contrairement au chat conversationnel libre qu'imaginait `chat_messages`
-- à l'origine).
--
-- Réutilise le schéma réel de James (section 10 "AI CHATBOT", jamais
-- consommé par aucun écran avant ce correctif, même pattern que
-- team_members/calendar_events avant eux) : `chat_conversations`/
-- `chat_messages` journalisent chaque question posée (role='assistant')
-- et chaque choix de l'utilisateur (role='user') ; `user_chat_usage`/
-- `check_and_increment_chat_quota()` plafonnent déjà par palier d'offre
-- (`offer_tiers.max_messages_per_month`) -- jamais dupliqué ici, un
-- "tour" de l'arbre consomme un message comme n'importe quel message de
-- chat.
--
-- `chatbot_questions`/`chatbot_options` (nouvelles tables, l'arbre
-- lui-même) : modulaire par construction -- ajouter une question depuis
-- l'administration G2S (prompt + liste d'options), sans toucher au code,
-- exactement la demande de l'utilisateur ("modulaire et simple à
-- intégrer... en ajoutant des questions côté LBP Studio").
create table chatbot_questions (
  id         uuid primary key default gen_random_uuid(),
  prompt     text not null,
  is_root    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_chatbot_questions_updated_at
  before update on chatbot_questions
  for each row execute function set_updated_at();

-- Au plus une question racine à la fois -- l'admin choisit explicitement
-- le point d'entrée de l'arbre, jamais une ambiguïté entre plusieurs
-- racines possibles.
create unique index uidx_chatbot_questions_single_root
  on chatbot_questions ((true)) where is_root;

-- Chaque option a EXACTEMENT un type de résultat : affiner (vers une
-- autre question), conclure (texte de solution), ou escalader (webhook
-- n8n -- "dans le cas où le choix est impossible... l'app va faire appel
-- à un lien n8n"). Contrainte en base, pas seulement une validation
-- d'écran admin -- un seul des trois ne peut jamais être mal configuré.
create table chatbot_options (
  id               uuid primary key default gen_random_uuid(),
  question_id      uuid not null references chatbot_questions(id) on delete cascade,
  label            text not null,
  sort_order       integer not null default 0,
  next_question_id uuid references chatbot_questions(id) on delete set null,
  solution_text    text,
  is_escalation    boolean not null default false,
  created_at       timestamptz not null default now(),
  check (
    (case when next_question_id is not null then 1 else 0 end) +
    (case when solution_text    is not null then 1 else 0 end) +
    (case when is_escalation               then 1 else 0 end) = 1
  )
);
create index idx_chatbot_options_question on chatbot_options(question_id, sort_order);

-- Référentiel consulté par tout client authentifié (comme ccn_catalog/
-- master_themes), édité uniquement depuis l'administration G2S.
alter table chatbot_questions enable row level security;
alter table chatbot_options   enable row level security;

create policy chatbot_questions_read       on chatbot_questions for select using (true);
create policy chatbot_questions_write_admin  on chatbot_questions for insert with check (is_admin());
create policy chatbot_questions_update_admin on chatbot_questions for update using (is_admin());
create policy chatbot_questions_delete_admin on chatbot_questions for delete using (is_admin());

create policy chatbot_options_read       on chatbot_options for select using (true);
create policy chatbot_options_write_admin  on chatbot_options for insert with check (is_admin());
create policy chatbot_options_update_admin on chatbot_options for update using (is_admin());
create policy chatbot_options_delete_admin on chatbot_options for delete using (is_admin());
