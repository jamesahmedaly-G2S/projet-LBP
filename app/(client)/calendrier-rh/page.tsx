import { requireClient } from "@/lib/auth/session";
import CalendarContent from "./CalendarContent";
import type { CalendarEventType } from "@/lib/client/calendar-taxonomy";

export default async function CalendrierRhPage({
  searchParams,
}: {
  searchParams: Promise<{
    annee?: string;
    mois?: string;
    jour?: string;
    theme?: string;
    type?: string;
  }>;
}) {
  const session = await requireClient();
  const sp = await searchParams;

  const today = new Date();
  const year = sp.annee ? Number(sp.annee) : today.getFullYear();
  const month = sp.mois ? Number(sp.mois) : today.getMonth() + 1;

  return (
    <CalendarContent
      year={year}
      month={month}
      day={sp.jour ?? null}
      theme={sp.theme ?? null}
      typeEv={(sp.type as CalendarEventType) ?? null}
      companyId={session.profile.company_id}
      userId={session.userId}
    />
  );
}
