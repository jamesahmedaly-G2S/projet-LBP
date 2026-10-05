-- Corrige une fuite de donnees cross-societe : la vue company_current_answers
-- (20260925100539_entretiens_et_reponses_entreprise.sql) n'a aucun filtre,
-- contrairement aux deux autres vues du meme pivot (company_sheet_affectations,
-- client_sheet_content) qui reimplementent explicitement is_admin() or
-- company_id = current_company_id(). Une vue sans security_invoker = true
-- (defaut) s'execute avec les privileges de son proprietaire -- les
-- migrations tournent en postgres (superutilisateur, RLS ignoree) -- donc
-- la policy correcte sur company_questionnaire_answers n'est jamais
-- evaluee en passant par cette vue, deja accordee a authenticated.
--
-- Exploitation avant correctif : n'importe quel compte client authentifie
-- pouvait lire GET /rest/v1/company_current_answers et recuperer les
-- reponses au questionnaire maitre de TOUTES les societes clientes.
create or replace view company_current_answers as
select distinct on (company_id, question_code)
  company_id, question_code, answer_value, answered_at, interview_id
from company_questionnaire_answers
where is_admin() or company_id = current_company_id()
order by company_id, question_code, answered_at desc;
