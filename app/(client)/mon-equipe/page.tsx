import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import EstablishmentsSection from "./EstablishmentsSection";
import TeamSection, { type TeamMember } from "./TeamSection";
import PayrollForm from "./PayrollForm";
import ToolsForm from "./ToolsForm";

// LBP-CLIENT-02 : "Mon équipe" [§1.3, p.9 du cahier des charges réel —
// vérifié verbatim "1.3 Mon équipe" dans le PDF]. Identité (1.3.1) reste
// en lecture seule : companies_update_admin (RLS réelle de James) ne
// permet pas au client d'écrire directement sur `companies` — cohérent
// avec le principe déjà établi pour l'offre (le client demande, G2S
// contrôle). Établissements (1.3.1), Organisation (1.3.2, team_members),
// Organisation de la paie (1.3.3, payroll_org) et Outils (1.3.4,
// software_stack) sont pleinement gérables par le client — ces trois
// tables existent déjà dans le schéma réel (baseline_schema_reel.sql
// §9.1/9.2) avec une RLS `company_id = current_company_id()`, jamais
// consommées par aucun écran avant ce ticket. "Vos documents" (1.3.5)
// demande un vrai stockage de fichiers — non tenté ici, périmètre trop
// large pour ce seul ticket (voir tickets/LBP-CLIENT.md).
export default async function MonEquipePage() {
  const session = await requireClient();
  const companyId = session.profile.company_id;

  if (!companyId) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-danger">
          Aucune société rattachée à ce compte — contactez votre référent G2S.
        </p>
      </main>
    );
  }

  const supabase = await createClient();

  const [
    { data: company },
    { data: establishments },
    { data: members },
    { data: payrollOrg },
    { data: softwareStack },
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("company_name, legal_form, headcount")
      .eq("id", companyId)
      .single(),
    supabase
      .from("establishments")
      .select("id, name, address")
      .eq("company_id", companyId)
      .order("name"),
    supabase
      .from("team_members")
      .select("id, name, job_title, department, email, phone, manager_id")
      .eq("company_id", companyId)
      .order("name")
      .returns<TeamMember[]>(),
    supabase
      .from("payroll_org")
      .select("operating_mode, provider_name")
      .eq("company_id", companyId)
      .maybeSingle(),
    supabase
      .from("software_stack")
      .select("payroll_software, hris, time_management, other_tools, has_specifications")
      .eq("company_id", companyId)
      .maybeSingle(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">Mon équipe</h1>
      <p className="mt-1 text-sm text-muted">Votre société, votre organisation et vos outils RH.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-ink">Identité</h2>
          <dl className="mt-3 flex flex-col gap-1.5 text-sm">
            <div>
              <dt className="text-muted">Raison sociale</dt>
              <dd className="text-ink">{company?.company_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Forme</dt>
              <dd className="text-ink">{company?.legal_form ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Effectif</dt>
              <dd className="text-ink">{company?.headcount ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-muted">
            Ces informations sont gérées par votre référent G2S. Les établissements ci-dessous
            restent modifiables directement.
          </p>
          <h3 className="mt-4 text-sm font-semibold text-ink">Établissements</h3>
          <div className="mt-2">
            <EstablishmentsSection establishments={establishments ?? []} />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-ink">Organisation</h2>
          <p className="mt-1 text-xs text-muted">Votre organigramme.</p>
          <div className="mt-3">
            <TeamSection members={members ?? []} />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-ink">Organisation de la paie</h2>
          <div className="mt-3">
            <PayrollForm
              operatingMode={payrollOrg?.operating_mode ?? null}
              providerName={payrollOrg?.provider_name ?? null}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-ink">Outils</h2>
          <div className="mt-3">
            <ToolsForm
              payrollSoftware={softwareStack?.payroll_software ?? null}
              hris={softwareStack?.hris ?? null}
              timeManagement={softwareStack?.time_management ?? null}
              otherTools={softwareStack?.other_tools ?? null}
              hasSpecifications={softwareStack?.has_specifications ?? false}
            />
          </div>
        </Card>
      </div>
    </main>
  );
}
