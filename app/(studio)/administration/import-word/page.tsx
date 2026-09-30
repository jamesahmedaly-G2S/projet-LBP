import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import ImportWordForm from "./ImportWordForm";

export default async function ImportWordPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: families }, { data: themes }, { data: subthemes }] = await Promise.all([
    supabase.from("master_families").select("id, name").order("display_order"),
    supabase.from("master_themes").select("id, name, family_id").order("display_order"),
    supabase.from("master_subthemes").select("id, name, theme_id").order("display_order"),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/administration" className="text-sm text-studio-blue hover:underline">
        ← Administration
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-studio-navy">Import Word</h1>
      <p className="mt-1 text-sm text-studio-muted">
        Lecture native d&apos;un fichier .docx (STU-IMPORT-01/02) — mapping et contrôle G2S
        (STU-IMPORT-03) avant toute création réelle.
      </p>

      <Card className="mt-6">
        <ImportWordForm
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
