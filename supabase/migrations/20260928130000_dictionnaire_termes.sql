-- LBP-CLIENT-14 : "Dictionnaire" — module réel du prototype
-- (LBP_V6_Studio.html, lignes 4602-4690, DICO/renderDico()), absent des
-- 13 modules écrits du cahier des charges (vérifié : ni dans §1 ni dans
-- l'Annexe B "Glossaire", qui ne concerne que le vocabulaire du document
-- lui-même) — ajouté comme 14e module à la demande explicite de
-- l'utilisateur après vérification.
--
-- Schéma de base repris de Nouveau dossier/Modelisation-BDD-LBP.md
-- (lignes 541-548 : id/term/definition), jamais créé en base jusqu'ici.
-- `source`/`published` ajoutés en additif : le schéma modélisé n'a pas de
-- distinction brouillon/publié, mais le vrai prototype en a une
-- (`pub:false` pour les brouillons, jamais visibles côté client) — sans
-- cette colonne, la RLS `using (true)` du schéma modélisé exposerait
-- aussi les brouillons.
create table dictionary_terms (
  id         uuid primary key default gen_random_uuid(),
  term       text not null unique,
  definition text not null,
  source     text,
  published  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_dictionary_terms_term on dictionary_terms(term);

create trigger trg_dictionary_terms_updated_at
  before update on dictionary_terms
  for each row execute function set_updated_at();

alter table dictionary_terms enable row level security;

create policy dictionary_terms_read on dictionary_terms for select
  using (is_admin() or published = true);
create policy dictionary_terms_write_admin on dictionary_terms for insert
  with check (is_admin());
create policy dictionary_terms_update_admin on dictionary_terms for update
  using (is_admin());
create policy dictionary_terms_delete_admin on dictionary_terms for delete
  using (is_admin());

grant select, insert, update, delete on dictionary_terms to authenticated;

-- Les 29 termes réels du prototype (DICO, LBP_V6_Studio.html lignes
-- 4603-4632), tous publiés à l'origine — aucun terme inventé.
insert into dictionary_terms (term, definition, source) values
('Abattement pour frais professionnels', 'Déduction forfaitaire spécifique appliquée, pour certaines professions, à l''assiette des cotisations sociales. Son application suppose le respect de conditions strictes et, depuis 2021, l''accord des salariés concernés.', 'BOSS'),
('Assiette des cotisations', 'Base de calcul des cotisations sociales. Elle comprend en principe l''ensemble des sommes versées en contrepartie ou à l''occasion du travail, sauf exclusions expressément prévues.', 'BOSS'),
('Avantage en nature', 'Bien ou service fourni par l''employeur à son salarié gratuitement ou moyennant une participation inférieure à sa valeur réelle. Il constitue un élément de rémunération soumis à cotisations.', 'BOSS'),
('Bulletin de paie', 'Document remis obligatoirement au salarié lors du paiement du salaire. Son contenu et ses mentions obligatoires sont fixés par le Code du travail.', 'Code du travail'),
('Contribution sociale généralisée (CSG)', 'Prélèvement social assis sur les revenus d''activité, calculé après application d''un abattement pour frais professionnels. Une fraction est déductible de l''impôt sur le revenu, l''autre ne l''est pas.', 'URSSAF'),
('Contribution au remboursement de la dette sociale (CRDS)', 'Prélèvement social non déductible de l''impôt sur le revenu, assis sur la même base que la CSG.', 'URSSAF'),
('Déclaration sociale nominative (DSN)', 'Déclaration mensuelle unique et dématérialisée, issue de la paie, qui transmet aux organismes de protection sociale les données individuelles des salariés.', 'net-entreprises'),
('Déduction forfaitaire patronale', 'Réduction du montant des cotisations patronales applicable, sous conditions, notamment au titre des heures supplémentaires.', 'BOSS'),
('Effectif sécurité sociale', 'Effectif calculé selon les règles du Code de la sécurité sociale, correspondant à la moyenne du nombre de salariés employés au cours de l''année civile précédente. Il conditionne de nombreux seuils.', 'BOSS'),
('Épargne salariale', 'Ensemble des dispositifs permettant d''associer les salariés aux résultats de l''entreprise : intéressement, participation, plans d''épargne.', 'Ministère du travail'),
('Exonération de cotisations', 'Dispositif légal dispensant totalement ou partiellement du paiement de certaines cotisations, généralement sous conditions d''effectif, de rémunération ou de zone géographique.', 'BOSS'),
('Forfait social', 'Contribution patronale due sur certaines sommes exonérées de cotisations mais assujetties à la CSG, notamment en matière d''épargne salariale.', 'BOSS'),
('Frais professionnels', 'Charges inhérentes à la fonction ou à l''emploi, supportées par le salarié. Leur remboursement peut être exclu de l''assiette des cotisations, sous conditions et dans certaines limites.', 'BOSS'),
('Gratification de stage', 'Somme versée au stagiaire. Elle n''est pas un salaire ; au-delà d''un seuil horaire, la fraction excédentaire est soumise à cotisations.', 'URSSAF'),
('Heures supplémentaires', 'Heures accomplies au-delà de la durée légale hebdomadaire de travail. Elles ouvrent droit à majoration de salaire ou à repos compensateur équivalent.', 'Code du travail'),
('Indemnités journalières de sécurité sociale (IJSS)', 'Revenu de remplacement versé par l''Assurance maladie pendant un arrêt de travail, sous conditions d''ouverture de droits.', 'Ameli'),
('Indemnité de rupture', 'Somme versée à l''occasion de la rupture du contrat de travail. Son régime social et fiscal dépend de la nature de la rupture et de montants plafonnés.', 'BOSS'),
('Maintien de salaire', 'Complément versé par l''employeur pendant un arrêt de travail, en application de la loi, de la convention collective ou d''un accord.', 'Code du travail'),
('Montant net social', 'Montant figurant sur le bulletin de paie, correspondant au revenu net après déduction des cotisations et contributions sociales. Il sert de référence au calcul de certaines prestations.', 'BOSS'),
('Plafond de la sécurité sociale', 'Montant de référence servant au calcul des cotisations plafonnées et de nombreux seuils sociaux. Il est fixé chaque année par arrêté et se décline en valeurs annuelle, mensuelle, journalière et horaire.', 'BOSS'),
('Prélèvement à la source', 'Mode de recouvrement de l''impôt sur le revenu consistant, pour l''employeur, à appliquer un taux transmis par l''administration fiscale au revenu net imposable.', 'impots.gouv.fr'),
('Prime de partage de la valeur (PPV)', 'Prime facultative versée par l''employeur, bénéficiant sous conditions d''un régime social et fiscal de faveur.', 'BOSS'),
('Réduction générale de cotisations patronales', 'Allègement dégressif des cotisations patronales sur les rémunérations inférieures à un seuil exprimé en multiple du SMIC.', 'BOSS'),
('Régularisation progressive', 'Méthode de recalcul des plafonds et assiettes de cotisations depuis le début de l''année, appliquée à chaque paie afin d''éviter une régularisation unique en fin d''exercice.', 'BOSS'),
('Rémunération brute', 'Ensemble des sommes dues au salarié avant déduction des cotisations et contributions sociales.', 'URSSAF'),
('Salaire minimum interprofessionnel de croissance (SMIC)', 'Salaire horaire minimum légal en dessous duquel aucun salarié ne peut être rémunéré. Il est revalorisé au moins une fois par an.', 'Ministère du travail'),
('Taxe sur les salaires', 'Taxe due par les employeurs non soumis à la TVA sur la totalité de leur chiffre d''affaires, calculée selon un barème progressif.', 'impots.gouv.fr'),
('Titres-restaurant', 'Titres de paiement remis aux salariés pour leurs repas. La participation patronale est exonérée de cotisations dans une limite revalorisée chaque année.', 'URSSAF'),
('Versement mobilité', 'Contribution due par les employeurs d''au moins onze salariés situés dans le ressort d''une autorité organisatrice de la mobilité, destinée au financement des transports.', 'URSSAF'),
('Vieillesse plafonnée et déplafonnée', 'Cotisations d''assurance vieillesse : la part plafonnée s''applique dans la limite du plafond de la sécurité sociale, la part déplafonnée sur la totalité de la rémunération.', 'BOSS');
