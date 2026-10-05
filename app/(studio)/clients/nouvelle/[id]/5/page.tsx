import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getWizardCompany, WZ_STEPS } from "@/lib/studio/wizard-steps";
import { getCompanyAffectations } from "@/lib/studio/affectations";
import { Card } from "@/ui-kit/Card";
import WizardStepper from "@/app/(studio)/_components/WizardStepper";
import WizardNav from "@/app/(studio)/_components/WizardNav";
import { AffectationList } from "@/app/(studio)/_components/AffectationList";
import { AddOverrideForm } from "@/app/(studio)/clients/[id]/AddOverrideForm";

// STU-CLIENT-01 (étape 5 — Contrôle G2S). Réutilise tel quel
// AffectationList (retrait inline) et AddOverrideForm (ajout, STU-AFFECT-03)
// — même écran que la fiche client, aucune logique dupliquée.
export default async function ControleStepPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const company = await getWizardCompany(supabase, id);

  const [affectations, { data: publishedSheets }] = await Promise.all([
    getCompanyAffectations(supabase, id),
    supabase
      .from("master_sheets")
      .select("id, code, title")
      .eq("status", "published")
      .order("title"),
  ]);

  const manuallyAddedIds = new Set(
    affectations.filter((a) => a.origins.includes("manual")).map((a) => a.masterSheetId),
  );
  const availableSheets = (publishedSheets ?? []).filter(
    (sheet) => !manuallyAddedIds.has(sheet.id),
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-studio-navy">{company.company_name}</h1>
      <p className="mt-1 text-sm text-studio-muted">Assistant de création guidée</p>

      <div className="mt-6">
        <WizardStepper steps={WZ_STEPS} currentStep={5} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-2 text-lg font-semibold text-studio-navy">Étape 5 — Contrôle G2S</h2>
        <p className="mb-4 text-sm text-studio-muted">
          Ajoutez ou retirez manuellement des fiches. Chaque intervention reste tracée.
        </p>
        <AffectationList affectations={affectations} companyId={id} />
        <div className="mt-4 border-t border-studio-line pt-4">
          <AddOverrideForm companyId={id} availableSheets={availableSheets} />
        </div>
      </Card>

      <WizardNav backHref={`/clients/nouvelle/${id}/4`} nextHref={`/clients/nouvelle/${id}/6`} />
    </main>
  );
}
