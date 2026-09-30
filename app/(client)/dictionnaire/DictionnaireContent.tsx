import { createClient } from "@/lib/supabase/server";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";
import DictionaryList, { type DictionaryTerm } from "./DictionaryList";

// LBP-CLIENT-14 : contenu sans dépendance de session, extrait pour être
// réutilisé par la vraie page client et la prévisualisation admin
// (STU-CLIENT-04 étendu) sans dupliquer la requête.
export default async function DictionnaireContent() {
  const supabase = await createClient();

  const { data: terms } = await supabase
    .from("dictionary_terms")
    .select("id, term, definition, source")
    .order("term")
    .returns<DictionaryTerm[]>();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Eyebrow>Les mots de la paie</Eyebrow>
      <SectionTitle>Dictionnaire</SectionTitle>
      <p className="-mt-3 text-sm text-muted">
        Les termes essentiels de la paie et du droit social.
      </p>

      <div className="mt-6">
        <DictionaryList terms={terms ?? []} />
      </div>
    </main>
  );
}
