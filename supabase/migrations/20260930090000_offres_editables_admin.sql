-- STU-OFFER-03 : rendre les 4 offres éditables depuis le Studio. Jusqu'ici
-- tout le contenu marketing (lib/studio/offer-tiers.ts, STUDIO_OFFER_TIERS)
-- était en dur dans un fichier TypeScript, non éditable par G2S -- contredit
-- l'exigence déjà actée "tout se fait depuis l'espace G2S, Pauline ne
-- touche jamais à du code" (déjà corrigée pour Chiffres Paie/Dictionnaire/
-- CCN/Prise en main, oubliée pour les Offres).
--
-- offer_tiers (table réelle de James, jamais modifiée ici) porte déjà
-- tier_level/includes_cba/includes_agreements/unlocks_detail/
-- max_messages_per_month -- utilisés par getOfferTierLayers(), qui reste
-- inchangé. Le contenu manquant (nom client, tarif numérique, utilisateurs
-- inclus, textes marketing) va dans une table additive séparée, FK sur
-- offer_tiers(tier_level), jamais une deuxième source de vérité pour les
-- colonnes qui existent déjà côté James.
create table studio_offer_content (
  tier_level        smallint primary key references offer_tiers(tier_level),
  name              text not null,
  sub               text not null,
  price             integer not null,
  users             integer not null,
  extra_user_price  integer,
  badge             text not null default '',
  reco              boolean not null default false,
  promesse          text not null,
  sous_promesse     text,
  description       text not null,
  pourqui           text not null,
  inc               text[] not null default '{}',
  why               text[] not null default '{}',
  foot              text not null,
  cta               text not null,
  cta2              text not null,
  highlight         text,
  formula           text[],
  blocs             jsonb,
  note              text,
  updated_at        timestamptz not null default now()
);
comment on table studio_offer_content is 'Contenu marketing éditable des 4 offres (STU-OFFER-03) -- offer_tiers (James) reste la seule source pour tier_level/includes_cba/includes_agreements/unlocks_detail/max_messages_per_month.';

create trigger trg_studio_offer_content_updated_at
  before update on studio_offer_content
  for each row execute function set_updated_at();

alter table studio_offer_content enable row level security;

-- Toujours lisible (authentifié) : les 4 offres sont publiques côté vitrine
-- client (LBP-CLIENT-07), jamais de brouillon/publié sur ce contenu (à la
-- différence de Chiffres Paie/Dictionnaire -- pas de notion de "palier pas
-- encore annoncé" dans le prototype).
create policy studio_offer_content_read on studio_offer_content for select
  using (true);
create policy studio_offer_content_write_admin on studio_offer_content for insert
  with check (is_admin());
create policy studio_offer_content_update_admin on studio_offer_content for update
  using (is_admin());

grant select, insert, update on studio_offer_content to authenticated;

-- Contenu réel porté 1:1 depuis lib/studio/offer-tiers.ts (STUDIO_OFFER_TIERS),
-- lui-même porté de LBP_V6_Studio.html lignes 4942-4986 -- aucun texte inventé.
insert into studio_offer_content
  (tier_level, name, sub, price, users, extra_user_price, badge, reco, promesse, sous_promesse, description, pourqui, inc, why, foot, cta, cta2, highlight, formula, blocs, note)
values
  (1, 'LBP Essentiel',
   'L''essentiel de la paie, fiable, pratique et toujours accessible.',
   199, 3, 30, '', false,
   'Toutes les règles essentielles pour sécuriser vos pratiques Paie au quotidien.',
   null,
   'Accédez à une base claire, structurée et actualisée pour comprendre les règles de paie, les appliquer et retrouver rapidement les sources officielles.',
   'Les entreprises qui veulent une documentation Paie fiable, sans multiplier les recherches.',
   array['Réglementation Paie & droit social','Fiches pratiques structurées par thème','Règles de calcul','Régimes social et fiscal','Application concrète en paie','Exemples et points de vigilance','Sources officielles et documents opposables','Quiz pour tester ses connaissances','Actualités et calendrier RH'],
   array['Une base juridique fiable et actualisée','Un gain de temps immédiat pour l''équipe Paie','Des sources officielles centralisées'],
   'Idéal pour disposer d''un socle Paie fiable et opérationnel, sans multiplier les recherches.',
   'Choisir LBP Essentiel', 'Découvrir l''offre',
   null, null, null, null),

  (2, 'LBP Métier',
   'La réglementation enrichie des règles de votre convention collective.',
   349, 5, 40, '', false,
   'Ne vous contentez plus de la règle générale : appliquez celle de votre convention collective.',
   null,
   'LBP Métier combine la réglementation nationale avec les dispositions de votre convention collective afin de vous montrer immédiatement la règle réellement applicable.',
   'Les entreprises qui veulent fiabiliser leurs pratiques sans comparer manuellement le Code du travail et leur convention collective.',
   array['Tout LBP Essentiel','Votre convention collective intégrée','Comparaison Loi / Convention collective','Dispositions conventionnelles par thème','Spécificités propres à votre secteur','Sources conventionnelles','Accès centralisé depuis les fiches LBP'],
   array['La règle conventionnelle réellement applicable','Moins d''erreurs sur les minima et les majorations','Un référentiel partagé avec l''équipe'],
   'Idéal pour les entreprises qui veulent fiabiliser leurs pratiques sans devoir comparer manuellement le Code du travail et leur convention collective.',
   'Choisir LBP Métier', 'Découvrir l''offre',
   'LOI + VOTRE CONVENTION COLLECTIVE', null, null, null),

  (3, 'LBP Entreprise',
   'Le référentiel qui applique la réglementation à la réalité de votre entreprise.',
   600, 10, 50, 'RECOMMANDÉ', true,
   'Une seule réponse : la règle réellement applicable dans votre entreprise.',
   null,
   'LBP Entreprise croise la réglementation, votre convention collective et vos propres accords et usages pour transformer le LBP en véritable référentiel Paie interne.',
   'Les entreprises disposant d''accords, d''usages ou d''engagements unilatéraux à documenter et à sécuriser.',
   array['Tout LBP Métier','Vos accords collectifs d''entreprise','Vos usages et engagements unilatéraux','Comparaison Loi / CCN / Entreprise','Règles réellement applicables dans votre organisation','Référentiel partagé avec l''équipe','Centralisation des sources et justificatifs','Sécurisation et harmonisation des pratiques Paie'],
   array['Une seule source de vérité pour toute l''équipe','La fin des divergences de pratiques entre gestionnaires','Des justificatifs centralisés en cas de contrôle'],
   'Votre équipe ne cherche plus la règle dans plusieurs sources : le LBP centralise l''environnement juridique applicable à votre entreprise.',
   'Choisir LBP Entreprise', 'Demander une démonstration',
   null, array['LOI','CONVENTION COLLECTIVE','ACCORDS & USAGES'], null, null),

  (4, 'LBP Signature',
   'Votre environnement Paie & RH construit sur mesure avec G2S.',
   990, 20, null, '100 % PERSONNALISÉ', false,
   'Votre expertise Paie. Vos règles. Vos procédures. Un seul environnement.',
   'G2S transforme le LBP en référentiel opérationnel entièrement adapté à votre organisation.',
   'Nous partons de votre environnement réel pour construire avec vous un LBP qui ne se contente plus d''expliquer la règle : il documente la manière dont votre entreprise doit concrètement la traiter.',
   'Les organisations qui veulent capitaliser le savoir-faire de leur équipe Paie et le transmettre durablement.',
   array['Tout LBP Entreprise','Intégration de vos procédures internes','Paramétrages et règles de gestion propres à l''entreprise','Consignes et modes opératoires Paie','Spécificités DSN','Justificatifs à conserver','Documents et modèles internes','Cas pratiques propres à l''entreprise','Contrôles et points de vigilance personnalisés','Organisation de vos contenus Paie/RH','Accompagnement G2S pour construire et structurer le référentiel'],
   array['La capitalisation du savoir-faire de votre équipe','L''harmonisation durable des méthodes','Un accompagnement G2S de bout en bout'],
   'L''objectif : transformer les connaissances et pratiques de votre équipe en un référentiel structuré, partagé et durable.',
   'Construire mon LBP', 'Parler de mon projet avec G2S',
   null, null,
   '[["VOS RÈGLES","Accords, usages, décisions et spécificités internes."],["VOS PROCESS","Procédures, contrôles, circuits et modes opératoires."],["VOTRE PAIE","Paramétrage, calcul, DSN, justificatifs et cas particuliers."],["VOTRE ORGANISATION","Documents, outils, pratiques et environnement interne."]]'::jsonb,
   'Le tarif dépend du périmètre, du niveau de personnalisation et du nombre d''utilisateurs.');
