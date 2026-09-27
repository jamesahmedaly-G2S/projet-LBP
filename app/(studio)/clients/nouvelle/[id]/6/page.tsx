import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getWizardCompany, WZ_STEPS } from "@/lib/studio/wizard-steps";
import { getCompanyAffectations } from "@/lib/studio/affectations";
import { Card } from "@/ui-kit/Card";
import WizardStepper from "@/app/(studio)/_components/WizardStepper";
import WizardNav from "@/app/(studio)/_components/WizardNav";

// STU-CLIENT-01 (étape 6 — Validation). Pure relecture : contrairement au
// prototype (qui ne crée le client qu'ici, `wzNext()` step===6), la
// société existe déjà depuis l'étape 1 — rien à écrire à cette étape.
export default async function ValidationStepPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const company = await getWizardCompany(supabase, id);

  const [{ data: offer }, { count: etabCount }, { data: ccns }, affectations] = await Promise.all([
    supabase.from("offer_tiers").select("name").eq("tier_level", company.offer_tier).single(),
    supabase
      .from("establishments")
      .select("id", { count: "exact", head: true })
      .eq("company_id", id),
    supabase.from("company_ccns").select("ccn_idcc, ccn_catalog(name)").eq("company_id", id),
    getCompanyAffectations(supabase, id),
  ]);

  const active = affectations.filter((a) => !a.removedManually);
  const manualAdds = active.filter((a) => a.origins.includes("manual")).length;
  const manualRemoves = affectations.filter((a) => a.removedManually).length;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-studio-navy">{company.company_name}</h1>
      <p className="mt-1 text-sm text-studio-muted">Assistant de création guidée</p>

      <div className="mt-6">
        <WizardStepper steps={WZ_STEPS} currentStep={6} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-2 text-lg font-semibold text-studio-navy">Étape 6 — Validation</h2>
        <p className="mb-4 text-sm text-studio-muted">
          Vérifiez la configuration avant publication. Aucun contenu n&apos;est encore visible par
          le client.
        </p>
        <ul className="flex flex-col gap-2 text-sm text-studio-navy">
          <li className="font-bold">{company.company_name}</li>
          <li>Offre {offer?.name ?? "—"}</li>
          <li>
            {etabCount ?? 0} établissement{(etabCount ?? 0) > 1 ? "s" : ""}
          </li>
          <li>
            {ccns?.length ?? 0} CCN :{" "}
            {(ccns ?? [])
              .map(
                (c) =>
                  `${(c.ccn_catalog as unknown as { name: string } | null)?.name ?? c.ccn_idcc} (${c.ccn_idcc})`,
              )
              .join(", ") || "—"}
          </li>
          <li>
            {active.length} fiches proposées · {manualAdds} ajout(s) manuel(s) · {manualRemoves}{" "}
            retrait(s)
          </li>
        </ul>
      </Card>

      <WizardNav
        backHref={`/clients/nouvelle/${id}/5`}
        nextHref={`/clients/nouvelle/${id}/7`}
        nextLabel="Valider la configuration"
      />
    </main>
  );
}
