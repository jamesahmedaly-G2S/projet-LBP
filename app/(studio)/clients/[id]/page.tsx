import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import CcnSection from "./CcnSection";

// Page volontairement minimale pour l'instant : seule la section CCN
// (STU-CCN-02) est câblée. Identité, établissements, offre, utilisateurs,
// questionnaire, fiches affectées, historique et bloc "Suivi annuel"
// restent à construire en STU-CLIENT-02, sur cette même route.
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

  const [{ data: catalog }, { data: companyCcns }] = await Promise.all([
    supabase.from("ccn_catalog").select("idcc, name").order("name"),
    supabase.from("company_ccns").select("ccn_idcc").eq("company_id", id),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">{company.company_name}</h1>
      <p className="text-sm text-zinc-500">Palier {company.offer_tier}</p>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-zinc-800">Conventions collectives</h2>
        <CcnSection
          companyId={company.id}
          catalog={catalog ?? []}
          initialSelected={(companyCcns ?? []).map((row) => row.ccn_idcc)}
        />
      </div>
    </main>
  );
}
