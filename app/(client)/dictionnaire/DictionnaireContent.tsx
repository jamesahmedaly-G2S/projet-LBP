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
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>Les mots de la paie</Eyebrow>
      <SectionTitle>Dictionnaire</SectionTitle>
      <p className="mb-4 max-w-[720px] text-[14px] text-muted">
        Les notions de paie et de droit social, classées par ordre alphabétique. Les définitions
        s&apos;appuient sur la doctrine officielle (BOSS, URSSAF, Code du travail).
      </p>

      <div>
        <DictionaryList terms={terms ?? []} />
      </div>
    </main>
  );
}
