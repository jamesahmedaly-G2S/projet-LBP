import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCompanyAffectations } from "@/lib/studio/affectations";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";
import { smartMatch, flattenJsonText } from "@/lib/client/smart-search";
import { EXTERNAL_SOURCES } from "@/lib/client/external-sources";

// LBP-CLIENT-12 : "Recherche globale" [§1.13, p.13 : "recherche
// transversale LBP + liens sources officielles"]. Vérifié contre le vrai
// code du prototype (LBP_V9.9_Studio.html, doSearch()/renderSearch(),
// lignes ~12068-12097) avant de construire : 3 blocs de résultats (Fiches/
// Actualités/Quizz) + un bloc de liens de recherche externe avec un
// avertissement explicite ("recherche externe... pas une interrogation
// directe des API officielles") -- porté ici tel quel, jamais atténué.
//
// Correctif fidélité (03/10/2026), suite à un retour de l'utilisateur
// ("compare bien mot pour mot et taille pour taille") : structure/texte
// déjà corrects (vérifié ci-dessus), seule la taille avait été devinée --
// `.ov-panel` (18px padding/radius, shadow-sm, pas le Card générique),
// `.ov-panel h3` (13px/800/uppercase/.03em, pas font-semibold nu),
// `.sr-count` (pill 11px/800 sur fond panel, pas un Badge générique),
// `.sr-item`/`.sr-t`/`.sr-m` (14px/700 et 12px, tailles exactes),
// `.src-link`/`.src-grid` (fond cream, padding 12px 15px, radius 11px).
//
// Simplification assumée sur les fiches : recherche sur le titre, les tags
// et le contenu de la couche "rg" (réglementation générale) uniquement --
// pas les couches CCN/entreprise superposées. Le vrai prototype
// (ficheBlob()) n'a pas de notion de couches par société ; notre modèle de
// données réel (client_sheet_content, STU-DATA-07) en a une, et fusionner
// les 3 couches par fiche pour la recherche aurait ajouté une complexité
// hors du minimum demandé par ce ticket.
interface SheetSearchRow {
  id: string;
  title: string;
  tags: string[];
  theme_id: string;
}

interface SheetContentRow {
  master_sheet_id: string;
  content: unknown;
}

interface ArticleSearchRow {
  id: string;
  title: string;
  category: string | null;
  subcategories: string[] | null;
  content: string | null;
}

interface QuizSearchRow {
  id: string;
  title: string;
  description: string | null;
  master_themes: { name: string } | null;
  master_sheets: { title: string } | null;
}

export default async function SearchResultsContent({
  q,
  companyId,
  linkPrefix = "",
}: {
  q: string;
  companyId: string | null;
  linkPrefix?: string;
}) {
  const supabase = await createClient();
  const enc = encodeURIComponent(q);

  let sheetResults: { id: string; title: string; themeName: string }[] = [];
  let articleResults: ArticleSearchRow[] = [];
  let quizResults: QuizSearchRow[] = [];

  if (q.trim() && companyId) {
    const [{ data: sheets }, { data: sheetContents }, { data: themes }, affectations] =
      await Promise.all([
        supabase
          .from("master_sheets")
          .select("id, title, tags, theme_id")
          .eq("status", "published")
          .returns<SheetSearchRow[]>(),
        supabase
          .from("client_sheet_content")
          .select("master_sheet_id, content")
          .eq("layer_kind", "rg")
          .returns<SheetContentRow[]>(),
        supabase.from("master_themes").select("id, name"),
        getCompanyAffectations(supabase, companyId),
      ]);

    const removedIds = new Set(
      affectations.filter((a) => a.removedManually).map((a) => a.masterSheetId),
    );
    const themeNameById = new Map((themes ?? []).map((t) => [t.id, t.name as string]));
    const contentBySheet = new Map(
      (sheetContents ?? []).map((c) => [c.master_sheet_id, flattenJsonText(c.content)]),
    );

    sheetResults = (sheets ?? [])
      .filter((s) => !removedIds.has(s.id))
      .filter((s) => {
        const blob = [s.title, (s.tags ?? []).join(" "), contentBySheet.get(s.id) ?? ""].join(" ");
        return smartMatch(blob, q);
      })
      .map((s) => ({ id: s.id, title: s.title, themeName: themeNameById.get(s.theme_id) ?? "" }));

    const { data: articles } = await supabase
      .from("articles")
      .select("id, title, category, subcategories, content")
      .eq("published", true)
      .returns<ArticleSearchRow[]>();
    articleResults = (articles ?? []).filter((a) =>
      smartMatch([a.title, a.content, a.category, (a.subcategories ?? []).join(" ")].join(" "), q),
    );

    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("id, title, description, master_themes(name), master_sheets(title)")
      .eq("published", true)
      .returns<QuizSearchRow[]>();
    quizResults = (quizzes ?? []).filter((qz) =>
      smartMatch(
        [qz.title, qz.description, qz.master_themes?.name, qz.master_sheets?.title].join(" "),
        q,
      ),
    );
  }

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>Résultats de recherche</Eyebrow>
      <SectionTitle>{q.trim() ? `« ${q} »` : "Recherche globale"}</SectionTitle>

      {!q.trim() ? (
        <div className="mt-6 rounded-[18px] border border-border bg-surface p-[18px] shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]">
          <p className="text-sm text-muted">
            Saisissez un mot-clé dans la barre de recherche en haut.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <ResultBlock icon="📚" title="Fiches de votre bibliothèque" count={sheetResults.length}>
            {sheetResults.map((s) => (
              <ResultRow
                key={s.id}
                href={`${linkPrefix}/bibliotheque/${s.id}`}
                title={s.title}
                meta={s.themeName}
                cta="Ouvrir →"
              />
            ))}
          </ResultBlock>

          <ResultBlock icon="📰" title="Actualités" count={articleResults.length}>
            {articleResults.map((a) => (
              <ResultRow
                key={a.id}
                href={`${linkPrefix}/actu/${a.id}`}
                title={a.title}
                meta={a.category ?? ""}
                cta="Lire →"
              />
            ))}
          </ResultBlock>

          <ResultBlock icon="🏆" title="Quizz" count={quizResults.length}>
            {quizResults.map((qz) => (
              <ResultRow
                key={qz.id}
                href={`${linkPrefix}/mes-quiz/${qz.id}`}
                title={qz.title}
                meta={qz.master_themes?.name ?? qz.master_sheets?.title ?? ""}
                cta="Ouvrir →"
              />
            ))}
          </ResultBlock>

          <div className="rounded-[18px] border border-border bg-surface p-[18px] shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]">
            <h3 className="mb-[13px] flex items-center gap-2 text-[13px] font-extrabold tracking-[0.03em] text-ink uppercase">
              🔎 Sur les sources officielles
            </h3>
            <p className="mb-3 text-[12.5px] text-muted">
              Ces liens ouvrent une recherche externe sur chaque site, dans un nouvel onglet. Il ne
              s&apos;agit pas d&apos;une interrogation directe des API officielles : cette connexion
              reste une évolution technique à étudier.
            </p>
            <div className="grid grid-cols-1 gap-[9px] min-[640px]:grid-cols-2">
              {EXTERNAL_SOURCES.map((src) => (
                <a
                  key={src.name}
                  href={src.url(enc)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2.5 rounded-[11px] bg-[#F5F0EC] px-[15px] py-3 text-ink no-underline transition-colors hover:bg-[#EFE7E1]"
                >
                  <span>{src.name}</span>
                  <span className="text-primary">Rechercher ↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ResultBlock({
  icon,
  title,
  count,
  children,
}: {
  icon: string;
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-border bg-surface p-[18px] shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]">
      <h3 className="mb-[13px] flex items-center gap-2 text-[13px] font-extrabold tracking-[0.03em] text-ink uppercase">
        {icon} {title}
        <span className="rounded-full bg-[#F5F0EC] px-[9px] py-0.5 text-[11px] font-extrabold text-muted normal-case">
          {count}
        </span>
      </h3>
      {count === 0 ? (
        <p className="text-sm text-muted">Aucun résultat.</p>
      ) : (
        <ul className="flex flex-col gap-2">{children}</ul>
      )}
    </div>
  );
}

function ResultRow({
  href,
  title,
  meta,
  cta,
}: {
  href: string;
  title: string;
  meta: string;
  cta: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-white px-3.5 py-[11px] transition-colors hover:border-primary"
      >
        <div>
          <p className="text-[14px] font-bold text-ink">{title}</p>
          {meta && <p className="mt-0.5 text-xs text-muted">{meta}</p>}
        </div>
        <span className="shrink-0 text-sm text-primary">{cta}</span>
      </Link>
    </li>
  );
}
