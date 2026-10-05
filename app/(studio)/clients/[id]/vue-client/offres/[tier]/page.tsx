import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import OfferDetailContent from "@/app/(client)/offres/[tier]/OfferDetailContent";

export default async function VueClientOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string; tier: string }>;
}) {
  await requireAdmin();
  const { id, tier } = await params;
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("offer_tier")
    .eq("id", id)
    .single();

  return (
    <OfferDetailContent
      tierParam={tier}
      companyId={id}
      offerTier={company?.offer_tier ?? null}
      linkPrefix={`/clients/${id}/vue-client`}
      readOnly
    />
  );
}
