-- Correctif STU-AFFECT-01 : le ticket (§7.3) liste explicitement 5 origines
-- attendues — base, questionnaire, CCN, offre, manuel. La vue livrée
-- n'en produisait que 4 ('offre' manquant). Confirmé en relisant
-- LBP_V6_Studio.html (racine de LBP_V2/, jamais consulté avant ce jour) :
-- son moteur `computeAffectation()` ajoute inconditionnellement une origine
-- 'offre' à chaque fiche affectée, en plus d'une 6e origine 'maj' (mise à
-- jour publiée) absente de mes tickets mais présente dans la référence —
-- ajoutée ici aussi, décision utilisateur du 27/09/2026.
create or replace view company_sheet_affectations as
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
    ) then 'manual' end,
    -- Toute fiche affectée l'est aussi "au titre de l'offre" : le palier
    -- commercial de la société est toujours l'un des facteurs qui
    -- autorisent sa présence (rg systématiquement inclus, ccn/ent/proc
    -- conditionnés par includes_cba/includes_agreements) — inconditionnel
    -- comme 'base', reproduisant fidèlement le prototype réel.
    'offre',
    -- Fiche déjà republiée depuis sa création (version rg > 1) : signale
    -- une mise à jour de contenu que le client a potentiellement déjà
    -- consultée dans une version antérieure.
    case when exists (
      select 1 from sheet_versions sv
      where sv.master_sheet_id = ms.id and sv.layer_kind = 'rg' and sv.status = 'published' and sv.version > 1
    ) then 'maj' end
  ], null) as origins,
  exists (
    select 1 from company_sheet_overrides o
    where o.company_id = c.id and o.master_sheet_id = ms.id and o.action = 'remove'
  ) as removed_manually
from companies c
cross join master_sheets ms
where ms.status = 'published'
  and (is_admin() or c.id = current_company_id());
