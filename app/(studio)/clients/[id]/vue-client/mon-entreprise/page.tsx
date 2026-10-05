import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import { Eyebrow } from "@/app/(client)/_components/Eyebrow";
import { SectionTitle } from "@/app/(client)/_components/SectionTitle";
import { DOCUMENT_CATEGORIES, type CompanyDocument } from "@/lib/client/company-documents";

interface TeamMemberRow {
  id: string;
  name: string;
  job_title: string | null;
  department: string | null;
}

// STU-CLIENT-04 (étendu) : équivalent en lecture seule de
// app/(client)/mon-entreprise/page.tsx -- jamais les composants
// EstablishmentsSection/TeamSection/PayrollForm/ToolsForm réels, qui
// exposent des actions d'écriture (ajout/suppression) : "aucun droit
// d'écriture supplémentaire" (STU-CLIENT-04, critère d'acceptation).
//
// Correctif (04/10/2026), suite au retour de l'utilisateur ("on corrige
// de notre côté") : "Vos documents" (LBP-CLIENT-02) ajouté ici en simple
// compte par catégorie -- l'édition complète reste sur
// `/clients/[id]/documents` (écran admin dédié), pas dupliquée ici.
export default async function VueClientMonEntreprisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id: companyId } = await params;
  const supabase = await createClient();

  const [
    { data: company },
    { data: establishments },
    { data: members },
    { data: payrollOrg },
    { data: softwareStack },
    { data: documents },
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
      .select("id, name, job_title, department")
      .eq("company_id", companyId)
      .order("name")
      .returns<TeamMemberRow[]>(),
    supabase
      .from("payroll_org")
      .select("operating_mode, provider_name")
      .eq("company_id", companyId)
      .maybeSingle(),
    supabase
      .from("software_stack")
      .select("payroll_software, hris, time_management, other_tools")
      .eq("company_id", companyId)
      .maybeSingle(),
    supabase
      .from("company_documents")
      .select("id, category, name, meta, doc_date, url")
      .eq("company_id", companyId)
      .returns<CompanyDocument[]>(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Eyebrow>Mon espace</Eyebrow>
      <SectionTitle>Mon entreprise</SectionTitle>
      <p className="-mt-3 text-sm text-muted">
        Votre société, votre organisation et vos outils RH.
      </p>

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
          <h3 className="mt-4 text-sm font-semibold text-ink">Établissements</h3>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {(establishments ?? []).length === 0 && (
              <li className="text-muted">Aucun établissement.</li>
            )}
            {(establishments ?? []).map((e) => (
              <li key={e.id} className="text-ink">
                {e.name}
                {e.address && <span className="text-muted"> — {e.address}</span>}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-ink">Organisation</h2>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {(members ?? []).length === 0 && <li className="text-muted">Aucun membre.</li>}
            {(members ?? []).map((m) => (
              <li key={m.id} className="text-ink">
                {m.name}
                {m.job_title && <span className="text-muted"> — {m.job_title}</span>}
                {m.department && <span className="text-muted"> ({m.department})</span>}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-ink">Organisation de la paie</h2>
          <dl className="mt-3 flex flex-col gap-1.5 text-sm">
            <div>
              <dt className="text-muted">Mode de gestion</dt>
              <dd className="text-ink">{payrollOrg?.operating_mode ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Prestataire</dt>
              <dd className="text-ink">{payrollOrg?.provider_name ?? "—"}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-ink">Outils</h2>
          <dl className="mt-3 flex flex-col gap-1.5 text-sm">
            <div>
              <dt className="text-muted">Logiciel de paie</dt>
              <dd className="text-ink">{softwareStack?.payroll_software ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">SIRH</dt>
              <dd className="text-ink">{softwareStack?.hris ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Gestion des temps</dt>
              <dd className="text-ink">{softwareStack?.time_management ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Autres outils</dt>
              <dd className="text-ink">{softwareStack?.other_tools ?? "—"}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-ink">Vos documents</h2>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            {DOCUMENT_CATEGORIES.map((cat) => {
              const count = (documents ?? []).filter((d) => d.category === cat.key).length;
              return (
                <li key={cat.key} className="flex items-center justify-between text-ink">
                  <span>
                    {cat.icon} {cat.label}
                  </span>
                  <span className="text-muted">
                    {count} document{count > 1 ? "s" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </main>
  );
}
