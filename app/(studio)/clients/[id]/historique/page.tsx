import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCompanySpecificContent } from "@/lib/studio/client-fiche";
import { getWorkflowStatusLabel, getWorkflowStatusTone } from "@/lib/studio/workflow-status";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";

interface HistoryEvent {
  date: string;
  title: string;
  detail?: string;
  badgeLabel?: string;
  badgeTone?: "neutral" | "blue" | "green" | "amber" | "red";
}

// STU-CLIENT-02 (§5.2, "historique") : port de `stOpenHisto()`
// (`LBP_V6_Studio.html`) — reconstruit uniquement à partir d'événements
// réellement horodatés en base (création, publication, overrides manuels,
// contenus spécifiques, entretiens réalisés). Contrairement au prototype
// (tableau `PUBLICATIONS` dédié), aucune table d'historique séparée
// n'existe pour les publications rg/ccn globales (partagées entre tous les
// clients, non traçables "par client") — ce ticket ne recrée pas cette
// table hors périmètre, l'historique reste composé des seuls événements
// réellement propres à ce client.
export default async function ClientHistoriquePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id, company_name, created_at, published_at")
    .eq("id", id)
    .single();

  if (!company) {
    notFound();
  }

  const [{ data: overrides }, specificContent, { data: interviews }] = await Promise.all([
    supabase
      .from("company_sheet_overrides")
      .select("id, action, reason, created_at, master_sheets(title)")
      .eq("company_id", id),
    getCompanySpecificContent(supabase, id),
    supabase
      .from("company_interviews")
      .select("id, status, completed_at")
      .eq("company_id", id)
      .eq("status", "done"),
  ]);

  const events: HistoryEvent[] = [
    { date: company.created_at, title: "Création du client" },
    ...(company.published_at
      ? [{ date: company.published_at, title: "Publication vers l'espace client" }]
      : []),
    ...(overrides ?? []).map((o) => ({
      date: o.created_at as string,
      title: o.action === "add" ? "Ajout manuel G2S" : "Retrait manuel G2S",
      detail: `${(o.master_sheets as unknown as { title: string } | null)?.title ?? ""} — ${o.reason ?? ""}`,
      badgeLabel: o.action === "add" ? "Manuel" : "Retiré",
      badgeTone: o.action === "add" ? ("amber" as const) : ("red" as const),
    })),
    ...specificContent.map((c) => ({
      date: c.updatedAt,
      title: "Contenu spécifique entreprise",
      detail: `${c.title} · v${c.version}`,
      badgeLabel: getWorkflowStatusLabel(c.status),
      badgeTone: getWorkflowStatusTone(c.status),
    })),
    ...(interviews ?? [])
      .filter((i) => i.completed_at)
      .map((i) => ({
        date: i.completed_at as string,
        title: "Entretien annuel réalisé",
        badgeLabel: "Fait",
        badgeTone: "green" as const,
      })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href={`/clients/${id}`} className="text-sm text-studio-blue hover:underline">
        ← Retour à la fiche client
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-studio-navy">
        Historique — {company.company_name}
      </h1>
      <p className="mt-1 text-sm text-studio-muted">
        Créations, modifications, validations et publications.
      </p>

      <Card className="mt-6" padded={false}>
        {events.length === 0 ? (
          <p className="p-5 text-sm text-studio-muted">Aucun événement pour l&apos;instant.</p>
        ) : (
          <ul>
            {events.map((event, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 border-b border-studio-line px-5 py-3 text-sm last:border-0"
              >
                <div>
                  <div className="font-medium text-studio-navy">{event.title}</div>
                  <div className="text-xs text-studio-muted">
                    {event.detail ? `${event.detail} · ` : ""}
                    {new Date(event.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
                {event.badgeLabel && <Badge tone={event.badgeTone}>{event.badgeLabel}</Badge>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
