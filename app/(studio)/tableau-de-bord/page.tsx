import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getImpactedCompanies } from "@/lib/studio/publication-impact";
import { summarizeEntretiens, type InterviewRow } from "@/lib/studio/entretien";
import { STUDIO_SETTINGS } from "@/lib/studio/settings";
import { getRecentActivity } from "@/lib/studio/activity";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import EntretienCell from "../clients/EntretienCell";

// STU-DASH-01/02 : port de `stDash()` — "l'ouverture du Studio doit
// répondre immédiatement à la question : Qu'est-ce que G2S doit traiter
// aujourd'hui ?" (§4). Écart volontaire et documenté par rapport au
// prototype : celui-ci gonfle artificiellement plusieurs chiffres
// (`+5`, `+7`, `CLIENTS.length*4+2`...) pour que la démo paraisse plus
// active — remplacé ici par des comptages réels, chacun identique à ce
// qu'on obtiendrait en filtrant l'écran détaillé correspondant (critère
// d'acceptation explicite de STU-DASH-01).
export default async function TableauDeBordPage() {
  const session = await requireAdmin();
  const supabase = await createClient();

  const [
    { data: allCompanies },
    { count: publishedSheetCount },
    { count: veilleNewCount },
    { count: reviewCount },
    { data: allCompanyCcns },
    { data: answeredRows },
    { data: pendingVersions },
    { data: recentPublications },
  ] = await Promise.all([
    supabase.from("companies").select("id, company_name").order("company_name"),
    supabase
      .from("master_sheets")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("legal_monitoring")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("sheet_versions")
      .select("id", { count: "exact", head: true })
      .eq("status", "review"),
    supabase.from("company_ccns").select("company_id"),
    supabase.from("company_questionnaire_answers").select("company_id"),
    supabase
      .from("sheet_versions")
      .select("layer_kind, ccn_idcc, company_id")
      .in("status", ["valid", "scheduled"]),
    supabase
      .from("sheet_versions")
      .select("id, master_sheet_id, version, published_at, master_sheets(title)")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(5),
  ]);

  const companies = allCompanies ?? [];

  // Alertes réelles, dérivées directement des mêmes tables que les écrans
  // détaillés, jamais une condition inventée.
  const companyIdsWithCcn = new Set((allCompanyCcns ?? []).map((r) => r.company_id));
  const companiesNoCcn = companies.filter((c) => !companyIdsWithCcn.has(c.id));

  const answeredCompanyIds = new Set((answeredRows ?? []).map((r) => r.company_id));
  const noAnswerCompanies = companies.filter((c) => !answeredCompanyIds.has(c.id));

  // Clients potentiellement impactés par les validations en attente
  // (valid/scheduled) — union dédupliquée de getImpactedCompanies() par
  // version, la même fonction que l'aperçu de publication (STU-WORKFLOW-03).
  const impactedIds = new Set<string>();
  for (const v of pendingVersions ?? []) {
    const impacted = await getImpactedCompanies(supabase, {
      layerKind: v.layer_kind,
      ccnIdcc: v.ccn_idcc,
      companyId: v.company_id,
    });
    impacted.forEach((c) => impactedIds.add(c.id));
  }

  // Entretiens à venir, triés par échéance la plus proche (mêmes seuils
  // que la liste clients, STU-CLIENT-03, jamais une deuxième version).
  const entretienRows = await Promise.all(
    companies.map(async (c) => {
      const { data: rows } = await supabase
        .from("company_interviews")
        .select("status, planned_at, completed_at")
        .eq("company_id", c.id)
        .returns<InterviewRow[]>();
      return { id: c.id, name: c.company_name, summary: summarizeEntretiens(rows ?? []) };
    }),
  );
  const upcomingEntretiens = entretienRows
    .filter((r) => r.summary.daysUntilNext !== null)
    .sort((a, b) => (a.summary.daysUntilNext ?? 0) - (b.summary.daysUntilNext ?? 0))
    .slice(0, 5);

  const alerts: string[] = [
    ...companiesNoCcn.map((c) => `CCN non renseignée — ${c.company_name}`),
    ...entretienRows
      .filter((r) => (r.summary.daysUntilNext ?? Infinity) <= STUDIO_SETTINGS.entretienSeuilRouge)
      .map((r) => `Entretien en urgence — ${r.name}`),
  ];

  const activity = await getRecentActivity(supabase, 5);

  const firstName = session.profile.full_name.split(" ")[0];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-studio-navy">Bonjour {firstName}</h1>
      <p className="mt-1 text-sm text-studio-muted">
        Voici ce qui nécessite votre attention aujourd&apos;hui.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi href="/clients" label="Clients actifs" value={companies.length} />
        <Kpi href="/referentiel" label="Fiches publiées" value={publishedSheetCount ?? 0} />
        <Kpi href="/veille" label="MAJ à traiter" value={veilleNewCount ?? 0} />
        <Kpi href="/referentiel/controle" label="Validations en attente" value={reviewCount ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-studio-navy">À traiter</h2>
          <ul className="flex flex-col gap-2 text-sm">
            <TraiterRow
              n={veilleNewCount ?? 0}
              label="évolution(s) réglementaire(s) à analyser"
              href="/veille"
            />
            <TraiterRow
              n={reviewCount ?? 0}
              label="fiche(s) à valider"
              href="/referentiel/controle"
            />
            <TraiterRow
              n={noAnswerCompanies.length}
              label="client(s) sans réponse au questionnaire"
              href="/clients"
            />
            <TraiterRow
              n={impactedIds.size}
              label="client(s) potentiellement impacté(s) par les validations en attente"
              href="/affectations"
            />
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold text-studio-navy">Entretiens à venir</h2>
          {upcomingEntretiens.length === 0 ? (
            <p className="text-sm text-studio-muted">Aucun entretien à afficher.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcomingEntretiens.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-studio-navy">{r.name}</span>
                  <EntretienCell summary={r.summary} />
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Link
              href="/entretiens"
              className="text-xs font-medium text-studio-blue hover:underline"
            >
              Voir tous les entretiens →
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-studio-navy">Dernières publications</h2>
          {(recentPublications ?? []).length === 0 ? (
            <p className="text-sm text-studio-muted">Aucune publication.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(recentPublications ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                  <div>
                    <Link
                      href={`/referentiel/${p.master_sheet_id}`}
                      className="font-medium text-studio-blue hover:underline"
                    >
                      {(p.master_sheets as unknown as { title: string } | null)?.title ?? "?"}
                    </Link>
                    <div className="text-xs text-studio-muted">
                      v{p.version} ·{" "}
                      {p.published_at && new Date(p.published_at).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <Badge tone="green">Publié</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold text-studio-navy">
            Alertes &amp; activité récente
          </h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-studio-muted">Aucune alerte.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm text-studio-navy">
              {alerts.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}
          <div className="mt-4 border-t border-studio-line pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-studio-muted">
              Activité
            </p>
            {activity.length === 0 ? (
              <p className="text-sm text-studio-muted">Aucune activité récente.</p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-xs text-studio-muted">
                {activity.map((a, i) => (
                  <li key={i}>
                    <span className="text-studio-navy">{a.label}</span>
                    {" · "}
                    {new Date(a.date).toLocaleDateString("fr-FR")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

function Kpi({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-studio-line bg-white p-4 transition-colors hover:border-studio-blue"
    >
      <div className="text-xs text-studio-muted">{label}</div>
      <div className="mt-1 text-3xl font-bold text-studio-navy">{value}</div>
    </Link>
  );
}

function TraiterRow({ n, label, href }: { n: number; label: string; href: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span>
        <span className="mr-2 font-bold text-studio-blue">{n}</span>
        {label}
      </span>
      <Link href={href} className="text-xs font-medium text-studio-blue hover:underline">
        Traiter →
      </Link>
    </li>
  );
}
