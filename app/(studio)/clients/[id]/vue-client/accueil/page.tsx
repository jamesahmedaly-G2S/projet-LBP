import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import AccueilContent from "@/app/(client)/accueil/AccueilContent";
import type { CalendarEventType, CalendarEventScope } from "@/lib/client/calendar-taxonomy";

export default async function VueClientAccueilPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    cal_annee?: string;
    cal_mois?: string;
    cal_theme?: string;
    cal_type?: string;
    cal_portee?: string;
  }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
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
      calYear={sp.cal_annee ? Number(sp.cal_annee) : undefined}
      calMonth={sp.cal_mois ? Number(sp.cal_mois) : undefined}
      calTheme={sp.cal_theme ?? null}
      calType={(sp.cal_type as CalendarEventType) ?? null}
      calScope={(sp.cal_portee as CalendarEventScope) ?? null}
    />
  );
}
