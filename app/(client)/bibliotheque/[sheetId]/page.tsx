import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getSheetLayersForClient } from "@/lib/client/sheet-content";
import { getCompanyAffectations } from "@/lib/studio/affectations";
import { Eyebrow } from "../../_components/Eyebrow";
import { SectionTitle } from "../../_components/SectionTitle";
import FicheRubriques from "./FicheRubriques";

const LAYER_LABEL: Record<string, string> = {
  ccn: "La convention collective",
  ent: "Les accords d'entreprise",
  proc: "Procédure interne",
};

interface AssociatedQuiz {
  id: string;
  title: string;
}

// Pendant client réel de app/(studio)/clients/[id]/vue-client/[sheetId]/page.tsx
// (STU-CLIENT-04), mais via getSheetLayersForClient() plutôt que
// getVisibleLayersForCompany() — cette dernière interroge sheet_versions
// directement (admin-only par RLS, STU-DATA-02), ce qui renvoie
// silencieusement aucune ligne pour une vraie session cliente (trouvé en
// testant en réel : la fiche s'ouvrait mais aucun contenu ne s'affichait).
//
// Surlignage jaune (STU-WORKFLOW-05) non branché ici, volontairement :
// getPublishedContentDiff() a le même problème (sheet_versions direct), et
// la version précédente nécessaire au diff est `historized` — un statut
// que client_sheet_content n'expose à personne d'autre qu'un admin (sa
// clause WHERE ne retient que status='published' pour un non-admin).
// Réparable proprement par une future extension ciblée de cette vue, pas
// tentée ici pour rester dans le périmètre "fondations minimum" —
// documenté plutôt que masqué par un faux surlignage.
export default async function BibliothequeFichePage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  const session = await requireClient();
  const companyId = session.profile.company_id;
  if (!companyId) notFound();

  const { sheetId } = await params;
  const supabase = await createClient();

  const { data: sheet } = await supabase
    .from("master_sheets")
    .select("id, title, status, theme_id")
    .eq("id", sheetId)
    .eq("status", "published")
    .single();

  if (!sheet) notFound();

  const { data: theme } = await supabase
    .from("master_themes")
    .select("name, family_id")
    .eq("id", sheet.theme_id)
    .maybeSingle<{ name: string; family_id: string }>();

  const affectations = await getCompanyAffectations(supabase, companyId);
  const removed = affectations.find((a) => a.masterSheetId === sheetId)?.removedManually;
  if (removed) notFound();

  const layers = await getSheetLayersForClient(supabase, sheetId);
  const rg = layers.find((l) => l.layerKind === "rg");
  const overlays = layers.filter((l) => l.layerKind !== "rg");

  // LBP-CLIENT-03 (finitions, 30/09/2026) : lien vers le quiz associé à la
  // fiche. Le vrai prototype (selLevel()/quizPlayerHTML()) joue le quiz en
  // ligne, comme un onglet de plus sur la fiche elle-même -- mais
  // LBP-CLIENT-06 a déjà construit un vrai lecteur de quiz dédié
  // (/mes-quiz/[id], QuizPlayer.tsx, historique des scores compris) :
  // reproduire une deuxième implémentation de lecture de quiz ici aurait
  // dupliqué cette logique. Un lien suffit.
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title")
    .eq("master_sheet_id", sheetId)
    .eq("published", true)
    .maybeSingle<AssociatedQuiz>();

  // Correctif fidélité (06/10/2026), mesuré sur `#v-fiche` du prototype
  // (openFiche()/selLevel(), LBP_V9.9_Studio.html ~L11140-11160) : lien
  // `.back` "← Retour à « thème »" (13px/700 carbone), surtitre "thème ›
  // fiche", `.section-title`, puis les 6 cartes de rubrique et le bloc de
  // la rubrique sélectionnée (FicheRubriques.tsx) -- plus de cartes
  // empilées par couche : les couches CCN/entreprise/procédure sont
  // présentées en niveaux numérotés à l'intérieur de chaque rubrique.
  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <div className="mb-1.5 flex items-center gap-3">
        <Link
          href={theme ? `/bibliotheque?famille=${theme.family_id}` : "/bibliotheque"}
          className="py-1 text-[13px] font-bold text-ink hover:underline"
        >
          ← Retour à « {theme?.name ?? "la bibliothèque"} »
        </Link>
      </div>
      <Eyebrow>{theme ? `${theme.name} › fiche` : "Fiche"}</Eyebrow>
      <SectionTitle>{sheet.title}</SectionTitle>

      <FicheRubriques
        rg={rg?.content ?? null}
        overlays={overlays.map((layer) => ({
          id: layer.id,
          label: `${LAYER_LABEL[layer.layerKind]}${layer.ccnName ? ` — ${layer.ccnName}` : ""}`,
          content: layer.content,
        }))}
        quiz={quiz ?? null}
      />
    </main>
  );
}
