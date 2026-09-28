import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { keyFigureLabel, CEILING_TABLE_ORDER } from "@/lib/client/key-figure-labels";
import { Card } from "@/ui-kit/Card";

interface KeyFigureRow {
  key: string;
  year: number;
  value: number;
  unit: string;
  note: string | null;
  group_id: string | null;
}
interface GroupRow {
  id: string;
  title: string;
  sub: string | null;
  display_order: number;
}
interface ContributionRow {
  id: string;
  category: string | null;
  label: string;
  base: string | null;
  employee_rate: string | null;
  employer_rate: string | null;
  is_header: boolean;
  display_order: number;
}

// LBP-CLIENT-05 : "Chiffres Paie" [§1.6, p.11]. Vérifié contre le vrai
// code du prototype (LBP_V6_Studio.html, renderChiffres(), lignes
// 3141-3165) avant de construire. Toutes les données viennent de
// key_figures/key_figure_groups/contribution_rates/payroll_reference_settings
// (migration 20260928150000) — rien n'est écrit en dur ici, seuls les
// libellés (lib/client/key-figure-labels.ts) et l'ordre du tableau
// plafond le sont, comme pour l'Accueil.
export default async function ChiffresPaiePage() {
  await requireClient();
  const supabase = await createClient();

  const [{ data: settings }, { data: groups }, { data: figures }, { data: contributions }] =
    await Promise.all([
      supabase.from("payroll_reference_settings").select("*").eq("id", 1).single(),
      supabase.from("key_figure_groups").select("*").order("display_order").returns<GroupRow[]>(),
      supabase
        .from("key_figures")
        .select("key, year, value, unit, note, group_id")
        .or("show_as_card.eq.true,show_in_ceiling_table.eq.true")
        .order("year", { ascending: false })
        .returns<KeyFigureRow[]>(),
      supabase
        .from("contribution_rates")
        .select("*")
        .order("display_order")
        .returns<ContributionRow[]>(),
    ]);

  // Cartes comparatives : dernières 2 années présentes pour chaque clé de groupe.
  const byKey = new Map<string, KeyFigureRow[]>();
  for (const f of figures ?? []) {
    if (!byKey.has(f.key)) byKey.set(f.key, []);
    byKey.get(f.key)!.push(f);
  }

  const cardKeysByGroup = new Map<string, string[]>();
  for (const [key, rows] of byKey) {
    const groupId = rows[0]?.group_id;
    if (!groupId) continue;
    if (!cardKeysByGroup.has(groupId)) cardKeysByGroup.set(groupId, []);
    if (!cardKeysByGroup.get(groupId)!.includes(key)) cardKeysByGroup.get(groupId)!.push(key);
  }

  // Table plafond : uniquement 2025/2026, dans l'ordre réel du prototype.
  const ceilingByYear = new Map<string, Map<number, KeyFigureRow>>();
  for (const key of CEILING_TABLE_ORDER) {
    const rows = (byKey.get(key) ?? []).filter((r) => r.year === 2025 || r.year === 2026);
    ceilingByYear.set(key, new Map(rows.map((r) => [r.year, r])));
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-sm text-muted">Données de référence</p>
      <h1 className="mt-1 text-2xl font-semibold text-ink">
        {settings?.title ?? "Les chiffres de la paie"}
      </h1>
      {settings?.intro && <p className="mt-2 max-w-2xl text-sm text-muted">{settings.intro}</p>}

      {(groups ?? []).map((group) => {
        const keys = (cardKeysByGroup.get(group.id) ?? []).sort();
        if (keys.length === 0) return null;
        return (
          <div key={group.id} className="mt-8">
            <h2 className="text-lg font-semibold text-ink">
              {group.title}{" "}
              {group.sub && <span className="text-sm font-normal text-muted">{group.sub}</span>}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {keys.map((key) => {
                const rows = (byKey.get(key) ?? []).slice().sort((a, b) => b.year - a.year);
                const [latest, previous] = rows;
                if (!latest) return null;
                const variation =
                  previous && previous.value
                    ? Math.round(((latest.value - previous.value) / previous.value) * 1000) / 10
                    : null;
                return (
                  <Card key={key}>
                    <p className="text-sm text-ink">{keyFigureLabel(key)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {previous && (
                        <>
                          <div className="text-right">
                            <p className="text-xs text-muted">{previous.year}</p>
                            <p className="font-mono text-sm text-muted">
                              {previous.note ?? `${previous.value} ${previous.unit}`}
                            </p>
                          </div>
                          <span className="text-muted">→</span>
                        </>
                      )}
                      <div>
                        <p className="text-xs font-medium text-ink">{latest.year}</p>
                        <p className="font-mono text-base font-semibold text-ink">
                          {latest.note ?? `${latest.value} ${latest.unit}`}
                        </p>
                      </div>
                    </div>
                    {variation !== null && (
                      <p className="mt-1 text-xs font-medium text-success">
                        {variation >= 0 ? "▲" : "▼"} {variation >= 0 ? "+" : ""}
                        {variation} %
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      <h2 className="mt-10 text-lg font-semibold text-ink">
        {settings?.plafond_title ?? "Plafond Sécurité sociale — toutes périodicités"}
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full max-w-lg text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-2 font-medium text-muted">Périodicité</th>
              <th className="px-2 py-2 text-right font-medium text-muted">2025</th>
              <th className="px-2 py-2 text-right font-medium text-ink">2026</th>
            </tr>
          </thead>
          <tbody>
            {CEILING_TABLE_ORDER.map((key) => {
              const years = ceilingByYear.get(key);
              const v2025 = years?.get(2025);
              const v2026 = years?.get(2026);
              if (!v2025 && !v2026) return null;
              return (
                <tr key={key} className="border-b border-border">
                  <td className="py-1.5 pr-2 text-ink">{keyFigureLabel(key)}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-muted">
                    {v2025?.note ?? "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono font-medium text-ink">
                    {v2026?.note ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-ink">
        {settings?.cot_title ?? "Taux de cotisations"}
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-2 font-medium text-muted">Cotisation</th>
              <th className="px-2 py-2 font-medium text-muted">Assiette / base</th>
              <th className="px-2 py-2 text-right font-medium text-muted">Salariale</th>
              <th className="px-2 py-2 text-right font-medium text-muted">Patronale</th>
            </tr>
          </thead>
          <tbody>
            {(contributions ?? []).map((row) =>
              row.is_header ? (
                <tr key={row.id} className="bg-page-bg">
                  <td colSpan={4} className="py-1.5 pr-2 font-semibold text-ink">
                    {row.label}
                  </td>
                </tr>
              ) : (
                <tr key={row.id} className="border-b border-border">
                  <td className="py-1.5 pr-2 text-ink">{row.label}</td>
                  <td className="px-2 py-1.5 text-muted">{row.base}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-ink">{row.employee_rate}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-ink">{row.employer_rate}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {settings?.source && <p className="mt-6 text-xs italic text-muted">{settings.source}</p>}
    </main>
  );
}
