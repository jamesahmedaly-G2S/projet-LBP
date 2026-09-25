-- STU-VEILLE-02 — Qualification d'une entrée de veille vers une fiche
-- maître. `legal_monitoring.sheet_id` (colonne de James) référence son
-- ancienne table `sheets`, pas `master_sheets` (pivot Studio) : on ne peut
-- pas la réutiliser sans se tromper de modèle. Table additive, ne modifie
-- rien chez James — même pattern que company_sheet_overrides (STU-DATA-05).
create table legal_monitoring_qualifications (
  legal_monitoring_id uuid primary key references legal_monitoring(id) on delete cascade,
  master_sheet_id      uuid not null references master_sheets(id) on delete cascade,
  is_new_sheet          boolean not null default false,
  qualified_by          uuid references profiles(id) on delete set null,
  qualified_at          timestamptz not null default now()
);
create index idx_legal_monitoring_qualifications_sheet on legal_monitoring_qualifications (master_sheet_id);

alter table legal_monitoring_qualifications enable row level security;
create policy legal_monitoring_qualifications_admin_all on legal_monitoring_qualifications for all using (is_admin());

grant select, insert, update, delete on legal_monitoring_qualifications to authenticated;
