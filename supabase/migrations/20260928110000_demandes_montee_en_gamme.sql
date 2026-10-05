-- STU-OFFER-02 : "Il peut demander une évolution d'offre ; G2S conserve le
-- contrôle" (§13) — table déjà spécifiée dans Nouveau dossier/
-- Modelisation-BDD-LBP.md (§ modélisation, lignes 575-584 et 744-749),
-- jamais créée jusqu'ici. Reprise à l'identique (enum, table, policies).

create type offer_request_status as enum ('pending', 'contacted', 'closed');

create table offer_change_requests (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references companies(id) on delete cascade,
  profile_id     uuid not null references profiles(id) on delete cascade,
  current_tier   smallint not null references offer_tiers(tier_level),
  requested_tier smallint not null references offer_tiers(tier_level),
  status         offer_request_status not null default 'pending',
  created_at     timestamptz not null default now(),
  processed_at   timestamptz
);
create index idx_offer_change_requests_company on offer_change_requests(company_id);

alter table offer_change_requests enable row level security;

-- Un client ne peut créer une demande que pour sa propre société et en son
-- nom ; seul G2S peut la faire passer à contacted/closed. Aucune policy
-- n'autorise quiconque à modifier companies.offer_tier depuis cet écran :
-- le palier reste un changement explicite et séparé, jamais automatique.
create policy offer_change_requests_select on offer_change_requests for select
  using (is_admin() or company_id = current_company_id());
create policy offer_change_requests_insert_own on offer_change_requests for insert
  with check (company_id = current_company_id() and profile_id = auth.uid());
create policy offer_change_requests_update_admin on offer_change_requests for update
  using (is_admin());
