-- LBP-CLIENT-15 : "Calendrier RH" -- onglet réel repéré en auditant
-- LBP_V9.9_Studio.html (nav réelle entre Accueil et Bibliothèque, id
-- "v-calendrier"), absent des 13 modules du cahier écrit et des 14 déjà
-- tracés dans tickets/LBP-CLIENT.md avant ce ticket.
--
-- Correctif important trouvé en préparant ce ticket : `calendar_events` ET
-- `calendar_rules` existent DÉJÀ dans le schéma réel déployé de James
-- (baseline_schema_reel.sql) -- jamais consommées par aucun écran jusqu'ici,
-- même schéma "table réelle oubliée, pas absente" que team_members/
-- notifications/ccn_catalog avant elles. Le premier jet de cette migration
-- créait par erreur une nouvelle table en double avant cette vérification --
-- corrigé ici, jamais appliqué (échec immédiat : "relation already exists").
--
-- `calendar_rules` (recurrence_type: fixed/monthly/nth_day_of_week/
-- last_day_of_week/easter + recurrence_params jsonb) EST le moteur de
-- récurrence complet du prototype (CAL_BASE, Pâques par l'algorithme de
-- Meeus, nième jour de semaine du mois, etc.) -- explicitement "hors phase
-- 1" (docs/ARCHITECTURE.md §7.1). Elle n'a qu'une police de lecture
-- (`calendar_rules_read ... using (true)`), aucune police d'écriture même
-- pour l'admin : jamais alimentée par James, laissée intacte et non
-- utilisée ici, conformément à la portée hors phase 1.
--
-- `calendar_events` (scope: national/company/personal, event_date DATE
-- concret -- pas une règle) est la bonne table pour ce ticket : elle
-- correspond exactement au minimum demandé ("évènements G2S vs propres à
-- une société", ici étendu au 3e niveau "personnel" que le schéma réel
-- supporte déjà et que le vrai formulaire du prototype expose
-- (openDay()/saveDayEvent(), "Portée : Personnel/Entreprise/National"),
-- sans qu'aucun calcul de récurrence ne soit jamais exécuté par
-- l'application.
--
-- Deux ajouts additifs nécessaires (aucune colonne/police existante
-- modifiée ou supprimée) :
--  1. `published` : absente de calendar_events. Sans elle, un évènement
--     national créé par un admin serait immédiatement visible de tous les
--     clients dès l'enregistrement, sans le palier brouillon/publication
--     déjà établi ailleurs (STU-WORKFLOW-07) -- même raisonnement que
--     dictionary_terms.published en son temps.
--  2. Une police de lecture supplémentaire pour les évènements nationaux :
--     la police déployée `calendar_events_scope` (`is_admin() or
--     company_id = current_company_id() or profile_id = auth.uid()`) ne
--     couvre PAS le cas company_id/profile_id tous deux NULL (scope
--     national) -- sans cet ajout, aucun client ne pourrait jamais lire un
--     évènement national, quel que soit son statut publié. Les polices
--     Postgres RLS s'additionnent (OR) : ceci ne retire aucun accès
--     existant, il en ajoute un.
alter table calendar_events add column published boolean not null default true;

create policy calendar_events_read_national on calendar_events for select
  using (scope = 'national' and company_id is null and profile_id is null and published = true);

-- Référence nationale 2026 (scope='national', tous publiés) : 11 jours
-- fériés légaux (Pâques 2026 = 5 avril, déjà vérifié dans
-- docs/ARCHITECTURE.md §8.2 -- Lundi de Pâques = 6 avril, Ascension =
-- Pâques+39 = 14 mai, Lundi de Pentecôte = Pâques+50 = 25 mai ; les deux
-- jours fériés propres à l'Alsace-Moselle, non nationaux, volontairement
-- omis). event_type porté 1:1 depuis CAL_BASE (seule la Fête du Travail
-- est "mandatory", les autres jours fériés sont "news" dans le vrai code
-- -- pas une erreur de portage). `category` reprend le vocabulaire réel de
-- CAL_TAX.theme (LBP_V9.9_Studio.html) faute de colonne "thème" dédiée.
insert into calendar_events (scope, event_date, title, category, event_type, note, published) values
('national', '2026-01-01', 'Jour de l''An',      'Jours fériés', 'news',      'Jour férié légal. Majoration éventuelle si travaillé selon la convention collective.', true),
('national', '2026-04-06', 'Lundi de Pâques',    'Jours fériés', 'news',      'Jour férié légal (date mobile).', true),
('national', '2026-05-01', 'Fête du Travail',    'Jours fériés', 'mandatory', 'Seul jour férié obligatoirement chômé et payé ; si travaillé, majoration de 100 %.', true),
('national', '2026-05-08', 'Victoire 1945',      'Jours fériés', 'news',      'Jour férié légal.', true),
('national', '2026-05-14', 'Ascension',          'Jours fériés', 'news',      'Jour férié légal (date mobile).', true),
('national', '2026-05-25', 'Lundi de Pentecôte', 'Jours fériés', 'news',      'Jour férié légal (date mobile) — souvent retenu comme journée de solidarité.', true),
('national', '2026-07-14', 'Fête nationale',     'Jours fériés', 'news',      'Jour férié légal.', true),
('national', '2026-08-15', 'Assomption',         'Jours fériés', 'news',      'Jour férié légal.', true),
('national', '2026-11-01', 'Toussaint',          'Jours fériés', 'news',      'Jour férié légal.', true),
('national', '2026-11-11', 'Armistice 1918',     'Jours fériés', 'news',      'Jour férié légal.', true),
('national', '2026-12-25', 'Noël',               'Jours fériés', 'news',      'Jour férié légal.', true);

-- 21 actions RH / temps forts réels, portés depuis RH_CAL
-- (LBP_V9.9_Studio.html, lignes ~2916-2946) -- les 8 entrées "jour férié"
-- de RH_CAL sont omises ici (doublon avec la liste ci-dessus, dont le
-- classement mandatory/news, plus fin et tiré de CAL_BASE, est celui
-- retenu).
insert into calendar_events (scope, event_date, title, category, event_type, published) values
('national', '2026-01-15', 'Lancer la campagne d''entretiens annuels', 'Formation & compétences', 'advisory', true),
('national', '2026-01-31', 'DSN de décembre — clôture de l''exercice N-1', 'Paie & déclaratif', 'mandatory', true),
('national', '2026-02-04', 'Journée mondiale contre le cancer', 'Santé & prévention', 'news', true),
('national', '2026-03-08', 'Journée internationale des droits des femmes', 'Diversité & inclusion', 'news', true),
('national', '2026-03-20', 'Journée internationale du bonheur', 'QVCT', 'news', true),
('national', '2026-04-07', 'Journée mondiale de la santé', 'Santé & prévention', 'news', true),
('national', '2026-04-28', 'Journée mondiale de la sécurité et de la santé au travail', 'Santé & prévention', 'advisory', true),
('national', '2026-05-17', 'Journée mondiale contre l''homophobie et la transphobie', 'Diversité & inclusion', 'news', true),
('national', '2026-05-31', 'Fin de la période d''acquisition des congés payés', 'Paie & déclaratif', 'mandatory', true),
('national', '2026-06-05', 'Journée mondiale de l''environnement', 'Engagement & RSE', 'news', true),
('national', '2026-06-13', 'Journée mondiale du bien-être', 'Santé & prévention', 'news', true),
('national', '2026-06-16', 'Semaine de la QVCT', 'QVCT', 'advisory', true),
('national', '2026-06-18', 'Développer sa marque employeur', 'Marque employeur & recrutement', 'advisory', true),
('national', '2026-07-15', 'Journée mondiale des compétences des jeunes', 'Formation & compétences', 'news', true),
('national', '2026-09-18', 'Semaine européenne du développement durable', 'Engagement & RSE', 'advisory', true),
('national', '2026-09-22', 'Saison des forums écoles — recrutement', 'Marque employeur & recrutement', 'news', true),
('national', '2026-10-01', 'Octobre rose — dépistage', 'Santé & prévention', 'advisory', true),
('national', '2026-10-10', 'Journée mondiale de la santé mentale', 'Santé & prévention', 'news', true),
('national', '2026-11-17', 'Semaine européenne pour l''emploi des personnes handicapées (SEEPH)', 'Diversité & inclusion', 'advisory', true),
('national', '2026-12-03', 'Journée internationale des personnes handicapées', 'Diversité & inclusion', 'news', true),
('national', '2026-12-31', 'DSN — clôture de l''exercice', 'Paie & déclaratif', 'mandatory', true);

-- Échéances DSN mensuelles (fixedForDay(), 2 règles à jour fixe -- pas une
-- récurrence complexe, donc pas du ressort de calendar_rules) : générées
-- pour les 12 mois de 2026 par generate_series plutôt que 24 lignes tapées
-- à la main -- une insertion figée en migration, jamais un calcul exécuté
-- à la demande par l'application.
insert into calendar_events (scope, event_date, title, category, event_type, note, published)
select 'national', (date_trunc('month', d) + interval '4 days')::date,
       'DSN et paiement des cotisations — entreprises de 50 salariés et plus',
       'Paie & déclaratif', 'mandatory',
       'Dépôt de la DSN et paiement des cotisations pour les employeurs d''au moins 50 salariés dont la paie est versée au cours du mois.',
       true
from generate_series('2026-01-01'::date, '2026-12-01'::date, interval '1 month') as d;

insert into calendar_events (scope, event_date, title, category, event_type, note, published)
select 'national', (date_trunc('month', d) + interval '14 days')::date,
       'DSN et paiement des cotisations — entreprises de moins de 50 salariés',
       'Paie & déclaratif', 'mandatory',
       'Dépôt de la DSN et paiement des cotisations pour les autres employeurs.',
       true
from generate_series('2026-01-01'::date, '2026-12-01'::date, interval '1 month') as d;
