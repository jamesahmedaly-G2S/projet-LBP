-- STU-DATA-05 — Moteur d'affectation du pivot Studio.
-- Inclut company_ccns (multi-CCN, prérequis de la vue d'affectation, avancé
-- depuis STU-CCN-02 car requis ici) et réutilise offer_tiers.includes_cba
-- de James comme équivalent fonctionnel de "la CCN de la fiche est incluse
-- dans le palier" plutôt que d'altérer sa table (voir note de commit).

create type affectation_action as enum ('add', 'remove');

create table company_ccns (
  company_id uuid not null references companies(id) on delete cascade,
  ccn_idcc   text not null references ccn_catalog(idcc),
  primary key (company_id, ccn_idcc)
);

create table company_sheet_overrides (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references companies(id) on delete cascade,
  master_sheet_id uuid not null references master_sheets(id) on delete cascade,
  action          affectation_action not null,
  reason          text,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (company_id, master_sheet_id)
);

-- reconstruit à la volée les 5 origines d'affectation (§7.3) ; rien n'est
-- dupliqué par client, tout est recalculé à chaque lecture.
create view company_sheet_affectations as
select
  c.id as company_id,
  ms.id as master_sheet_id,
  array_remove(array[
    'base',
    case when exists (
      select 1 from company_current_answers a
      join master_question_impacts i on i.question_code = a.question_code and i.answer_value = a.answer_value
      where a.company_id = c.id and i.master_sheet_id = ms.id
    ) then 'questionnaire' end,
    case when exists (
      select 1 from sheet_versions sv
      join company_ccns cc on cc.company_id = c.id and cc.ccn_idcc = sv.ccn_idcc
      where sv.master_sheet_id = ms.id and sv.layer_kind = 'ccn' and sv.status = 'published'
    ) and coalesce((select includes_cba from offer_tiers where tier_level = c.offer_tier), false)
    then 'ccn' end,
    case when exists (
      select 1 from company_sheet_overrides o
      where o.company_id = c.id and o.master_sheet_id = ms.id and o.action = 'add'
    ) then 'manual' end
  ], null) as origins,
  exists (
    select 1 from company_sheet_overrides o
    where o.company_id = c.id and o.master_sheet_id = ms.id and o.action = 'remove'
  ) as removed_manually
from companies c
cross join master_sheets ms
where ms.status = 'published'
  and (is_admin() or c.id = current_company_id());

alter table company_ccns enable row level security;
alter table company_sheet_overrides enable row level security;

create policy company_ccns_select on company_ccns for select
  using (is_admin() or company_id = current_company_id());
create policy company_ccns_write_admin on company_ccns for insert with check (is_admin());
create policy company_ccns_delete_admin on company_ccns for delete using (is_admin());

create policy company_sheet_overrides_admin_all on company_sheet_overrides for all using (is_admin());

grant select, insert, delete on company_ccns to authenticated;
grant select, insert, update, delete on company_sheet_overrides to authenticated;
grant select on company_sheet_affectations to authenticated;
