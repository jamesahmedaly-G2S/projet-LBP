import Link from "next/link";
import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getSheetLayersForClient } from "@/lib/client/sheet-content";
import { getCompanyAffectations } from "@/lib/studio/affectations";
import { SHEET_CONTENT_FIELDS, type SheetContent } from "@/lib/studio/placeholder-content";
import { Card } from "@/ui-kit/Card";

const LAYER_LABEL: Record<string, string> = {
  ccn: "Complément conventionnel",
  ent: "Contenu spécifique entreprise",
  proc: "Procédure interne",
};

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
    .select("id, title, status")
    .eq("id", sheetId)
    .eq("status", "published")
    .single();

  if (!sheet) notFound();

  const affectations = await getCompanyAffectations(supabase, companyId);
  const removed = affectations.find((a) => a.masterSheetId === sheetId)?.removedManually;
  if (removed) notFound();

  const layers = await getSheetLayersForClient(supabase, sheetId);
  const rg = layers.find((l) => l.layerKind === "rg");
  const overlays = layers.filter((l) => l.layerKind !== "rg");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/bibliotheque" className="text-sm text-primary hover:underline">
        ← Retour à la bibliothèque
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-ink">{sheet.title}</h1>

      {rg && (
        <Card className="mt-6">
          <ContentFields content={rg.content} />
        </Card>
      )}

      {overlays.map((layer) => (
        <Card key={layer.id} className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
            {LAYER_LABEL[layer.layerKind]}
            {layer.ccnName ? ` — ${layer.ccnName}` : ""}
          </h2>
          <ContentFields content={layer.content} />
        </Card>
      ))}
    </main>
  );
}

function ContentFields({ content }: { content: SheetContent }) {
  return (
    <div className="flex flex-col gap-4">
      {SHEET_CONTENT_FIELDS.map(({ key, label }) => (
        <div key={key}>
          <h3 className="mb-1 text-sm font-semibold text-ink">{label}</h3>
          <p className="text-sm leading-relaxed text-ink">{content[key]}</p>
        </div>
      ))}
    </div>
  );
}
