import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import DictionaryList, { type DictionaryTerm } from "./DictionaryList";

// LBP-CLIENT-14 : "Dictionnaire" — 14e module ajouté après vérification
// (voir tickets/LBP-CLIENT.md pour la trace complète). `dictionary_terms`
// vient d'être créée (migration 20260928130000), RLS filtre déjà les
// brouillons pour un rôle client — pas de filtre supplémentaire requis
// ici, mais order() explicite pour un tri alphabétique stable.
export default async function DictionnairePage() {
  await requireClient();
  const supabase = await createClient();

  const { data: terms } = await supabase
    .from("dictionary_terms")
    .select("id, term, definition, source")
    .order("term")
    .returns<DictionaryTerm[]>();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">Dictionnaire</h1>
      <p className="mt-1 text-sm text-muted">
        Les termes essentiels de la paie et du droit social.
      </p>

      <div className="mt-6">
        <DictionaryList terms={terms ?? []} />
      </div>
    </main>
  );
}
