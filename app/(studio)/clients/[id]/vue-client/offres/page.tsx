import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import OffresContent from "@/app/(client)/offres/OffresContent";

export default async function VueClientOffresPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("companies")
    .select("offer_tier")
    .eq("id", id)
    .single();

  if (!company || company.offer_tier === null) notFound();

  return (
    <OffresContent
      companyId={id}
      offerTier={company.offer_tier}
      linkPrefix={`/clients/${id}/vue-client`}
      readOnly
    />
  );
}
