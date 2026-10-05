-- STU-DATA-01 — Référentiel maître du pivot Studio.
-- Tables nouvelles, n'altère aucune table existante (families/themes/sheets
-- de l'ancien modèle restent intactes). Réutilise is_admin() et
-- set_updated_at() déjà définies dans la baseline.

create table ccn_catalog (
  idcc text primary key,
  name text not null
);

insert into ccn_catalog (idcc, name) values
  ('1486', 'Syntec — Bureaux d''études techniques'),
  ('1527', 'Immobilier'),
  ('3043', 'Propreté et services associés'),
  ('2149', 'Activités du déchet'),
  ('1979', 'Hôtels, cafés, restaurants (HCR)'),
  ('0016', 'Transports routiers'),
  ('2216', 'Commerce de détail et de gros à prédominance alimentaire'),
  ('1090', 'Services de l''automobile'),
  ('0787', 'Cabinets d''experts-comptables'),
  ('1996', 'Pharmacie d''officine'),
  ('2511', 'Sport'),
  ('1517', 'Commerces de détail non alimentaires');

create table master_families (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  name          text not null,
  display_order integer not null default 0
);

insert into master_families (code, name, display_order) values
  ('FAM-VIE', 'Vie du salarié', 1),
  ('FAM-REM', 'Rémunération', 2),
  ('FAM-COT', 'Cotisations', 3);

create table master_themes (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  family_id     uuid not null references master_families(id) on delete cascade,
  name          text not null,
  display_order integer not null default 0
);
create index idx_master_themes_family on master_themes(family_id);

create table master_subthemes (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  theme_id      uuid not null references master_themes(id) on delete cascade,
  name          text not null,
  display_order integer not null default 0
);
create index idx_master_subthemes_theme on master_subthemes(theme_id);

-- status dénormalisé depuis la version "rg" courante (voir STU-DATA-02),
-- tenu à jour par l'application au moment de chaque transition de statut.
create table master_sheets (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  family_id   uuid not null references master_families(id),
  theme_id    uuid not null references master_themes(id),
  subtheme_id uuid references master_subthemes(id),
  title       text not null,
  tags        text[] not null default '{}',
  -- type text provisoire : passera à l'enum workflow_status créé en STU-DATA-02
  status      text not null default 'draft'
    check (status in ('draft', 'review', 'valid', 'scheduled', 'published', 'historized', 'archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_master_sheets_theme on master_sheets(theme_id);
create index idx_master_sheets_status on master_sheets(status);

create trigger trg_master_sheets_updated_at
  before update on master_sheets
  for each row execute function set_updated_at();

alter table ccn_catalog      enable row level security;
alter table master_families  enable row level security;
alter table master_themes    enable row level security;
alter table master_subthemes enable row level security;
alter table master_sheets    enable row level security;

create policy ccn_catalog_read      on ccn_catalog      for select using (true);
create policy master_families_read  on master_families  for select using (true);
create policy master_themes_read    on master_themes    for select using (true);
create policy master_subthemes_read on master_subthemes for select using (true);

create policy master_families_write_admin   on master_families  for insert with check (is_admin());
create policy master_families_update_admin  on master_families  for update using (is_admin());
create policy master_families_delete_admin  on master_families  for delete using (is_admin());
create policy master_themes_write_admin     on master_themes    for insert with check (is_admin());
create policy master_themes_update_admin    on master_themes    for update using (is_admin());
create policy master_themes_delete_admin    on master_themes    for delete using (is_admin());
create policy master_subthemes_write_admin  on master_subthemes for insert with check (is_admin());
create policy master_subthemes_update_admin on master_subthemes for update using (is_admin());
create policy master_subthemes_delete_admin on master_subthemes for delete using (is_admin());

create policy master_sheets_read         on master_sheets for select using (status = 'published' or is_admin());
create policy master_sheets_write_admin  on master_sheets for insert with check (is_admin());
create policy master_sheets_update_admin on master_sheets for update using (is_admin());
create policy master_sheets_delete_admin on master_sheets for delete using (is_admin());

grant select, insert, update, delete on ccn_catalog, master_families, master_themes, master_subthemes, master_sheets to authenticated;
grant select on ccn_catalog, master_families, master_themes, master_subthemes, master_sheets to anon;
