import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getWorkflowStatusLabel, getWorkflowStatusTone } from "@/lib/studio/workflow-status";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { LinkButton } from "@/ui-kit/LinkButton";

interface MasterFamilyRow {
  id: string;
  code: string;
  name: string;
  display_order: number;
}

interface MasterThemeRow {
  id: string;
  code: string;
  name: string;
  family_id: string;
  display_order: number;
}

interface MasterSubthemeRow {
  id: string;
  code: string;
  name: string;
  theme_id: string;
  display_order: number;
}

interface MasterSheetRow {
  id: string;
  code: string;
  title: string;
  status: string;
  theme_id: string;
  subtheme_id: string | null;
}

// STU-REF-01 : arborescence Familles -> Thèmes -> Sous-thèmes -> Fiches du
// référentiel maître, avec le statut de workflow de chaque fiche.
export default async function ReferentielPage() {
  await requireAdmin();

  const supabase = await createClient();

  const [{ data: families }, { data: themes }, { data: subthemes }, { data: sheets }] =
    await Promise.all([
      supabase
        .from("master_families")
        .select("id, code, name, display_order")
        .order("display_order")
        .returns<MasterFamilyRow[]>(),
      supabase
        .from("master_themes")
        .select("id, code, name, family_id, display_order")
        .order("display_order")
        .returns<MasterThemeRow[]>(),
      supabase
        .from("master_subthemes")
        .select("id, code, name, theme_id, display_order")
        .order("display_order")
        .returns<MasterSubthemeRow[]>(),
      supabase
        .from("master_sheets")
        .select("id, code, title, status, theme_id, subtheme_id")
        .order("title")
        .returns<MasterSheetRow[]>(),
    ]);

  const sheetsOfTheme = (themeId: string, subthemeId: string | null) =>
    (sheets ?? []).filter(
      (sheet) => sheet.theme_id === themeId && sheet.subtheme_id === subthemeId,
    );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Référentiel maître</h1>
        <LinkButton href="/referentiel/nouvelle-fiche" variant="primary">
          + Nouvelle fiche
        </LinkButton>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {(families ?? []).map((family) => (
          <Card key={family.id}>
            <h2 className="text-lg font-semibold text-zinc-800">{family.name}</h2>

            <div className="mt-3 flex flex-col gap-4">
              {(themes ?? [])
                .filter((theme) => theme.family_id === family.id)
                .map((theme) => (
                  <div key={theme.id} className="border-l-2 border-zinc-100 pl-4">
                    <h3 className="font-medium text-zinc-700">{theme.name}</h3>

                    <SheetList sheets={sheetsOfTheme(theme.id, null)} />

                    {(subthemes ?? [])
                      .filter((subtheme) => subtheme.theme_id === theme.id)
                      .map((subtheme) => (
                        <div key={subtheme.id} className="mt-2 border-l-2 border-zinc-100 pl-4">
                          <h4 className="text-sm font-medium text-zinc-600">{subtheme.name}</h4>
                          <SheetList sheets={sheetsOfTheme(theme.id, subtheme.id)} />
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

function SheetList({ sheets }: { sheets: MasterSheetRow[] }) {
  if (sheets.length === 0) {
    return null;
  }

  return (
    <ul className="mt-2 flex flex-col gap-1">
      {sheets.map((sheet) => (
        <li key={sheet.id} className="flex items-center justify-between gap-3 text-sm">
          <Link href={`/referentiel/${sheet.id}`} className="text-blue-700 hover:underline">
            {sheet.title}
          </Link>
          <Badge tone={getWorkflowStatusTone(sheet.status)}>
            {getWorkflowStatusLabel(sheet.status)}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
