-- STU-DATA-02 — Versioning et workflow à 7 statuts du pivot Studio.
-- Chaque fiche maître a 4 couches (rg/ccn/ent/proc) versionnées
-- indépendamment. Remplace le status "text + check" provisoire de
-- master_sheets (STU-DATA-01) par l'enum définitif.

create type layer_kind as enum ('rg', 'ccn', 'ent', 'proc');
create type workflow_status as enum ('draft', 'review', 'valid', 'scheduled', 'published', 'historized', 'archived');

drop policy master_sheets_read on master_sheets;
alter table master_sheets drop constraint master_sheets_status_check;
alter table master_sheets alter column status drop default;
alter table master_sheets alter column status type workflow_status using status::workflow_status;
alter table master_sheets alter column status set default 'draft';
create policy master_sheets_read on master_sheets for select using (status = 'published' or is_admin());

create table sheet_versions (
  id                  uuid primary key default gen_random_uuid(),
  master_sheet_id     uuid not null references master_sheets(id) on delete cascade,
  layer_kind          layer_kind not null default 'rg',
  ccn_idcc            text references ccn_catalog(idcc),
  company_id          uuid references companies(id) on delete cascade,
  version             integer not null,
  content             jsonb not null default '{}'::jsonb,
  motif               text,
  status              workflow_status not null default 'draft',
  scheduled_at        timestamptz,
  published_at        timestamptz,
  author_id           uuid references profiles(id) on delete set null,
  legal_monitoring_id uuid references legal_monitoring(id) on delete set null,
  created_at          timestamptz not null default now(),
  constraint sheet_versions_layer_scope check (
    (layer_kind = 'rg' and ccn_idcc is null and company_id is null)
    or (layer_kind = 'ccn' and ccn_idcc is not null and company_id is null)
    or (layer_kind in ('ent', 'proc') and company_id is not null and ccn_idcc is null)
  )
);
create index idx_sheet_versions_sheet on sheet_versions (master_sheet_id);
create index idx_sheet_versions_company on sheet_versions (company_id);
create index idx_sheet_versions_legal_monitoring on sheet_versions (legal_monitoring_id);

-- une seule version publiée à la fois, par fiche + couche + clé (ccn ou société)
create unique index uidx_sheet_versions_rg on sheet_versions (master_sheet_id, version) where layer_kind = 'rg';
create unique index uidx_sheet_versions_ccn on sheet_versions (master_sheet_id, ccn_idcc, version) where layer_kind = 'ccn';
create unique index uidx_sheet_versions_client on sheet_versions (master_sheet_id, layer_kind, company_id, version) where layer_kind in ('ent', 'proc');

create unique index uidx_sheet_versions_rg_published on sheet_versions (master_sheet_id) where layer_kind = 'rg' and status = 'published';
create unique index uidx_sheet_versions_ccn_published on sheet_versions (master_sheet_id, ccn_idcc) where layer_kind = 'ccn' and status = 'published';
create unique index uidx_sheet_versions_client_published on sheet_versions (master_sheet_id, layer_kind, company_id) where layer_kind in ('ent', 'proc') and status = 'published';

create table sheet_version_recipients (
  sheet_version_id uuid not null references sheet_versions(id) on delete cascade,
  company_id       uuid not null references companies(id) on delete cascade,
  delivered_at     timestamptz not null default now(),
  primary key (sheet_version_id, company_id)
);

alter table sheet_versions enable row level security;
alter table sheet_version_recipients enable row level security;

create policy sheet_versions_admin_all on sheet_versions for all using (is_admin());
create policy sheet_version_recipients_admin_all on sheet_version_recipients for all using (is_admin());

grant select, insert, update, delete on sheet_versions, sheet_version_recipients to authenticated;
