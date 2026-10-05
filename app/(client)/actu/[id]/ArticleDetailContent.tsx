import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface ArticleRow {
  id: string;
  type: "article" | "pdf";
  title: string;
  category: string | null;
  subcategories: string[] | null;
  author: string | null;
  published_at: string;
  reading_time: string | null;
  image_url: string | null;
  pdf_url: string | null;
  content: string | null;
}

// Pendant de articlePageHTML() (LBP_V9.9_Studio.html, ~L3822-3842) :
// tags/thème, titre, meta, image, contenu, bouton + aperçu PDF si
// type='pdf', sous-tags. `content` rendu en texte brut
// (whitespace-pre-wrap), jamais injecté comme HTML -- c'est du texte
// libre saisi par un admin, pas du HTML de confiance à interpréter.
//
// Correctif fidélité (03/10/2026), suite à un retour de l'utilisateur
// ("compare bien mot pour mot et taille pour taille") : revérifié contre
// `articlePageHTML()` et son CSS (`.art-*`, ~L2371-2391) --
// - Lien retour : "← Retour à Actu · Veille" (texte réel), pas "← Retour
//   aux actualités" -- style `.back` (13px, carbone, 700, souligné au
//   survol seulement, même règle que mes-quiz/[id]/page.tsx).
// - `.art-page{max-width:780px}` : la colonne de lecture est plus étroite
//   que le conteneur global (1240px) -- pas la même largeur, jamais
//   remarqué avant ce correctif.
// - Catégorie réelle : une ligne de texte simple (thème + premier tag,
//   "theme · tag[0]"), pas un badge/pill -- et placée AVANT le titre,
//   les sous-tags juste après (avant l'image), pas après le contenu.
// - Tailles réelles portées (`.art-cat` 11.5/800/framboise,
//   `.art-titre` Archivo 34/800, `.art-meta` 12.5 avec bordure basse,
//   `.art-contenu` 16/1.75) -- remplace les classes génériques `text-2xl
//   font-semibold`/`text-sm` devinées.
// Non repris (déjà documenté ailleurs, pas un oubli de ce correctif) :
// `chapo` (champ séparé du prototype, absent de notre schéma
// `articles`) et le bloc "Sources"/CTA "Poser une question à G2S" (lié
// à Assistance, LBP-CLIENT-13, explicitement bloqué faute de service
// tiers choisi -- jamais simulé).
export default async function ArticleDetailContent({
  id,
  linkPrefix = "",
}: {
  id: string;
  linkPrefix?: string;
}) {
  const supabase = await createClient();
  const { data: article } = await supabase
    .from("articles")
    .select(
      "id, type, title, category, subcategories, author, published_at, reading_time, image_url, pdf_url, content",
    )
    .eq("id", id)
    .eq("published", true)
    .maybeSingle<ArticleRow>();

  if (!article) notFound();

  const firstTag = article.subcategories?.[0] ?? null;

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Link href={`${linkPrefix}/actu`} className="text-[13px] font-bold text-ink hover:underline">
        ← Retour à Actu · Veille
      </Link>

      <article className="mx-auto mt-4 max-w-[780px]">
        {(article.category || firstTag) && (
          <p className="mb-2.5 text-[11.5px] font-extrabold tracking-[0.06em] text-primary uppercase">
            {[article.category, firstTag].filter(Boolean).join(" · ")}
          </p>
        )}
        <h1 className="mb-3.5 text-[34px] leading-[1.18] font-extrabold tracking-[-0.015em] text-ink">
          {article.title}
        </h1>

        {article.subcategories && article.subcategories.length > 0 && (
          <div className="mb-[18px] flex flex-wrap gap-1.5">
            {article.subcategories.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#F5F0EC] px-3 py-[5px] text-[11.5px] font-bold text-ink"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {article.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url}
            alt=""
            className="mb-[18px] max-h-[420px] w-full rounded-2xl bg-[#F5F0EC] object-cover"
          />
        )}

        <div className="mb-[22px] flex flex-wrap gap-4 border-b border-border pb-[18px] text-[12.5px] text-muted">
          {article.author && <span className="font-extrabold text-ink">{article.author}</span>}
          <span>
            {new Date(article.published_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <span>{article.type === "pdf" ? "Dossier PDF" : (article.reading_time ?? "")}</span>
        </div>

        {article.content && (
          <p className="mb-6 text-base leading-[1.75] whitespace-pre-wrap text-ink">
            {article.content}
          </p>
        )}

        {article.type === "pdf" && article.pdf_url && (
          <div>
            <a
              href={article.pdf_url}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
            >
              📄 Ouvrir le PDF
            </a>
            <div className="mt-3 aspect-[4/3] overflow-hidden rounded-md border border-border">
              <iframe src={article.pdf_url} className="h-full w-full" title={article.title} />
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
