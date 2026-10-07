import { createClient } from "@/lib/supabase/server";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";

interface HelpSettings {
  title: string;
  points: string[];
  video_title: string;
  video_text: string;
  video_url: string | null;
}

// LBP-CLIENT-09 : "Prise en main" [§1.10, p.12] -- contenu sans dépendance
// de session, extrait pour être réutilisé par la vraie page client et la
// prévisualisation admin (STU-CLIENT-04 étendu).
//
// Correctif (03/10/2026), suite à un retour de l'utilisateur ("regarde
// bien la v9 et corrige de notre côté") : le ticket d'origine citait
// LBP_V6_Studio.html (une version plus ancienne) -- les valeurs de
// contenu (titre, 5 points, titre/texte vidéo) se trouvent identiques
// dans LBP_V9.9_Studio.html (`var HELP`), donc pas de vrai bug de
// contenu là, seulement une mauvaise attribution de source dans les
// commentaires. En revanche la mise en forme avait été devinée plutôt
// que portée : revérifié contre `renderHelp()` (~L11267-11277) et son
// CSS (`.card-h` ~L611, `.help-list` ~L595-597, `.help-video-ph` ~L921,
// `.dash-card`/`.dash-2col` ~L503-504) --
// - En-têtes de carte avec emoji intégré au texte ("🚀 L'essentiel en 5
//   points", hardcodé dans renderHelp() -- pas éditable, contrairement
//   au titre vidéo qui porte le sien dans la donnée elle-même), style
//   `.card-h` (800, bordure basse 2px `--panel`) -- pas un `<h2>` nu.
// - Puces `.help-list li::before{content:'✓'}` en carbone (`--sage-deep`)
//   -- pas un simple point framboise.
// - Emplacement vidéo vide : bordure en pointillés, fond `--panel`,
//   texte en italique (`.help-video-ph`) -- pas une bordure pleine sans
//   italique.
export default async function PriseEnMainContent() {
  const supabase = await createClient();

  const { data: help } = await supabase
    .from("help_page_settings")
    .select("title, points, video_title, video_text, video_url")
    .eq("id", 1)
    .single<HelpSettings>();

  const cardClass =
    "rounded-2xl border border-border bg-surface px-5 py-[18px] shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]";
  const cardHeadingClass =
    "mb-3 border-b-2 border-[#F5F0EC] pb-2 text-[15px] leading-[1.5] font-extrabold text-ink";

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>Aide &amp; prise en main</Eyebrow>
      <SectionTitle>{help?.title ?? "Bien démarrer avec le LBP"}</SectionTitle>

      <div className="grid grid-cols-1 gap-4 min-[820px]:grid-cols-2">
        <div className={cardClass}>
          <h2 className={cardHeadingClass}>🚀 L&apos;essentiel en 5 points</h2>
          <ul className="flex flex-col gap-2">
            {(help?.points ?? []).map((point, i) => (
              <li key={i} className="relative pl-5 text-[13.5px] leading-[1.5] text-ink">
                <span className="absolute left-0 font-extrabold text-ink">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className={cardClass}>
          <h2 className={cardHeadingClass}>{help?.video_title ?? "🎬 La vidéo de présentation"}</h2>
          <p className="mb-2.5 text-[13.5px] text-muted">
            {help?.video_text ?? "Une présentation guidée du LBP en quelques minutes."}
          </p>
          {help?.video_url ? (
            <div className="aspect-video overflow-hidden rounded-xl">
              <iframe
                src={help.video_url}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-[#F5F0EC] p-[34px] text-center text-[13px] text-muted italic">
              Emplacement de la vidéo de présentation
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
