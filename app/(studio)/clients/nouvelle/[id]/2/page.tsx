import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getWizardCompany, WZ_STEPS } from "@/lib/studio/wizard-steps";
import { Card } from "@/ui-kit/Card";
import WizardStepper from "@/app/(studio)/_components/WizardStepper";
import WizardNav from "@/app/(studio)/_components/WizardNav";
import EstablishmentsForm from "./EstablishmentsForm";

// STU-CLIENT-01 (étape 2 — Établissements). Pas de "Précédent" vers
// l'étape 1 : une fois la société créée, il n'existe pas de version
// "étape 1 pour cette société existante" à revisiter (contrairement au
// prototype, où tout reste en mémoire tant que l'étape 6 n'a pas eu lieu).
export default async function EtablissementsStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const company = await getWizardCompany(supabase, id);

  const { data: establishments } = await supabase
    .from("establishments")
    .select("name, address")
    .eq("company_id", id)
    .order("name");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-studio-navy">{company.company_name}</h1>
      <p className="mt-1 text-sm text-studio-muted">Assistant de création guidée</p>

      <div className="mt-6">
        <WizardStepper steps={WZ_STEPS} currentStep={2} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-studio-navy">Étape 2 — Établissements</h2>
        <EstablishmentsForm
          companyId={id}
          initial={
            establishments && establishments.length > 0
              ? establishments.map((e) => ({ name: e.name, address: e.address ?? "" }))
              : [{ name: "", address: "" }]
          }
        />
        <WizardNav nextHref={`/clients/nouvelle/${id}/3`} />
      </Card>
    </main>
  );
}
