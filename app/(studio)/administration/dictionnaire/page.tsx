import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import TermsManager, { type DictionaryTermAdmin } from "./TermsManager";

// LBP-CLIENT-14 (admin) : écran G2S manquant, signalé par l'utilisateur.
// `dictionary_terms_write_admin`/`update_admin`/`delete_admin` (migration
// 20260928130000) existaient déjà, jamais consommées par aucun écran.
export default async function AdminDictionnairePage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: terms } = await supabase
    .from("dictionary_terms")
    .select("id, term, definition, source, published")
    .order("term")
    .returns<DictionaryTermAdmin[]>();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/administration" className="text-sm text-studio-blue hover:underline">
        ← Administration
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-studio-navy">Dictionnaire</h1>
      <p className="mt-1 text-sm text-studio-muted">
        Les termes affichés sur le dictionnaire du LBP Client. Un terme non publié reste un
        brouillon, visible uniquement ici.
      </p>

      <Card className="mt-6">
        <TermsManager terms={terms ?? []} />
      </Card>
    </main>
  );
}
