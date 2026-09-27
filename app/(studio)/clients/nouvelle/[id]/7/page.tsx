import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getWizardCompany, WZ_STEPS } from "@/lib/studio/wizard-steps";
import { Card } from "@/ui-kit/Card";
import WizardStepper from "@/app/(studio)/_components/WizardStepper";
import WizardNav from "@/app/(studio)/_components/WizardNav";
import PublishButton from "./PublishButton";

const WORKFLOW_STAGES = [
  "Brouillon",
  "À vérifier",
  "Validé",
  "Programmé",
  "Publié",
  "Historisé",
  "Archivé",
];

// STU-CLIENT-01 (étape 7 — Publication). Port de `wzNext()` step===7 :
// "le seul moment où les contenus entrent dans l'espace client" — chez
// nous, ce moment est `companies.published_at` (ajouté par la migration
// 20260927193000), jamais un simple écran sans effet.
export default async function PublicationStepPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const company = await getWizardCompany(supabase, id);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-studio-navy">{company.company_name}</h1>
      <p className="mt-1 text-sm text-studio-muted">Assistant de création guidée</p>

      <div className="mt-6">
        <WizardStepper steps={WZ_STEPS} currentStep={7} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-2 text-lg font-semibold text-studio-navy">Étape 7 — Publication</h2>
        <p className="mb-4 text-sm text-studio-muted">
          La publication est le <strong>seul</strong> moment où les contenus entrent dans
          l&apos;espace client.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-1 text-xs">
          {WORKFLOW_STAGES.map((stage, i) => (
            <span key={stage} className="flex items-center gap-1">
              <span
                className={`rounded-full px-2.5 py-1 font-medium ${
                  i === 4
                    ? "bg-studio-blue text-white"
                    : "border border-studio-line bg-white text-studio-muted"
                }`}
              >
                {stage}
              </span>
              {i < WORKFLOW_STAGES.length - 1 && <span className="text-studio-muted">→</span>}
            </span>
          ))}
        </div>

        {company.published_at ? (
          <p className="text-sm text-studio-green">
            Publié le {new Date(company.published_at).toLocaleDateString("fr-FR")}.
          </p>
        ) : (
          <PublishButton companyId={id} />
        )}
      </Card>

      <WizardNav
        backHref={`/clients/nouvelle/${id}/6`}
        nextHref={company.published_at ? `/clients/nouvelle/${id}/8` : undefined}
      />
    </main>
  );
}
