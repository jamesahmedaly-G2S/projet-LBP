import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getWizardCompany, WZ_STEPS } from "@/lib/studio/wizard-steps";
import { getCompanyAffectations } from "@/lib/studio/affectations";
import { Card } from "@/ui-kit/Card";
import WizardStepper from "@/app/(studio)/_components/WizardStepper";
import WizardNav from "@/app/(studio)/_components/WizardNav";

// STU-CLIENT-01 (étape 4 — Calcul automatique). Le prototype recalculait
// en JS (`computeAffectation(wzAsClient())`) sur un client jamais encore
// persisté ; ici la société existe déjà réellement (étape 1), donc on
// interroge directement la vraie vue `company_sheet_affectations`
// (STU-DATA-05/STU-AFFECT-01) — jamais une seconde implémentation du calcul.
export default async function CalculStepPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const company = await getWizardCompany(supabase, id);

  const [{ count: ccnCount }, affectations] = await Promise.all([
    supabase
      .from("company_ccns")
      .select("ccn_idcc", { count: "exact", head: true })
      .eq("company_id", id),
    getCompanyAffectations(supabase, id),
  ]);

  const active = affectations.filter((a) => !a.removedManually);
  const byOrigin = (origin: string) => active.filter((a) => a.origins.includes(origin)).length;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-studio-navy">{company.company_name}</h1>
      <p className="mt-1 text-sm text-studio-muted">Assistant de création guidée</p>

      <div className="mt-6">
        <WizardStepper steps={WZ_STEPS} currentStep={4} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-2 text-lg font-semibold text-studio-navy">
          Étape 4 — Calcul automatique des contenus
        </h2>

        {!ccnCount ? (
          <p className="text-sm text-studio-red">
            Sélectionnez au moins une convention collective à l&apos;étape précédente avant de
            poursuivre.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-studio-muted">
              Le moteur a calculé une proposition d&apos;affectation. Rien n&apos;est encore publié.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Kpi label="Fiches proposées" value={active.length} />
              <Kpi label="Déclenchées par le questionnaire" value={byOrigin("questionnaire")} />
              <Kpi label="Couches conventionnelles" value={byOrigin("ccn")} />
              <Kpi label="CCN retenues" value={ccnCount ?? 0} />
            </div>
          </>
        )}

        <WizardNav
          backHref={`/clients/nouvelle/${id}/3`}
          nextHref={ccnCount ? `/clients/nouvelle/${id}/5` : undefined}
        />
      </Card>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-studio-line bg-white p-4">
      <div className="text-xs text-studio-muted">{label}</div>
      <div className="text-3xl font-bold text-studio-navy">{value}</div>
    </div>
  );
}
