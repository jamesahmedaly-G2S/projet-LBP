import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCompanyAffectations } from "@/lib/studio/affectations";
import { summarizeEntretiens, type InterviewRow } from "@/lib/studio/entretien";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import EntretienCell from "./EntretienCell";

// STU-CLIENT-03 (§5.1) : "ne pas ajouter une colonne 'État'. La couleur est
// portée directement par la cellule 'Prochain entretien'" — pas de colonne
// distincte, la seule information de statut visible EST la couleur de
// cette cellule (EntretienCell, réutilise les mêmes seuils que la fiche
// client, STU-CLIENT-02 : jamais une deuxième version de ce calcul).
export default async function ClientsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: companies } = await supabase
    .from("companies")
    .select("id, company_name, offer_tier")
    .order("company_name");

  const rows = await Promise.all(
    (companies ?? []).map(async (company) => {
      const [
        { data: offer },
        { data: ccns },
        affectations,
        { data: interviews },
        { data: lastAnswer },
      ] = await Promise.all([
        supabase.from("offer_tiers").select("name").eq("tier_level", company.offer_tier).single(),
        supabase.from("company_ccns").select("ccn_idcc").eq("company_id", company.id),
        getCompanyAffectations(supabase, company.id),
        supabase
          .from("company_interviews")
          .select("status, planned_at, completed_at")
          .eq("company_id", company.id)
          .returns<InterviewRow[]>(),
        supabase
          .from("company_questionnaire_answers")
          .select("answered_at")
          .eq("company_id", company.id)
          .order("answered_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      return {
        id: company.id,
        name: company.company_name,
        offerName: offer?.name ?? `Palier ${company.offer_tier}`,
        ccnCount: (ccns ?? []).length,
        sheetCount: affectations.filter((a) => !a.removedManually).length,
        questionnaireDone: Boolean(lastAnswer?.answered_at),
        entretien: summarizeEntretiens(interviews ?? []),
      };
    }),
  );

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-studio-navy">Clients</h1>

      <Card padded={false}>
        <table className="w-full text-sm">
          <thead className="border-b border-studio-line text-left text-xs text-studio-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Entreprise</th>
              <th className="px-5 py-3 font-medium">Offre</th>
              <th className="px-5 py-3 font-medium">CCN</th>
              <th className="px-5 py-3 font-medium">Questionnaire</th>
              <th className="px-5 py-3 font-medium">Fiches</th>
              <th className="px-5 py-3 font-medium">Prochain entretien</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-studio-line last:border-0">
                <td className="px-5 py-3">
                  <Link
                    href={`/clients/${row.id}`}
                    className="font-medium text-studio-blue hover:underline"
                  >
                    {row.name}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <Badge tone="blue">{row.offerName}</Badge>
                </td>
                <td className="px-5 py-3 text-studio-navy">{row.ccnCount}</td>
                <td className="px-5 py-3 text-studio-navy">
                  {row.questionnaireDone ? "Répondu" : "Non rempli"}
                </td>
                <td className="px-5 py-3 text-studio-navy">{row.sheetCount}</td>
                <td className="px-5 py-3">
                  <EntretienCell summary={row.entretien} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-3 text-sm text-studio-muted">
                  Aucune société.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </main>
  );
}
