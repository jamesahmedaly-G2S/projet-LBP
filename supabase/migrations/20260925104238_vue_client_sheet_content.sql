-- STU-DATA-07 — Vue sécurisée client_sheet_content du pivot Studio.
-- Pendant de sheets_secured (James, ancien modèle) pour le référentiel
-- maître : un client ne voit que les couches publiées auxquelles son CCN et
-- son offre donnent droit. sheet_versions reste admin-only (STU-DATA-02) :
-- cette vue est l'unique point d'accès client au contenu.
-- Couche "proc" gardée à tier_level = 4 (pas de colonne includes_proc,
-- cf. lib/studio/offer-tiers.ts, STU-DATA-06).

create view client_sheet_content as
select
  sv.id,
  sv.master_sheet_id,
  sv.layer_kind,
  sv.ccn_idcc,
  sv.company_id,
  sv.content,
  sv.status,
  sv.version,
  sv.published_at
from sheet_versions sv
where is_admin()
  or (
    sv.status = 'published'
    and (
      sv.layer_kind = 'rg'
      or (
        sv.layer_kind = 'ccn'
        and exists (
          select 1 from company_ccns cc
          where cc.company_id = current_company_id() and cc.ccn_idcc = sv.ccn_idcc
        )
        and coalesce((select includes_cba from offer_tiers where tier_level = current_offer_tier()), false)
      )
      or (
        sv.layer_kind = 'ent'
        and sv.company_id = current_company_id()
        and coalesce((select includes_agreements from offer_tiers where tier_level = current_offer_tier()), false)
      )
      or (
        sv.layer_kind = 'proc'
        and sv.company_id = current_company_id()
        and current_offer_tier() = 4
      )
    )
  );

grant select on client_sheet_content to authenticated;
