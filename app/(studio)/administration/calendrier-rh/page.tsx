import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import CalendarEventsManager, { type CalendarEventAdmin } from "./CalendarEventsManager";

export default async function AdminCalendrierRhPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, event_date, title, category, event_type, note, published")
    .eq("scope", "national")
    .order("event_date")
    .returns<CalendarEventAdmin[]>();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/administration" className="text-sm text-studio-blue hover:underline">
        ← Administration
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-studio-navy">Calendrier RH</h1>
      <p className="mt-1 text-sm text-studio-muted">
        Échéances nationales affichées côté client (/calendrier-rh) — jours fériés, obligations
        déclaratives, temps forts RH. Les évènements propres à une société ou personnels sont gérés
        directement par ses utilisateurs, pas ici.
      </p>

      <Card className="mt-6">
        <CalendarEventsManager events={events ?? []} />
      </Card>
    </main>
  );
}
