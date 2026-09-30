-- STU-IMPORT-05 : "l'annexe interne G2S (sources de contrôle, notes
-- internes) ne doit jamais sortir du Studio, jamais visible côté Client"
-- (cahier des charges V9.4 §7.3, §8.2). Colonne additive plutôt qu'une
-- clé dans `content` (jsonb) : client_sheet_content (migration
-- 20260925104238) sélectionne `sv.content` en entier -- y mettre l'annexe
-- l'exposerait au client dès qu'une version rg est publiée. Une colonne à
-- part, jamais ajoutée à la liste de colonnes de cette vue, reste
-- garantie non exposée sans dépendre d'une discipline "ne pas lire cette
-- clé" côté application.
alter table sheet_versions add column internal_annexe text;
comment on column sheet_versions.internal_annexe is 'Annexe interne G2S (STU-IMPORT-05) -- jamais sélectionnée par client_sheet_content, jamais exposée côté LBP Client.';
