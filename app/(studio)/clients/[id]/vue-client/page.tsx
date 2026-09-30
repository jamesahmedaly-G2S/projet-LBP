import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCompanyAffectations } from "@/lib/studio/affectations";
import { Card } from "@/ui-kit/Card";
import { Eyebrow } from "@/app/(client)/_components/Eyebrow";
import { SectionTitle } from "@/app/(client)/_components/SectionTitle";

interface Row {
  id: string;
  name: string;
  family_id?: string;
  theme_id?: string;
}

interface SheetRow {
  id: string;
  title: string;
  theme_id: string;
  subtheme_id: string | null;
}

// STU-CLIENT-04 : arborescence Familles → Thèmes → Sous-thèmes → Fiches,
// même structure que /referentiel (STU-REF-01) mais strictement en lecture
// et limitée aux fiches publiées — "exactement ce que verrait un vrai
// profil client de cette société" (aucun statut de workflow affiché,
// aucun contrôle d'édition). Une fiche publiée est visible par défaut
// (origine "base", STU-DATA-05) SAUF si elle a été retirée manuellement
// pour cette société (STU-AFFECT-03) — filtrée ici comme dans
// AffectationList.tsx ("Retirée manuellement... non visible côté client").
// Tokens sémantiques (text-ink/text-muted/border-border...) plutôt que
// studio-navy/studio-line depuis l'ajout du bandeau nav .theme-client
// (30/09/2026, prévisualisation étendue) -- avant, cette page était la
// seule sous vue-client, jamais dans .theme-client, la palette Studio ne
// jurait pas.
export default async function VueClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: families },
    { data: themes },
    { data: subthemes },
    { data: allSheets },
    affectations,
  ] = await Promise.all([
    supabase.from("master_families").select("id, name").order("display_order"),
    supabase.from("master_themes").select("id, name, family_id").order("display_order"),
    supabase.from("master_subthemes").select("id, name, theme_id").order("display_order"),
    supabase
      .from("master_sheets")
      .select("id, title, theme_id, subtheme_id")
      .eq("status", "published")
      .order("title")
      .returns<SheetRow[]>(),
    getCompanyAffectations(supabase, id),
  ]);

  const removedIds = new Set(
    affectations.filter((a) => a.removedManually).map((a) => a.masterSheetId),
  );
  const sheets = (allSheets ?? []).filter((s) => !removedIds.has(s.id));

  const sheetsOfTheme = (themeId: string, subthemeId: string | null) =>
    sheets.filter((s) => s.theme_id === themeId && s.subtheme_id === subthemeId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Eyebrow>La bibliothèque RH &amp; Paie</Eyebrow>
      <SectionTitle>Bibliothèque</SectionTitle>

      <div className="mt-6 flex flex-col gap-6">
        {(families ?? []).map((family: Row) => (
          <Card key={family.id}>
            <h2 className="text-lg font-semibold text-ink">{family.name}</h2>
            <div className="mt-3 flex flex-col gap-4">
              {(themes ?? [])
                .filter((theme: Row) => theme.family_id === family.id)
                .map((theme: Row) => (
                  <div key={theme.id} className="border-l-2 border-border pl-4">
                    <h3 className="font-medium text-ink">{theme.name}</h3>
                    <SheetList companyId={id} sheets={sheetsOfTheme(theme.id, null)} />
                    {(subthemes ?? [])
                      .filter((subtheme: Row) => subtheme.theme_id === theme.id)
                      .map((subtheme: Row) => (
                        <div key={subtheme.id} className="mt-2 border-l-2 border-border pl-4">
                          <h4 className="text-sm font-medium text-muted">{subtheme.name}</h4>
                          <SheetList companyId={id} sheets={sheetsOfTheme(theme.id, subtheme.id)} />
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}

function SheetList({ companyId, sheets }: { companyId: string; sheets: SheetRow[] }) {
  if (sheets.length === 0) return null;

  return (
    <ul className="mt-2 flex flex-col gap-1">
      {sheets.map((sheet) => (
        <li key={sheet.id} className="text-sm">
          <Link
            href={`/clients/${companyId}/vue-client/${sheet.id}`}
            className="text-primary hover:underline"
          >
            {sheet.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
