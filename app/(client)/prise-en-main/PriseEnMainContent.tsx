import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
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
export default async function PriseEnMainContent() {
  const supabase = await createClient();

  const { data: help } = await supabase
    .from("help_page_settings")
    .select("title, points, video_title, video_text, video_url")
    .eq("id", 1)
    .single<HelpSettings>();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Eyebrow>Aide &amp; prise en main</Eyebrow>
      <SectionTitle>{help?.title ?? "Bien démarrer avec le LBP"}</SectionTitle>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-ink">L&apos;essentiel en 5 points</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-ink">
            {(help?.points ?? []).map((point, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">•</span>
                {point}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-ink">
            {help?.video_title ?? "La vidéo de présentation"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {help?.video_text ?? "Une présentation guidée du LBP en quelques minutes."}
          </p>
          {help?.video_url ? (
            <div className="mt-3 aspect-video overflow-hidden rounded-md">
              <iframe
                src={help.video_url}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="mt-3 flex h-32 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted">
              Emplacement de la vidéo de présentation
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
