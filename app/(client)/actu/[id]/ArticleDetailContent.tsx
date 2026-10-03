import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";

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

// Pendant de actuArticleHTML() (LBP_V9.9_Studio.html, ~L.3628-3640) :
// tags/thème, titre, meta, image, contenu, bouton + aperçu PDF si
// type='pdf', sous-tags. `content` rendu en texte brut
// (whitespace-pre-wrap), jamais injecté comme HTML -- c'est du texte
// libre saisi par un admin, pas du HTML de confiance à interpréter.
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

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Link href={`${linkPrefix}/actu`} className="text-sm text-primary hover:underline">
        ← Retour aux actualités
      </Link>

      <Card className="mt-4">
        {article.category && <Badge tone="blue">{article.category}</Badge>}
        <h1 className="mt-2 text-2xl font-semibold text-ink">{article.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {article.author && <>{article.author} · </>}
          {new Date(article.published_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {article.type === "pdf"
            ? " · Dossier PDF"
            : article.reading_time && ` · ${article.reading_time}`}
        </p>

        {article.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.image_url}
            alt=""
            className="mt-4 h-56 w-full rounded-md object-cover"
          />
        )}

        {article.content && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-ink">{article.content}</p>
        )}

        {article.type === "pdf" && article.pdf_url && (
          <div className="mt-4">
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

        {article.subcategories && article.subcategories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {article.subcategories.map((tag) => (
              <span key={tag} className="rounded-full bg-page-bg px-2.5 py-1 text-xs text-muted">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
