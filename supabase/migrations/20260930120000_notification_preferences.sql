-- LBP-CLIENT-10 (finitions, 30/09/2026) : "Mes notifications" -- dernier
-- bloc manquant de "Mon compte" [§1.11, p.12-13], laissé de côté à
-- l'origine faute de mécanisme de stockage des préférences par
-- utilisateur (le flux `notifications` lui-même existe depuis le début,
-- STU-WORKFLOW-07, mais jamais les préférences de canal). Vérifié contre
-- le vrai code du prototype (`renderAccount()`/`saveAccount()`, IDENTIQUE
-- dans les 3 versions disponibles -- LBP_V2-20.html, LBP_V6_Studio.html,
-- LBP_V9.9_Studio.html -- donc une vraie donnée stable du cahier, pas un
-- artefact d'une version obsolète) : `NOTIF_TYPES` (7 types réels) x un
-- canal par type (non/lbp/mail/both, `chan()`).
create table notification_preferences (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind       text not null,
  channel    text not null default 'lbp' check (channel in ('none', 'lbp', 'mail', 'both')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, kind)
);
create index idx_notification_preferences_profile on notification_preferences(profile_id);

create trigger trg_notification_preferences_updated_at
  before update on notification_preferences
  for each row execute function set_updated_at();

alter table notification_preferences enable row level security;

-- Réglage strictement personnel -- même principe que team_members_scope
-- ou calendar_events (portée "personal") : chacun ne gère que les siennes,
-- l'admin voit tout (support/diagnostic).
create policy notification_preferences_scope on notification_preferences for all
  using (is_admin() or profile_id = auth.uid());

grant select, insert, update, delete on notification_preferences to authenticated;
