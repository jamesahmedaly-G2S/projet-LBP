-- LBP-CLIENT-09 : "Prise en main" [§1.10, p.12 : "Aide contextuelle et
-- bloc vidéo"]. Vérifié contre le vrai code du prototype
-- (LBP_V6_Studio.html, var HELP + renderHelp()/openHelpEditor()/
-- saveHelp(), lignes 5037-5071) avant de construire. Contenu réel porté
-- 1:1 : titre, 5 points clés, titre/texte/URL de la vidéo. `eyebrow`
-- ("Aide & prise en main") n'est pas éditable même dans le prototype
-- (absent de openHelpEditor()/saveHelp()) — laissé en constante de code
-- plutôt qu'en base, fidèle à ce que montre le prototype.
--
-- `points` en text[] plutôt qu'une table séparée : le prototype les
-- édite comme un bloc de texte, une ligne = un point (openHelpEditor,
-- "value=HELP.points.join('\n')") — un tableau simple suffit, pas besoin
-- d'ordre/CRUD par ligne séparé.
create table help_page_settings (
  id          smallint primary key default 1 check (id = 1),
  title       text not null,
  points      text[] not null default '{}',
  video_title text not null,
  video_text  text not null,
  video_url   text,
  updated_at  timestamptz not null default now()
);

create trigger trg_help_page_settings_updated_at
  before update on help_page_settings
  for each row execute function set_updated_at();

alter table help_page_settings enable row level security;

create policy help_page_settings_read on help_page_settings for select using (true);
create policy help_page_settings_write_admin on help_page_settings for insert with check (is_admin());
create policy help_page_settings_update_admin on help_page_settings for update using (is_admin());

grant select, insert, update on help_page_settings to authenticated;

insert into help_page_settings (id, title, points, video_title, video_text, video_url) values (
  1,
  'Bien démarrer avec le LBP',
  array[
    'Le tableau de bord regroupe vos chiffres clés, l''actualité, vos rappels et le calendrier des échéances.',
    'La bibliothèque est organisée en 3 familles : vie du salarié, rémunération, cotisations.',
    'Chaque fiche se lit en 3 niveaux : En bref, Comprendre, Dans le détail — plus les points de vigilance et le quiz.',
    'Cliquez sur un chiffre clé pour afficher son historique.',
    'Une question ? L''assistance est disponible en bas de l''écran.'
  ],
  'La vidéo de présentation',
  'Une présentation guidée du LBP en quelques minutes.',
  null
);
