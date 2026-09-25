import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import CcnSection from "./CcnSection";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { AffectationList } from "../../_components/AffectationList";
import { getCompanyAffectations } from "@/lib/studio/affectations";

// Page volontairement minimale pour l'instant : CCN (STU-CCN-02) et fiches
// affectées (STU-AFFECT-02) sont câblées. Identité, établissements, offre,
// utilisateurs, questionnaire, historique et bloc "Suivi annuel" restent à
// construire en STU-CLIENT-02, sur cette même route.
export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, company_name, offer_tier")
    .eq("id", id)
    .single();

  if (!company) {
    notFound();
  }

  const [{ data: catalog }, { data: companyCcns }, affectations] = await Promise.all([
    supabase.from("ccn_catalog").select("idcc, name").order("name"),
    supabase.from("company_ccns").select("ccn_idcc").eq("company_id", id),
    getCompanyAffectations(supabase, id),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">{company.company_name}</h1>
        <Badge tone="blue">Palier {company.offer_tier}</Badge>
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-zinc-800">Conventions collectives</h2>
        <CcnSection
          companyId={company.id}
          catalog={catalog ?? []}
          initialSelected={(companyCcns ?? []).map((row) => row.ccn_idcc)}
        />
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-zinc-800">
          Fiches affectées — pourquoi ces fiches sont présentes
        </h2>
        <AffectationList affectations={affectations} />
      </Card>
    </main>
  );
}
