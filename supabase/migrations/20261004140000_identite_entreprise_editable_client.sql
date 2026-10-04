-- LBP-CLIENT-02 : alignement avec le vrai prototype (openIdentEditor(),
-- LBP_V9.9_Studio.html ~L12261-12274) -- le client y édite lui-même
-- raison sociale/forme/effectif/SIRET/convention collective/logo, pas
-- seulement les établissements. Notre RLS actuelle (companies_update_admin,
-- admin uniquement) l'en empêchait.
--
-- Pas de nouvelle policy UPDATE brute sur "id = current_company_id()" :
-- ça exposerait TOUTES les colonnes de companies à l'écriture client, y
-- compris `offer_tier` (qui gouverne le palier tarifaire/les
-- fonctionnalités débloquées, cf. offer_tiers.includes_cba/
-- includes_agreements) -- une vraie faille d'escalade de privilèges (le
-- client s'auto-attribuerait l'offre la plus chère gratuitement). À la
-- place, une fonction dédiée qui ne touche que les colonnes d'identité
-- éditables, même pattern que seed_weekly_tasks/
-- check_and_increment_chat_quota (SECURITY DEFINER + périmètre explicite,
-- jamais un accès table brut).
--
-- `url_pictures` existe déjà dans companies depuis la baseline
-- (20260923121802) -- jamais consommée par aucun écran avant ce
-- correctif, même pattern que team_members/payroll_org/software_stack
-- avant LBP-CLIENT-02 : réutilisée telle quelle pour le logo (stocké en
-- data URL base64, comme le fait le prototype lui-même via FileReader --
-- aucune vraie infrastructure de stockage de fichiers construite nulle
-- part dans l'appli, Studio compris). Seul `siret` manquait réellement.
alter table companies add column if not exists siret text;

create or replace function update_company_identity(
  p_company_name text,
  p_legal_form text,
  p_headcount text,
  p_siret text,
  p_cba text,
  p_update_logo boolean default false,
  p_logo_url text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_company_id() is null then
    raise exception 'Aucune société rattachée à ce compte.';
  end if;

  update companies set
    company_name = p_company_name,
    legal_form   = p_legal_form,
    headcount    = p_headcount,
    siret        = p_siret,
    cba          = p_cba,
    url_pictures = case when p_update_logo then p_logo_url else url_pictures end
  where id = current_company_id();
end;
$$;

-- `p_update_logo` distingue "ne pas toucher au logo" (false, défaut) de
-- "le remplacer par p_logo_url" (true -- y compris par null pour le
-- retirer, cf. removeLogo() du prototype) : un simple paramètre texte
-- nullable n'aurait pas pu porter cette différence entre "pas de
-- nouveau fichier" et "retirer le logo existant".
grant execute on function update_company_identity(text, text, text, text, text, boolean, text) to authenticated;
