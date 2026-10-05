import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import NewSheetForm from "./NewSheetForm";
import { Card } from "@/ui-kit/Card";

export default async function NouvelleFichePage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: families }, { data: themes }, { data: subthemes }] = await Promise.all([
    supabase.from("master_families").select("id, name").order("display_order"),
    supabase.from("master_themes").select("id, name, family_id").order("display_order"),
    supabase.from("master_subthemes").select("id, name, theme_id").order("display_order"),
  ]);

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-studio-navy">Nouvelle fiche maître</h1>

      <Card>
        <NewSheetForm
          families={(families ?? []).map((f) => ({ id: f.id, name: f.name, parentId: null }))}
          themes={(themes ?? []).map((t) => ({ id: t.id, name: t.name, parentId: t.family_id }))}
          subthemes={(subthemes ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            parentId: s.theme_id,
          }))}
        />
      </Card>
    </main>
  );
}
