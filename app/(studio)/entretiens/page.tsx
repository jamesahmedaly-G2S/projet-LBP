import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { summarizeEntretiens, bucketEntretien, type InterviewRow } from "@/lib/studio/entretien";
import { Card } from "@/ui-kit/Card";
import EntretienCell from "../clients/EntretienCell";
import StartInterviewButton from "../clients/[id]/entretien/StartInterviewButton";

const BUCKETS = [
  { key: "retard", label: "En retard" },
  { key: "aPlanifier", label: "À planifier" },
  { key: "planifie", label: "Planifiés" },
  { key: "realise", label: "Suivi à jour" },
] as const;

// STU-INTERVIEW-01 (§11) : port de `stEntretiens()` — vue globale groupée
// par échéance (mêmes seuils que la liste clients, STU-CLIENT-03, jamais
// une deuxième version du calcul).
export default async function EntretiensPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: companies } = await supabase
    .from("companies")
    .select("id, company_name")
    .order("company_name");

  const rows = await Promise.all(
    (companies ?? []).map(async (company) => {
      const { data: interviews } = await supabase
        .from("company_interviews")
        .select("status, planned_at, completed_at")
        .eq("company_id", company.id)
        .returns<InterviewRow[]>();

      const summary = summarizeEntretiens(interviews ?? []);
      return {
        id: company.id,
        name: company.company_name,
        summary,
        bucket: bucketEntretien(interviews ?? [], summary),
      };
    }),
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-studio-navy">Entretiens annuels</h1>
      <p className="mt-1 text-sm text-studio-muted">Vue globale du suivi client.</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {BUCKETS.map(({ key, label }) => {
          const list = rows.filter((r) => r.bucket === key);
          return (
            <Card key={key}>
              <h2 className="mb-3 text-lg font-semibold text-studio-navy">
                {label}{" "}
                <span className="text-sm font-normal text-studio-muted">· {list.length}</span>
              </h2>
              {list.length === 0 ? (
                <p className="text-sm text-studio-muted">Aucun client.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {list.map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-studio-navy">{row.name}</div>
                        {row.summary.lastDoneDate && (
                          <div className="text-xs text-studio-muted">
                            Dernier :{" "}
                            {new Date(`${row.summary.lastDoneDate}T12:00:00`).toLocaleDateString(
                              "fr-FR",
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <EntretienCell summary={row.summary} />
                        <StartInterviewButton companyId={row.id} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </main>
  );
}
