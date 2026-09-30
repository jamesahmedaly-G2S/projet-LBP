import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import AccueilContent from "@/app/(client)/accueil/AccueilContent";

export default async function VueClientAccueilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("company_name, offer_tier")
    .eq("id", id)
    .single();

  return (
    <AccueilContent
      companyId={id}
      greetingName={company?.company_name ?? "—"}
      offerTier={company?.offer_tier ?? null}
      linkPrefix={`/clients/${id}/vue-client`}
    />
  );
}
