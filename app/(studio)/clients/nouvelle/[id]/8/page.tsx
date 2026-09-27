import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getWizardCompany, WZ_STEPS } from "@/lib/studio/wizard-steps";
import { Card } from "@/ui-kit/Card";
import { LinkButton } from "@/ui-kit/LinkButton";
import WizardStepper from "@/app/(studio)/_components/WizardStepper";
import WizardNav from "@/app/(studio)/_components/WizardNav";
import InviteClientForm from "./InviteClientForm";

// STU-CLIENT-01 (étape 8 — Accès client, dernière étape). Port de
// `c.nom + "a été créé et son LBP est publié"` — avec un vrai compte
// (profiles.role='client' par défaut, créé par handle_new_user() depuis
// les métadonnées de l'invitation, cf. actions.ts).
export default async function AccesClientStepPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const company = await getWizardCompany(supabase, id);

  const { data: clientProfile } = await supabase
    .from("profiles")
    .select("id, full_name, status")
    .eq("company_id", id)
    .eq("role", "client")
    .maybeSingle();

  let clientEmail: string | null = null;
  if (clientProfile) {
    const admin = createServiceRoleClient();
    const { data } = await admin.auth.admin.getUserById(clientProfile.id);
    clientEmail = data.user?.email ?? null;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-studio-navy">{company.company_name}</h1>
      <p className="mt-1 text-sm text-studio-muted">Assistant de création guidée</p>

      <div className="mt-6">
        <WizardStepper steps={WZ_STEPS} currentStep={8} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-2 text-lg font-semibold text-studio-navy">Étape 8 — Accès client</h2>

        {!company.published_at ? (
          <p className="text-sm text-studio-red">
            Publiez d&apos;abord la configuration à l&apos;étape précédente.
          </p>
        ) : clientProfile ? (
          <>
            <p className="mb-4 text-sm text-studio-navy">
              Le client <strong>{company.company_name}</strong> a été créé et son LBP est publié.
              Invitation envoyée à <strong>{clientEmail}</strong> ({clientProfile.status}).
            </p>
            <div className="flex flex-wrap gap-2">
              <LinkButton href={`/clients/${id}`} variant="secondary">
                Voir la fiche client
              </LinkButton>
              <LinkButton href="/clients" variant="secondary">
                Retour à la liste
              </LinkButton>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-studio-muted">
              Le LBP de <strong>{company.company_name}</strong> est publié. Créez l&apos;accès de
              son premier utilisateur pour terminer.
            </p>
            <InviteClientForm companyId={id} />
          </>
        )}
      </Card>

      <WizardNav backHref={`/clients/nouvelle/${id}/7`} />
    </main>
  );
}
