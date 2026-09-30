-- Cahier des charges technique V9.4, §6.3 "Normalisation IDCC — règle
-- impérative" : 573, 0573, "IDCC 573" et "IDCC n° 0573" désignent la même
-- convention. §6.2 montre que la forme affichée officielle garde parfois
-- les zéros initiaux (ex. C005 = "0016" Transports routiers) : on ne peut
-- donc pas forcer idcc à sa forme strippée en stockage, seulement
-- dédupliquer par forme normalisée. company_ccns/sheet_versions
-- référencent ccn_catalog(idcc) par FK et n'ont donc pas besoin d'un
-- traitement séparé : ils héritent de la valeur stockée telle quelle.
create or replace function normalize_idcc(raw text)
returns text
language sql
immutable
as $$
  select nullif(ltrim(regexp_replace(coalesce(raw, ''), '\D', '', 'g'), '0'), '');
$$;

create unique index uidx_ccn_catalog_idcc_normalized on ccn_catalog (normalize_idcc(idcc));
