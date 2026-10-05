-- STU-QUIZ-01 : "Les quiz sont rattachés aux thèmes/fiches du référentiel"
-- (§14). `quizzes.theme_id` (baseline James) référence l'ancienne table
-- `themes`, incompatible avec le référentiel Studio (`master_themes`) --
-- même situation déjà rencontrée pour `legal_monitoring.sheet_id`
-- (STU-VEILLE-02) : colonnes additives plutôt que de réutiliser une FK
-- vers le mauvais modèle. Exactement un seul rattachement par quiz (thème
-- OU fiche), même contrainte que `quiz_scores_one_origin` déjà dans la
-- baseline, pour rester cohérent avec la convention existante.
alter table quizzes add column master_theme_id uuid references master_themes(id) on delete cascade;
alter table quizzes add column master_sheet_id uuid references master_sheets(id) on delete cascade;
alter table quizzes add constraint quizzes_one_attachment check (
  (master_theme_id is not null and master_sheet_id is null)
  or (master_theme_id is null and master_sheet_id is not null)
);
create index idx_quizzes_master_theme on quizzes(master_theme_id);
create index idx_quizzes_master_sheet on quizzes(master_sheet_id);
