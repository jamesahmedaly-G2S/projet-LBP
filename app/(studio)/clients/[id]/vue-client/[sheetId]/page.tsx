import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getVisibleLayersForCompany } from "@/lib/studio/client-view";
import { getPublishedContentDiff, type ContentDiff } from "@/lib/studio/content-diff";
import { SHEET_CONTENT_FIELDS, type SheetContent } from "@/lib/studio/placeholder-content";
import { Card } from "@/ui-kit/Card";

const LAYER_LABEL: Record<string, string> = {
  ccn: "Complément conventionnel",
  ent: "Contenu spécifique entreprise",
  proc: "Procédure interne",
};

// STU-CLIENT-04 : fiche telle qu'un vrai profil client de cette société la
// verrait — couche régime général (toujours visible, surlignage jaune des
// modifications récentes câblé ici, STU-WORKFLOW-05) puis, selon les CCN et
// l'offre réels de la société, les couches complémentaires applicables
// (lib/studio/client-view.ts, même règle que la vraie vue RLS
// client_sheet_content, STU-DATA-07).
export default async function VueClientFichePage({
  params,
}: {
  params: Promise<{ id: string; sheetId: string }>;
}) {
  await requireAdmin();
  const { id, sheetId } = await params;
  const supabase = await createClient();

  const { data: sheet } = await supabase
    .from("master_sheets")
    .select("id, title, status")
    .eq("id", sheetId)
    .eq("status", "published")
    .single();

  if (!sheet) {
    notFound();
  }

  const [layers, diff] = await Promise.all([
    getVisibleLayersForCompany(supabase, id, sheetId),
    getPublishedContentDiff(supabase, sheetId, "rg"),
  ]);

  const rg = layers.find((l) => l.layerKind === "rg");
  const overlays = layers.filter((l) => l.layerKind !== "rg");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href={`/clients/${id}/vue-client`} className="text-sm text-studio-blue hover:underline">
        ← Retour au référentiel
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-studio-navy">{sheet.title}</h1>

      {rg && (
        <Card className="mt-6">
          <ContentFields content={rg.content} diff={diff} />
        </Card>
      )}

      {overlays.map((layer) => (
        <Card key={layer.id} className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-studio-blue">
            {LAYER_LABEL[layer.layerKind]}
            {layer.ccnName ? ` — ${layer.ccnName}` : ""}
          </h2>
          <ContentFields content={layer.content} diff={null} />
        </Card>
      ))}
    </main>
  );
}

function ContentFields({ content, diff }: { content: SheetContent; diff: ContentDiff | null }) {
  return (
    <div className="flex flex-col gap-4">
      {SHEET_CONTENT_FIELDS.map(({ key, label }) => (
        <div key={key}>
          <h3 className="mb-1 text-sm font-semibold text-studio-navy">{label}</h3>
          <p className="text-sm leading-relaxed text-studio-navy">
            {diff?.[key] ? (
              diff[key].map((segment, i) => (
                <span key={i} className={segment.changed ? "bg-yellow-200" : ""}>
                  {segment.text}
                </span>
              ))
            ) : (
              <span>{content[key]}</span>
            )}
          </p>
        </div>
      ))}
    </div>
  );
}
