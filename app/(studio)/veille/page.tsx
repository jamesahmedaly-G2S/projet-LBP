import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getMonitoringStatusLabel, getMonitoringStatusTone } from "@/lib/studio/monitoring-status";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { LinkButton } from "@/ui-kit/LinkButton";
import RunConnectorsButton from "./RunConnectorsButton";

interface MonitoringRow {
  id: string;
  source: string;
  title: string;
  text_date: string | null;
  summary: string | null;
  impact: string | null;
  link: string | null;
  status: string;
  created_at: string;
}

// STU-VEILLE-01 : liste des entrées de veille — étape 1 "Détection" (§10).
export default async function VeillePage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("legal_monitoring")
    .select("id, source, title, text_date, summary, impact, link, status, created_at")
    .order("created_at", { ascending: false })
    .returns<MonitoringRow[]>();

  const rows = entries ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Veille réglementaire</h1>
        <LinkButton href="/veille/nouvelle" variant="primary">
          + Nouvelle entrée
        </LinkButton>
      </div>

      <Card className="mt-6">
        <h2 className="mb-2 text-sm font-medium text-zinc-600">
          Connecteurs automatiques (7 sources officielles)
        </h2>
        <RunConnectorsButton />
      </Card>

      {rows.length === 0 ? (
        <Card className="mt-6">
          <p className="text-sm text-zinc-400">Aucune entrée de veille pour l&apos;instant.</p>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {rows.map((entry) => (
            <Card key={entry.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/veille/${entry.id}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {entry.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {entry.source}
                    {entry.text_date &&
                      ` · ${new Date(entry.text_date).toLocaleDateString("fr-FR")}`}
                  </p>
                </div>
                <Badge tone={getMonitoringStatusTone(entry.status)}>
                  {getMonitoringStatusLabel(entry.status)}
                </Badge>
              </div>
              {entry.summary && <p className="mt-2 text-sm text-zinc-700">{entry.summary}</p>}
              {entry.impact && (
                <p className="mt-1 text-xs text-zinc-500">
                  Impact : <span className="italic">{entry.impact}</span>
                </p>
              )}
              {entry.link && (
                <a
                  href={entry.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-xs text-blue-600 hover:underline"
                >
                  Source d&apos;origine ↗
                </a>
              )}
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
