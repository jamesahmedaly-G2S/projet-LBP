import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";

interface ArticleRow {
  id: string;
  type: "article" | "pdf";
  title: string;
  category: string | null;
  author: string | null;
  published_at: string;
  reading_time: string | null;
  image_url: string | null;
  content: string | null;
}

// LBP-CLIENT-04 : "Actu · Décrypt RH&Paie" [§1.5, p.11]. Vérifié contre le
// vrai code du prototype (LBP_V9.9_Studio.html, avCard()/AV_PER_PAGE,
// lignes ~3656-3796) avant de construire -- le cahier dit "5 articles par
// page", le vrai code en montre 6 (AV_PER_PAGE=6) : suivi le vrai code,
// même discipline que pour le chronomètre du quiz (25s, pas 20s).
//
// Simplification assumée : la colonne latérale du prototype ("Ne rien
// manquer" + "En bref") n'affiche pas du contenu éditorial mais un
// rappel statique des notifications et un recyclage des chiffres clés
// (HISTO, la même donnée que Chiffres Paie) -- non repris ici, hors
// périmètre réel du module Actu lui-même. Pas de taxonomie de
// sous-rubriques à 3 thèmes/11 tags par thème (embellissement du
// prototype, absent du cahier écrit) : filtre simple par catégorie +
// recherche texte.
const PER_PAGE = 6;

function excerpt(content: string | null, max: number): string {
  if (!content) return "";
  const stripped = content.trim();
  return stripped.length > max ? `${stripped.slice(0, max).trimEnd()}…` : stripped;
}

export default async function ActuContent({
  page,
  category,
  q,
  linkPrefix = "",
}: {
  page: number;
  category: string | null;
  q: string | null;
  linkPrefix?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("articles")
    .select("id, type, title, category, author, published_at, reading_time, image_url, content")
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data: articles } = await query.returns<ArticleRow[]>();
  const all = articles ?? [];

  const { data: categoryRows } = await supabase
    .from("articles")
    .select("category")
    .eq("published", true)
    .not("category", "is", null);
  const categories = [...new Set((categoryRows ?? []).map((r) => r.category as string))].sort();

  const noFilter = !category && !q;
  const potentialFeatured = noFilter ? (all[0] ?? null) : null;
  const rest = noFilter ? all.slice(1) : all;
  const pageCount = Math.max(1, Math.ceil(rest.length / PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  // La une ne s'affiche que sur la page 1 -- sinon elle se répète
  // identique en haut de chaque page suivante (trouvé en testant avec
  // plus de PER_PAGE articles publiés).
  const featured = currentPage === 1 ? potentialFeatured : null;
  const pageItems = rest.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const buildHref = (params: { page?: number; category?: string | null; q?: string | null }) => {
    const sp = new URLSearchParams();
    const finalCategory = params.category !== undefined ? params.category : category;
    const finalQ = params.q !== undefined ? params.q : q;
    const finalPage = params.page ?? 1;
    if (finalCategory) sp.set("categorie", finalCategory);
    if (finalQ) sp.set("q", finalQ);
    if (finalPage > 1) sp.set("page", String(finalPage));
    const qs = sp.toString();
    return `${linkPrefix}/actu${qs ? `?${qs}` : ""}`;
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Eyebrow>Actualités &amp; analyses</Eyebrow>
      <SectionTitle>Actu · Décrypt RH&amp;Paie</SectionTitle>
      <p className="-mt-3 text-sm text-muted">
        Les évolutions sociales et réglementaires qui concernent la paie et la masse salariale.
      </p>

      <form className="mt-4 flex flex-wrap gap-2" action={`${linkPrefix}/actu`}>
        <select
          name="categorie"
          defaultValue={category ?? ""}
          className="rounded-md border border-border px-3 py-2 text-sm text-ink"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher un article..."
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm text-ink"
        />
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Filtrer
        </button>
      </form>

      {all.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-muted">Aucune actualité pour l&apos;instant.</p>
        </Card>
      ) : (
        <>
          {featured && (
            <Link href={`${linkPrefix}/actu/${featured.id}`} className="mt-6 block">
              <Card className="hover:border-primary">
                <div className="flex flex-col gap-4 sm:flex-row">
                  {featured.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.image_url}
                      alt=""
                      className="h-40 w-full rounded-md object-cover sm:w-56"
                    />
                  )}
                  <div>
                    {featured.category && <Badge tone="blue">{featured.category}</Badge>}
                    <h2 className="mt-2 text-lg font-semibold text-ink">{featured.title}</h2>
                    <p className="mt-1 text-sm text-ink">{excerpt(featured.content, 260)}</p>
                    <p className="mt-2 text-xs text-muted">
                      {featured.author && <>{featured.author} · </>}
                      {new Date(featured.published_at).toLocaleDateString("fr-FR")}
                      {featured.type === "pdf"
                        ? " · Dossier PDF"
                        : featured.reading_time && ` · ${featured.reading_time}`}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pageItems.map((a) => (
              <Link key={a.id} href={`${linkPrefix}/actu/${a.id}`}>
                <Card className="h-full hover:border-primary">
                  {a.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.image_url} alt="" className="h-32 w-full rounded-md object-cover" />
                  )}
                  {a.category && <Badge tone="blue">{a.category}</Badge>}
                  <h3 className="mt-2 text-sm font-semibold text-ink">{a.title}</h3>
                  <p className="mt-1 text-xs text-muted">{excerpt(a.content, 130)}</p>
                  <p className="mt-2 text-xs text-muted">
                    {a.author && <>{a.author} · </>}
                    {new Date(a.published_at).toLocaleDateString("fr-FR")}
                    {a.type === "pdf" ? " · Dossier PDF" : a.reading_time && ` · ${a.reading_time}`}
                  </p>
                </Card>
              </Link>
            ))}
          </div>

          {pageCount > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildHref({ page: p })}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    p === currentPage
                      ? "bg-primary text-white"
                      : "border border-border text-ink hover:border-primary"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
