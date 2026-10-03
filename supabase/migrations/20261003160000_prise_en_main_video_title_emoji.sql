-- LBP-CLIENT-09 (correctif, 03/10/2026) : le titre vidéo seedé
-- ("La vidéo de présentation") avait perdu l'emoji intégré au vrai texte
-- éditable du prototype (var HELP.videoTitle = "🎬 La vidéo de
-- présentation", LBP_V9.9_Studio.html ~L11266) -- pas hardcodé dans le
-- rendu comme l'eyebrow, mais bien une partie de la donnée elle-même.
-- Garde explicitement l'ancienne valeur en filtre : ne touche jamais une
-- valeur déjà modifiée par un admin réel.
update help_page_settings
set video_title = '🎬 La vidéo de présentation'
where id = 1 and video_title = 'La vidéo de présentation';
