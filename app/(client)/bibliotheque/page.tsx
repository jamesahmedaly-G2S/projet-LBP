import Link from "next/link";
import type { ReactNode } from "react";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCompanyAffectations } from "@/lib/studio/affectations";
import { smartMatch, flattenJsonText } from "@/lib/client/smart-search";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";

interface FamilyRow {
  id: string;
  code: string;
  name: string;
}

interface ThemeRow {
  id: string;
  name: string;
  family_id: string;
}

interface SheetRow {
  id: string;
  title: string;
  tags: string[];
  theme_id: string;
  subtheme_id: string | null;
}

interface SheetContentRow {
  master_sheet_id: string;
  content: unknown;
}

// Premier écran réel du LBP Client (fondations STU-CLIENT) : même
// arborescence Familles → Thèmes → Sous-thèmes → Fiches que le mode
// "Accéder au LBP du client" déjà construit côté Studio
// (app/(studio)/clients/[id]/vue-client/page.tsx, STU-CLIENT-04), mais
// pour une vraie session cliente — la même règle d'affectation
// (getCompanyAffectations, retire les fiches désactivées manuellement)
// avec company_id résolu depuis la session plutôt que passé en URL par un
// admin. Jamais une deuxième implémentation de cette logique.
//
// LBP-CLIENT-03 (finitions, 30/09/2026) : recherche/filtre dans
// l'arborescence, vérifiée contre le vrai code du prototype
// (LBP_V9.9_Studio.html, renderBiblio()/subMatches()/ficheBlob(), lignes
// ~10727-10783) -- un seul champ de recherche libre (pas de filtres
// famille/thème séparés dans le vrai code), même algorithme smartMatch()
// que la recherche globale (LBP-CLIENT-12) et le filtre d'actualités,
// masque les familles/thèmes sans aucune fiche correspondante plutôt que
// de les afficher vides. Recherche sur le titre, les tags et le contenu
// de la couche "rg" -- même simplification assumée que LBP-CLIENT-12 (pas
// les couches CCN/entreprise superposées).
//
// Correctif fidélité (06/10/2026), mesuré sur le rendu réel du prototype
// (getComputedStyle, renderBiblio()/bibThemeCard()/themeBodyHTML(),
// LBP_V9.9_Studio.html ~L10363-10787) : la bibliothèque est une
// navigation en TROIS écrans, jamais un listing complet à plat :
//   1. aucune famille choisie -> 3 grandes tuiles `.fam-block` ;
//   2. `?famille=<id>` -> bouton "← Toutes les familles", bandeau
//      `.fam-sec-h` puis un accordéon `.theme` par thème (pastille numérotée
//      `.pnum`, tags "N sous-fiches" / "À jour", chevron ▶) ;
//   3. un thème déplié -> lignes `.sub-item` "titre · Ouvrir →".
// Avec une recherche (`?q=`), le prototype affiche toutes les familles
// (bandeau + thèmes correspondants dépliés), comme ici. La barre
// `.filters` (fond crème, "RECHERCHE" + champ 180px) vit sous le bandeau,
// pleine largeur, hors du conteneur centré. Les sous-thèmes de notre modèle
// n'ont pas d'équivalent visuel dans le prototype (thème -> fiches) : leurs
// fiches sont listées dans le thème, dans l'ordre des sous-thèmes.
export default async function BibliothequePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; famille?: string }>;
}) {
  const session = await requireClient();
  const companyId = session.profile.company_id;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  if (!companyId) {
    return (
      <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
        <p className="text-sm text-danger">
          Aucune société rattachée à ce compte — contactez votre référent G2S.
        </p>
      </main>
    );
  }

  const supabase = await createClient();

  const [
    { data: familiesData },
    { data: themesData },
    { data: subthemes },
    { data: allSheets },
    affectations,
  ] = await Promise.all([
    supabase
      .from("master_families")
      .select("id, code, name")
      .order("display_order")
      .returns<FamilyRow[]>(),
    supabase
      .from("master_themes")
      .select("id, name, family_id")
      .order("display_order")
      .returns<ThemeRow[]>(),
    supabase
      .from("master_subthemes")
      .select("id, name, theme_id")
      .order("display_order")
      .returns<{ id: string; name: string; theme_id: string }[]>(),
    supabase
      .from("master_sheets")
      .select("id, title, tags, theme_id, subtheme_id")
      .eq("status", "published")
      .order("title")
      .returns<SheetRow[]>(),
    getCompanyAffectations(supabase, companyId),
  ]);
  const families = familiesData ?? [];
  const themes = themesData ?? [];

  const removedIds = new Set(
    affectations.filter((a) => a.removedManually).map((a) => a.masterSheetId),
  );
  const visibleSheets = (allSheets ?? []).filter((s) => !removedIds.has(s.id));
  let sheets = visibleSheets;

  if (q) {
    const { data: sheetContents } = await supabase
      .from("client_sheet_content")
      .select("master_sheet_id, content")
      .eq("layer_kind", "rg")
      .returns<SheetContentRow[]>();
    const contentBySheet = new Map(
      (sheetContents ?? []).map((c) => [c.master_sheet_id, flattenJsonText(c.content)]),
    );
    sheets = sheets.filter((s) => {
      const blob = [s.title, (s.tags ?? []).join(" "), contentBySheet.get(s.id) ?? ""].join(" ");
      return smartMatch(blob, q);
    });
  }

  // Fiches d'un thème : d'abord celles sans sous-thème, puis celles de
  // chaque sous-thème dans son ordre d'affichage.
  const subthemeOrder = new Map((subthemes ?? []).map((st, i) => [st.id, i]));
  const rank = (s: SheetRow) => (s.subtheme_id ? (subthemeOrder.get(s.subtheme_id) ?? 0) + 1 : 0);
  const sheetsOfTheme = (list: SheetRow[], themeId: string) =>
    list.filter((s) => s.theme_id === themeId).sort((a, b) => rank(a) - rank(b));

  // themeDispNum() du prototype : numérotation continue de tous les thèmes,
  // famille après famille.
  const themesOf = (familyId: string) => themes.filter((t) => t.family_id === familyId);
  const themeNumber = new Map<string, number>();
  let n = 0;
  for (const f of families) for (const t of themesOf(f.id)) themeNumber.set(t.id, ++n);

  const selectedFamily = !q && sp.famille ? families.find((f) => f.id === sp.famille) : undefined;

  let content: ReactNode;
  if (q) {
    const sections = families
      .map((family) => ({
        family,
        matching: themesOf(family.id).filter((t) => sheets.some((s) => s.theme_id === t.id)),
      }))
      .filter(({ matching }) => matching.length > 0);
    content =
      sections.length === 0 ? (
        <div className="p-5 text-[12.5px] text-[#6b656b] italic">Aucun résultat pour « {q} ».</div>
      ) : (
        sections.map(({ family, matching }) => (
          <div key={family.id} className="mb-6">
            <FamilyHeader family={family} />
            {matching.map((theme) => (
              <ThemeAccordion
                key={theme.id}
                theme={theme}
                number={themeNumber.get(theme.id) ?? 0}
                publishedCount={sheetsOfTheme(visibleSheets, theme.id).length}
                sheets={sheetsOfTheme(sheets, theme.id)}
                open
              />
            ))}
          </div>
        ))
      );
  } else if (selectedFamily) {
    content = (
      <>
        <Link
          href="/bibliotheque"
          className="mb-4 inline-flex items-center gap-[7px] rounded-full border border-primary bg-white px-[18px] py-[9px] text-[12.5px] leading-none font-bold whitespace-nowrap text-primary transition-colors duration-150 hover:bg-primary hover:text-white"
        >
          ← Toutes les familles
        </Link>
        <FamilyHeader family={selectedFamily} />
        {themesOf(selectedFamily.id).map((theme) => (
          <ThemeAccordion
            key={theme.id}
            theme={theme}
            number={themeNumber.get(theme.id) ?? 0}
            publishedCount={sheetsOfTheme(visibleSheets, theme.id).length}
            sheets={sheetsOfTheme(visibleSheets, theme.id)}
          />
        ))}
      </>
    );
  } else {
    content = (
      <>
        <p className="mb-4 text-[13.5px] text-[#6b656b]">
          Choisissez une famille pour accéder à ses thèmes et à ses fiches.
        </p>
        <div className="grid grid-cols-3 gap-4 max-[820px]:grid-cols-1">
          {families.map((family, idx) => {
            const decor = FAMILY_DECOR[family.code];
            const palette = FAMILY_BLOCK[decor?.variant ?? FALLBACK_VARIANTS[idx % 3]];
            const famThemes = themesOf(family.id);
            const ficheCount = visibleSheets.filter((s) =>
              famThemes.some((t) => t.id === s.theme_id),
            ).length;
            return (
              <Link
                key={family.id}
                href={`/bibliotheque?famille=${family.id}`}
                className={`flex min-h-[180px] flex-col rounded-[18px] px-6 py-[26px] transition-[transform,box-shadow] duration-[160ms] hover:-translate-y-1 hover:shadow-[0_18px_40px_-26px_rgba(68,80,104,0.28)] ${palette.block}`}
              >
                <span
                  className={`mb-2 flex items-center gap-[9px] text-[18px] leading-[1.2] font-extrabold ${palette.title}`}
                >
                  {decor?.icon ?? "📁"} {family.name}
                </span>
                <span className={`flex-1 text-[13px] leading-[1.5] ${palette.excerpt}`}>
                  {decor?.example ?? ""}
                </span>
                <span
                  className={`mt-1.5 text-[12.5px] leading-[1.5] font-extrabold ${palette.title}`}
                >
                  {famThemes.length} thèmes · {ficheCount} fiches →
                </span>
              </Link>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <>
      <form
        action="/bibliotheque"
        className="flex flex-wrap items-center gap-[18px] border-b border-border bg-[#f5f0ec] px-[30px] py-[11px]"
      >
        <div className="flex items-center gap-2">
          <label
            htmlFor="bibq"
            className="text-[11px] leading-[1.5] font-bold tracking-[0.06em] text-[#6b656b] uppercase"
          >
            Recherche
          </label>
          <input
            type="search"
            id="bibq"
            name="q"
            defaultValue={q}
            placeholder="Rechercher un mot-clé (thème, fiche, contenu)…"
            className="h-8 w-[180px] rounded-[10px] border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none focus:shadow-[0_0_0_2px_rgba(103,6,38,0.28)]"
          />
        </div>
      </form>

      <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
        <Eyebrow>La bibliothèque RH &amp; Paie</Eyebrow>
        <SectionTitle>Tous les thèmes de la paie</SectionTitle>
        {content}
      </main>
    </>
  );
}

type FamilyVariant = "ta" | "tb" | "tc";
const FALLBACK_VARIANTS: FamilyVariant[] = ["ta", "tb", "tc"];

// Mêmes textes/icônes que l'Accueil (accueil/AccueilContent.tsx,
// FAMILY_DECOR) -- `FAMILIES[].ex` / `.icon` du prototype.
const FAMILY_DECOR: Record<string, { icon: string; example: string; variant: FamilyVariant }> = {
  "FAM-VIE": {
    icon: "👤",
    example: "Embauche · contrat · période d'essai · absences · protection sociale · départ",
    variant: "ta",
  },
  "FAM-REM": {
    icon: "💶",
    example: "Salaire · primes · avantages en nature · congés · frais · net",
    variant: "tb",
  },
  "FAM-COT": {
    icon: "📊",
    example: "Cotisations sociales · exonérations · réductions · charges patronales · DSN",
    variant: "tc",
  },
};

// `.fam-block.ta/.tb/.tc` et `.fam-sec-h.vie/.remu/.cotis` (couche charte
// G2S, ~L2215-2223 + L587-589), valeurs calculées.
const FAMILY_BLOCK: Record<
  FamilyVariant,
  { block: string; title: string; excerpt: string; header: string }
> = {
  ta: {
    block: "bg-[#efe7e1]",
    title: "text-[#3e0417]",
    excerpt: "text-[#8c2447]",
    header: "bg-[#efe7e1] text-[#3e0417]",
  },
  tb: {
    block: "bg-[#eaecef]",
    title: "text-[#364054]",
    excerpt: "text-[#445068]",
    header: "bg-[#eaecef] text-[#445068]",
  },
  tc: {
    block: "bg-[#f5e6eb]",
    title: "text-[#670626]",
    excerpt: "text-[#8c2447]",
    header: "bg-[#f5e6eb] text-[#670626]",
  },
};

function FamilyHeader({ family }: { family: FamilyRow }) {
  const decor = FAMILY_DECOR[family.code];
  const palette = FAMILY_BLOCK[decor?.variant ?? "tb"];
  return (
    <div
      className={`mb-4 rounded-[11px] px-[15px] py-[9px] text-[16px] leading-[1.5] font-extrabold tracking-[0.04em] uppercase ${palette.header}`}
    >
      {decor?.icon ?? "📁"} {family.name}
    </div>
  );
}

// `.theme` / `.theme-head` / `.theme-body` du prototype. <details> natif
// plutôt qu'un état React : même dépliage au clic, sans JavaScript client.
function ThemeAccordion({
  theme,
  number,
  publishedCount,
  sheets,
  open = false,
}: {
  theme: ThemeRow;
  number: number;
  publishedCount: number;
  sheets: SheetRow[];
  open?: boolean;
}) {
  return (
    <details
      open={open}
      className="group mb-3 overflow-hidden rounded-[18px] border border-l-4 border-border border-l-primary bg-white shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]"
    >
      <summary className="grid cursor-pointer list-none grid-cols-[48px_1fr_auto] items-center gap-[15px] px-[18px] py-[15px] select-none hover:bg-[#f5f0ec] [&::-webkit-details-marker]:hidden">
        <span className="flex h-12 w-12 items-center justify-center rounded-[11px] bg-[#eaecef]">
          <b className="text-[19px] leading-[1.5] font-extrabold text-ink">{number}</b>
        </span>
        <span className="block">
          <span className="block text-[16px] leading-[1.5] font-extrabold tracking-[-0.02em] text-ink">
            {theme.name}
          </span>
          <span className="mt-[5px] flex gap-1.5">
            <span className="rounded-full bg-[rgba(103,6,38,0.14)] px-[9px] py-[3px] text-[10px] leading-[1.5] font-bold text-primary">
              {publishedCount ? `${publishedCount} sous-fiches` : "sous-bibliothèque"}
            </span>
            <span className="rounded-full bg-[#eaf7f6] px-[9px] py-[3px] text-[10px] leading-[1.5] font-bold text-[#0e8a87]">
              À jour
            </span>
          </span>
        </span>
        <span className="text-[15px] text-[#6b656b] transition-transform duration-200 group-open:rotate-90">
          ▶
        </span>
      </summary>
      <div className="border-t border-border p-2">
        {sheets.length === 0 ? (
          <div className="px-[14px] py-3 text-[12.5px] text-[#6b656b] italic">
            Aucune fiche publiée pour l&apos;instant dans « {theme.name} ».
          </div>
        ) : (
          sheets.map((sheet) => (
            <Link
              key={sheet.id}
              href={`/bibliotheque/${sheet.id}`}
              className="flex items-center justify-between rounded-[9px] px-[14px] py-[13px] transition-colors duration-[140ms] hover:bg-[#f5f0ec]"
            >
              <span className="text-[14px] font-semibold text-ink">{sheet.title}</span>
              <span className="text-[14px] font-extrabold text-ink">Ouvrir →</span>
            </Link>
          ))
        )}
      </div>
    </details>
  );
}
