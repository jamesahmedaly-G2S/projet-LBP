import Link from "next/link";
import { Newspaper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { keyFigureLabel } from "@/lib/client/key-figure-labels";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";
import ArticleCover from "./ArticleCover";
import ActuFilters from "./ActuFilters";

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
  content: string | null;
}

interface KeyFigureRow {
  key: string;
  year: number;
  value: number;
  unit: string;
  label: string | null;
}

// LBP-CLIENT-04 : "Actu · Décrypt RH&Paie" [§1.5, p.11]. Vérifié contre le
// vrai code du prototype (LBP_V9.9_Studio.html, avCard()/AV_PER_PAGE,
// lignes ~3656-3796) avant de construire -- le cahier dit "5 articles par
// page", le vrai code en montre 6 (AV_PER_PAGE=6) : suivi le vrai code,
// même discipline que pour le chronomètre du quiz (25s, pas 20s).
//
// Correctif fidélité (03/10/2026) : titre, intro, libellés de filtres et
// titres de section ("À la une", "Les dernières analyses · du plus récent
// au plus ancien" / "Résultats · N contenu(s)") repris mot pour mot de
// `<div id="v-decrypt">` (~L2618-2632) et `renderActuGrid()`
// (~L3762-3796).
//
// Correctif fidélité (06/10/2026), valeurs mesurées sur le rendu de la
// maquette (getComputedStyle, viewport 1240) plutôt que lues dans le CSS :
// - Mise en page `.av-layout` : grille `minmax(0,1fr) 320px`, gap 22,
//   colonne latérale collante (`.av-aside`, top 204, gap 16) -- une
//   colonne sous 1060px (aside en 2 colonnes), tout empilé sous 760px.
//   La colonne latérale ("Ne rien manquer" + "En bref"), jusqu'ici omise,
//   est ajoutée : l'encart renvoie vers nos vraies notifications, "En
//   bref" lit les mêmes `key_figures` que l'Accueil et Chiffres Paie.
// - Titres de section = `.sec-title.big` (23px/800/-.015em/#33405A, icône
//   18px, annexe 12px italique #9A959A).
// - Carte `.av-card` : blanche, bordure --ligne, radius 16, `--shadow-sm` ;
//   survol -2px + bordure #C6BFC3 + `--shadow` + titre framboise.
//   Catégorie 11px/700/.16em, titre 16.5px/800/lh 1.3/-.02em #33405A,
//   extrait 13px/lh 1.55, méta 11.5px. Ligne "catégorie · premier tag"
//   comme `[a.theme, avTag(a)]`. Date au format long ("24 mai 2026").
// - Article à la une `.av-une` : média 46 % (min 260px, sans logo G2S),
//   corps 22px 24px, titre 21px/lh 1.25, extrait 13.5px, bouton
//   `.btn-primary` 12.5px/700 padding 9px 18px.
// - Grille `.avx-grid` : 2 colonnes, gap 16, couvertures au ratio 2/1.
const PER_PAGE = 6;
const BREF_KEYS = ["smic-h", "smic-m", "pmss", "pass"];

const shadowSm = "shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]";
const shadowHover = "hover:shadow-[0_18px_40px_-26px_rgba(68,80,104,0.28)]";
const secTitle =
  "mt-1.5 mb-3 flex items-baseline gap-2.5 text-[23px] leading-[1.5] font-extrabold tracking-[-0.015em] text-[#33405A]";
const secTitleAnnex = "text-[12px] font-medium tracking-normal text-[#9A959A] italic";

function excerpt(content: string | null, max: number): string {
  if (!content) return "";
  const stripped = content.replace(/\s+/g, " ").trim();
  return stripped.length > max ? `${stripped.slice(0, max).replace(/\s+\S*$/, "")}…` : stripped;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatAmount(value: number, unit: string): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: value % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  })
    .format(value)
    // Intl sépare les milliers par U+202F, absent d'Archivo : espace insécable classique.
    .replace(/ /g, " ");
  return `${formatted} ${unit}`;
}

function metaLine(a: ArticleRow): string {
  return [a.author, formatDate(a.published_at), a.type === "pdf" ? "Dossier PDF" : a.reading_time]
    .filter(Boolean)
    .join(" · ");
}

function catLine(a: ArticleRow): string {
  return [a.category, a.subcategories?.[0]].filter(Boolean).join(" · ") || "Analyse";
}

export default async function ActuContent({
  page,
  category,
  tag,
  q,
  date,
  linkPrefix = "",
}: {
  page: number;
  category: string | null;
  tag: string | null;
  q: string | null;
  date: string | null;
  linkPrefix?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("articles")
    .select(
      "id, type, title, category, subcategories, author, published_at, reading_time, image_url, content",
    )
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (tag) query = query.contains("subcategories", [tag]);
  if (date) query = query.eq("published_at", date);
  if (q) query = query.ilike("title", `%${q}%`);

  const [{ data: articles }, { data: facetRows }, { data: keyFigures }] = await Promise.all([
    query.returns<ArticleRow[]>(),
    supabase
      .from("articles")
      .select("category, subcategories")
      .eq("published", true)
      .returns<{ category: string | null; subcategories: string[] | null }[]>(),
    supabase
      .from("key_figures")
      .select("key, year, value, unit, label")
      .in("key", BREF_KEYS)
      .order("year", { ascending: false })
      .returns<KeyFigureRow[]>(),
  ]);
  const all = articles ?? [];

  const categoryCounts = new Map<string, number>();
  const tagSet = new Set<string>();
  for (const r of facetRows ?? []) {
    if (r.category) categoryCounts.set(r.category, (categoryCounts.get(r.category) ?? 0) + 1);
    for (const t of r.subcategories ?? []) tagSet.add(t);
  }
  const categories = [...categoryCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "fr"))
    .map(([name, count]) => ({ name, count }));
  const tags = [...tagSet].sort((a, b) => a.localeCompare(b, "fr"));

  const currentFigures = BREF_KEYS.map((k) => (keyFigures ?? []).find((f) => f.key === k)).filter(
    (f): f is KeyFigureRow => !!f,
  );

  const filtered = !!(category || tag || q || date);
  const potentialFeatured = !filtered ? (all[0] ?? null) : null;
  const rest = !filtered ? all.slice(1) : all;
  const pageCount = Math.max(1, Math.ceil(rest.length / PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  // La une ne s'affiche que sur la page 1 -- sinon elle se répète
  // identique en haut de chaque page suivante (trouvé en testant avec
  // plus de PER_PAGE articles publiés).
  const featured = currentPage === 1 ? potentialFeatured : null;
  const pageItems = rest.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    if (category) sp.set("categorie", category);
    if (tag) sp.set("rubrique", tag);
    if (q) sp.set("q", q);
    if (date) sp.set("date", date);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `${linkPrefix}/actu${qs ? `?${qs}` : ""}`;
  };

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>Actualités &amp; analyses</Eyebrow>
      <SectionTitle>Actu-Veille · Décrypt RH&amp;Paie</SectionTitle>
      <p className="mb-[18px] max-w-[720px] text-sm text-muted">
        Lois, décrets, arrêtés, doctrine BOSS, jurisprudence : la veille sociale de G2S, sourcée et
        datée, avec ce qu&apos;il faut vérifier sur vos bulletins et vos déclarations sociales.
      </p>

      <ActuFilters
        action={`${linkPrefix}/actu`}
        categories={categories}
        tags={tags}
        category={category}
        tag={tag}
        q={q}
        date={date}
      />

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-[22px] max-[1060px]:grid-cols-1">
        <div className="min-w-0">
          {all.length === 0 && (
            <p
              className={`rounded-2xl border border-border bg-surface px-5 py-10 text-center text-sm text-muted ${shadowSm}`}
            >
              {filtered
                ? "Aucun contenu ne correspond à votre recherche."
                : "Aucune actualité pour l'instant."}
            </p>
          )}

          {featured && (
            <div className="mb-6">
              <h2 className={secTitle}>
                <Newspaper className="h-[18px] w-[18px] shrink-0 self-center" aria-hidden="true" />À
                la une
              </h2>
              <Link
                href={`${linkPrefix}/actu/${featured.id}`}
                className={`group relative flex overflow-hidden rounded-2xl border border-border bg-surface transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-[#C6BFC3] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary max-[760px]:flex-col ${shadowSm} ${shadowHover}`}
              >
                <div className="relative shrink-0 basis-[46%] bg-[#F5F0EC] leading-none max-[760px]:basis-auto">
                  {featured.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={featured.image_url}
                      alt=""
                      className="block h-full min-h-[260px] w-full object-cover max-[760px]:aspect-video max-[760px]:min-h-0"
                    />
                  ) : (
                    <div className="h-full min-h-[260px] max-[760px]:aspect-video max-[760px]:min-h-0">
                      <ArticleCover
                        category={featured.category}
                        tag={featured.subcategories?.[0] ?? null}
                        type={featured.type}
                        ratio="fill"
                        showLogo={false}
                      />
                    </div>
                  )}
                  <span className="absolute top-3.5 left-3.5 z-[2] rounded-full bg-white px-3 py-1.5 text-[11px] leading-none font-extrabold tracking-[0.08em] text-primary uppercase">
                    À la une
                  </span>
                </div>
                <div className="flex flex-1 flex-col px-6 py-[22px]">
                  <p className="mb-1.5 text-[11px] font-bold tracking-[0.16em] text-primary uppercase">
                    {catLine(featured)}
                  </p>
                  <h3 className="mb-2 text-[21px] leading-[1.25] font-extrabold tracking-[-0.02em] text-[#33405A] group-hover:text-primary">
                    {featured.title}
                  </h3>
                  <p className="mb-3 flex-1 text-[13.5px] leading-[1.55] text-muted">
                    {excerpt(featured.content, 260)}
                  </p>
                  <p className="text-[11.5px] text-muted">{metaLine(featured)}</p>
                  <span className="mt-3.5 inline-flex items-center gap-[7px] self-start rounded-full bg-primary px-[18px] py-[9px] text-[12.5px] leading-none font-bold whitespace-nowrap text-white group-hover:bg-primary-hover">
                    {featured.type === "pdf" ? "Ouvrir le dossier →" : "Lire l'article →"}
                  </span>
                </div>
              </Link>
            </div>
          )}

          {pageItems.length > 0 && (
            <div className="mb-6">
              <h2 className={secTitle}>
                {filtered ? (
                  <>
                    Résultats{" "}
                    <span className={secTitleAnnex}>
                      {all.length} contenu{all.length > 1 ? "s" : ""}
                    </span>
                  </>
                ) : (
                  <>
                    Les dernières analyses{" "}
                    <span className={secTitleAnnex}>du plus récent au plus ancien</span>
                  </>
                )}
              </h2>
              <div className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
                {pageItems.map((a) => (
                  <Link
                    key={a.id}
                    href={`${linkPrefix}/actu/${a.id}`}
                    className={`group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-[#C6BFC3] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary ${shadowSm} ${shadowHover}`}
                  >
                    <div className="bg-[#F5F0EC] leading-none">
                      {a.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.image_url}
                          alt=""
                          className="block aspect-[2/1] w-full object-cover"
                        />
                      ) : (
                        <ArticleCover
                          category={a.category}
                          tag={a.subcategories?.[0] ?? null}
                          type={a.type}
                          ratio="wide"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col px-[18px] pt-4 pb-[18px]">
                      <p className="mb-1.5 text-[11px] font-bold tracking-[0.16em] text-primary uppercase">
                        {catLine(a)}
                      </p>
                      <h3 className="mb-2 text-[16.5px] leading-[1.3] font-extrabold tracking-[-0.02em] text-[#33405A] group-hover:text-primary">
                        {a.title}
                      </h3>
                      <p className="mb-3 flex-1 text-[13px] leading-[1.55] text-muted">
                        {excerpt(a.content, 130)}
                      </p>
                      <p className="text-[11.5px] text-muted">{metaLine(a)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {pageCount > 1 && (
            <div className="mt-[18px] flex justify-center gap-1.5">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildHref(p)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    p === currentPage
                      ? "bg-primary text-white"
                      : "border border-border bg-white text-ink hover:border-primary"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="sticky top-[204px] flex flex-col gap-4 max-[1060px]:static max-[1060px]:grid max-[1060px]:grid-cols-2 max-[760px]:grid-cols-1">
          <div className="relative overflow-hidden rounded-2xl bg-primary px-[22px] pt-[22px] pb-5 text-white shadow-[0_18px_40px_-26px_rgba(103,6,38,0.6)] after:pointer-events-none after:absolute after:-right-10 after:-bottom-10 after:h-[150px] after:w-[150px] after:rounded-full after:border-[18px] after:border-white/[0.08] after:content-['']">
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.14] text-[19px]"
              aria-hidden="true"
            >
              🔔
            </div>
            <p className="mb-1.5 text-[11px] font-bold tracking-[0.16em] uppercase opacity-85">
              Ne rien manquer
            </p>
            <p className="mb-2 text-[18px] leading-[1.3] font-extrabold">
              Soyez alerté dès qu&apos;une évolution touche votre paie.
            </p>
            <p className="mb-4 text-[13px] leading-[1.5] opacity-[0.92]">
              À chaque publication importante, une alerte s&apos;affiche dans votre espace LBP. Vous
              la retrouvez dans la cloche, en haut de page.
            </p>
            <Link
              href="/notifications"
              className="relative z-[1] inline-block rounded-full bg-white px-[18px] py-2.5 text-[13px] font-extrabold text-primary hover:bg-[#EFE7E1] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white"
            >
              Voir mes alertes →
            </Link>
          </div>

          {currentFigures.length > 0 && (
            <div
              className={`rounded-2xl border border-border bg-surface px-5 py-[18px] ${shadowSm}`}
            >
              <p className="mb-0.5 text-base font-extrabold text-ink">En bref</p>
              <p className="mb-2.5 text-xs text-muted">Les chiffres de la paie en vigueur</p>
              {currentFigures.map((f) => (
                <Link
                  key={f.key}
                  href={`${linkPrefix}/chiffres-paie`}
                  className="group block border-t border-border py-[11px] text-ink"
                >
                  <span className="block text-xs font-semibold text-muted">
                    {keyFigureLabel(f.key, f.label)}
                  </span>
                  <span className="my-0.5 block text-[20px] leading-[1.2] font-extrabold text-ink group-hover:text-primary">
                    {formatAmount(f.value, f.unit)}
                  </span>
                  <span className="block text-[11.5px] text-muted">en vigueur en {f.year}</span>
                </Link>
              ))}
              <Link
                href={`${linkPrefix}/chiffres-paie`}
                className="mt-2.5 flex w-full items-center justify-center gap-[7px] rounded-full border-[1.5px] border-primary bg-white px-[18px] py-[9px] text-[12.5px] font-bold text-primary hover:bg-primary hover:text-white"
              >
                Tous les chiffres de la paie →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
