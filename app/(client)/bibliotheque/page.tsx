import Link from "next/link";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCompanyAffectations } from "@/lib/studio/affectations";
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
  theme_id: string;
  subtheme_id: string | null;
}

// Premier écran réel du LBP Client (fondations STU-CLIENT) : même
// arborescence Familles → Thèmes → Sous-thèmes → Fiches que le mode
// "Accéder au LBP du client" déjà construit côté Studio
// (app/(studio)/clients/[id]/vue-client/page.tsx, STU-CLIENT-04), mais
// pour une vraie session cliente — la même règle d'affectation
// (getCompanyAffectations, retire les fiches désactivées manuellement)
// avec company_id résolu depuis la session plutôt que passé en URL par un
// admin. Jamais une deuxième implémentation de cette logique.
export default async function BibliothequePage() {
  const session = await requireClient();
  const companyId = session.profile.company_id;

  if (!companyId) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
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
      .select("id, title, theme_id, subtheme_id")
      .eq("status", "published")
      .order("title")
      .returns<SheetRow[]>(),
    getCompanyAffectations(supabase, companyId),
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
      <p className="-mt-3 text-sm text-muted">
        L&apos;ensemble des fiches accessibles pour {company?.company_name ?? "votre société"}.
      </p>

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
