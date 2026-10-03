import Link from "next/link";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCompanyAffectations } from "@/lib/studio/affectations";
import { smartMatch, flattenJsonText } from "@/lib/client/smart-search";
import { Card } from "@/ui-kit/Card";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";

interface Row {
  id: string;
  name: string;
  family_id?: string;
  theme_id?: string;
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
export default async function BibliothequePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
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
    { data: company },
    { data: families },
    { data: themes },
    { data: subthemes },
    { data: allSheets },
    affectations,
  ] = await Promise.all([
    supabase.from("companies").select("company_name").eq("id", companyId).single(),
    supabase.from("master_families").select("id, name").order("display_order"),
    supabase.from("master_themes").select("id, name, family_id").order("display_order"),
    supabase.from("master_subthemes").select("id, name, theme_id").order("display_order"),
    supabase
      .from("master_sheets")
      .select("id, title, tags, theme_id, subtheme_id")
      .eq("status", "published")
      .order("title")
      .returns<SheetRow[]>(),
    getCompanyAffectations(supabase, companyId),
  ]);

  const removedIds = new Set(
    affectations.filter((a) => a.removedManually).map((a) => a.masterSheetId),
  );
  let sheets = (allSheets ?? []).filter((s) => !removedIds.has(s.id));

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

  const sheetsOfTheme = (themeId: string, subthemeId: string | null) =>
    sheets.filter((s) => s.theme_id === themeId && s.subtheme_id === subthemeId);
  const themeHasMatch = (themeId: string) => sheets.some((s) => s.theme_id === themeId);
  const familyHasMatch = (familyId: string) =>
    (themes ?? []).some((t: Row) => t.family_id === familyId && themeHasMatch(t.id));

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>La bibliothèque RH &amp; Paie</Eyebrow>
      <SectionTitle>Bibliothèque</SectionTitle>
      <p className="-mt-3 text-sm text-muted">
        L&apos;ensemble des fiches accessibles pour {company?.company_name ?? "votre société"}.
      </p>

      <form action="/bibliotheque" className="mt-4 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Rechercher un mot-clé (thème, fiche, contenu)…"
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm text-ink"
        />
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Rechercher
        </button>
      </form>

      {q && sheets.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-muted">Aucun résultat pour « {q} ».</p>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {(families ?? [])
            .filter((family: Row) => !q || familyHasMatch(family.id))
            .map((family: Row) => (
              <Card key={family.id}>
                <h2 className="text-lg font-semibold text-ink">{family.name}</h2>
                <div className="mt-3 flex flex-col gap-4">
                  {(themes ?? [])
                    .filter((theme: Row) => theme.family_id === family.id)
                    .filter((theme: Row) => !q || themeHasMatch(theme.id))
                    .map((theme: Row) => (
                      <div key={theme.id} className="border-l-2 border-border pl-4">
                        <h3 className="font-medium text-ink">{theme.name}</h3>
                        <SheetList sheets={sheetsOfTheme(theme.id, null)} />
                        {(subthemes ?? [])
                          .filter((subtheme: Row) => subtheme.theme_id === theme.id)
                          .map((subtheme: Row) => (
                            <div key={subtheme.id} className="mt-2 border-l-2 border-border pl-4">
                              <h4 className="text-sm font-medium text-muted">{subtheme.name}</h4>
                              <SheetList sheets={sheetsOfTheme(theme.id, subtheme.id)} />
                            </div>
                          ))}
                      </div>
                    ))}
                </div>
              </Card>
            ))}
        </div>
      )}
    </main>
  );
}

function SheetList({ sheets }: { sheets: SheetRow[] }) {
  if (sheets.length === 0) return null;

  return (
    <ul className="mt-2 flex flex-col gap-1">
      {sheets.map((sheet) => (
        <li key={sheet.id} className="text-sm">
          <Link href={`/bibliotheque/${sheet.id}`} className="text-primary hover:underline">
            {sheet.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
