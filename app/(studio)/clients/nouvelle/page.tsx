import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import { WZ_STEPS } from "@/lib/studio/wizard-steps";
import WizardStepper from "@/app/(studio)/_components/WizardStepper";
import NewCompanyForm from "./NewCompanyForm";

// STU-CLIENT-01 (étape 1 — Entreprise) : première étape de l'assistant,
// pas encore rattachée à une société (elle n'existe pas tant que ce
// formulaire n'a pas été soumis) — seule étape sans layout `[id]` partagé.
export default async function NouveauClientPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from("offer_tiers")
    .select("tier_level, name, price_label")
    .order("tier_level");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-studio-navy">Nouveau client</h1>
      <p className="mt-1 text-sm text-studio-muted">Assistant de création guidée</p>

      <div className="mt-6">
        <WizardStepper steps={WZ_STEPS} currentStep={1} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-studio-navy">Étape 1 — Entreprise</h2>
        <NewCompanyForm offers={offers ?? []} />
      </Card>
    </main>
  );
}
