import { createClient } from "@/lib/supabase/server";
import {
  keyFigureLabel,
  CEILING_TABLE_ORDER,
  CARD_KEY_ORDER,
} from "@/lib/client/key-figure-labels";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";

interface KeyFigureRow {
  key: string;
  year: number;
  value: number;
  unit: string;
  note: string | null;
  label: string | null;
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

// LBP-CLIENT-05 : "Chiffres Paie" [§1.6, p.11] -- contenu sans dépendance
// de session (aucune donnée propre à une société ou un utilisateur),
// extrait pour être consommé à la fois par la vraie page client
// (app/(client)/chiffres-paie/page.tsx, requireClient()) et par la
// prévisualisation admin (app/(studio)/clients/[id]/vue-client/chiffres-paie,
// requireAdmin()) sans dupliquer la logique.
//
// Correctif fidélité (03/10/2026), suite à un retour de l'utilisateur
// ("compare bien mot pour mot et taille pour taille") : revérifié contre
// `renderChiffres()`/`var CHIFFRES` (LBP_V9.9_Studio.html ~L4440-4505) et
// son CSS (`.cmp-*`/`.cc-*`, ~L439-468) --
// - Le tri alphabétique des cartes dans un groupe inversait "Plafond
//   mensuel (PMSS)"/"Plafond annuel (PASS)" et mettait "Autres repères"
//   dans le désordre -- remplacé par l'ordre réel (`CARD_KEY_ORDER`).
// - Libellés "Plafond mensuel SS (PMSS)"/"Plafond annuel SS (PASS)"
//   avaient un "SS" en trop (corrigé dans key-figure-labels.ts).
// - Titre de groupe (`.cmp-gtitle` : 13px, 800, MAJUSCULES, letter-
//   spacing .06em) et carte (`.cmp-card`/`.cc-*`) recalés sur les vraies
//   valeurs -- pas le `<Card>` générique (padding uniforme 24px, pas
//   16px/18px) ni un `text-lg font-semibold` générique pour le titre.
export default async function ChiffresPaieContent() {
  const supabase = await createClient();

  const [{ data: settings }, { data: groups }, { data: figures }, { data: contributions }] =
    await Promise.all([
      supabase.from("payroll_reference_settings").select("*").eq("id", 1).single(),
      supabase.from("key_figure_groups").select("*").order("display_order").returns<GroupRow[]>(),
      supabase
        .from("key_figures")
        .select("key, year, value, unit, note, label, group_id")
        .or("show_as_card.eq.true,show_in_ceiling_table.eq.true")
        .order("year", { ascending: false })
        .returns<KeyFigureRow[]>(),
      supabase
        .from("contribution_rates")
        .select("*")
        .order("display_order")
        .returns<ContributionRow[]>(),
    ]);

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

  const ceilingByYear = new Map<string, Map<number, KeyFigureRow>>();
  for (const key of CEILING_TABLE_ORDER) {
    const rows = (byKey.get(key) ?? []).filter((r) => r.year === 2025 || r.year === 2026);
    ceilingByYear.set(key, new Map(rows.map((r) => [r.year, r])));
  }

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>Données de référence</Eyebrow>
      <SectionTitle>{settings?.title ?? "Les chiffres de la paie"}</SectionTitle>
      {settings?.intro && <p className="mt-2 max-w-[700px] text-sm text-muted">{settings.intro}</p>}

      <div className="mt-8 flex flex-col gap-[22px]">
        {(groups ?? []).map((group) => {
          const keys = (cardKeysByGroup.get(group.id) ?? []).sort(
            (a, b) => CARD_KEY_ORDER.indexOf(a) - CARD_KEY_ORDER.indexOf(b),
          );
          if (keys.length === 0) return null;
          return (
            <div key={group.id}>
              <h2 className="mb-3 text-[13px] font-extrabold tracking-[0.06em] text-ink uppercase">
                {group.title}{" "}
                {group.sub && (
                  <span className="text-[11px] font-normal tracking-normal text-muted normal-case">
                    {group.sub}
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
                {keys.map((key) => {
                  const rows = (byKey.get(key) ?? []).slice().sort((a, b) => b.year - a.year);
                  const [latest, previous] = rows;
                  if (!latest) return null;
                  const variation =
                    previous && previous.value
                      ? Math.round(((latest.value - previous.value) / previous.value) * 1000) / 10
                      : null;
                  return (
                    <div
                      key={key}
                      className="rounded-[18px] border border-border bg-surface px-[18px] py-4 shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]"
                    >
                      <p className="mb-2.5 text-[12.5px] font-bold text-muted">
                        {keyFigureLabel(key, latest.label)}
                      </p>
                      <div className="mb-2.5 flex items-center gap-2.5">
                        {previous && (
                          <>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9.5px] font-extrabold tracking-[0.06em] text-muted uppercase">
                                {previous.year}
                              </span>
                              <span className="font-mono text-sm text-muted line-through">
                                {previous.note ?? `${previous.value} ${previous.unit}`}
                              </span>
                            </div>
                            <span className="text-muted">→</span>
                          </>
                        )}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9.5px] font-extrabold tracking-[0.06em] text-muted uppercase">
                            {latest.year}
                          </span>
                          <span className="font-mono text-2xl font-extrabold text-ink">
                            {latest.note ?? `${latest.value} ${latest.unit}`}
                          </span>
                        </div>
                      </div>
                      {variation !== null && (
                        <span className="inline-block rounded-full bg-primary/[0.14] px-2.5 py-[3px] text-[11.5px] font-extrabold text-success">
                          {variation >= 0 ? "▲" : "▼"} {variation >= 0 ? "+" : ""}
                          {variation} %
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mt-[26px] text-[13px] font-extrabold tracking-[0.06em] text-ink uppercase">
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
                  <td className="py-1.5 pr-2 text-ink">
                    {keyFigureLabel(key, v2026?.label ?? v2025?.label)}
                  </td>
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

      <h2 className="mt-[26px] text-[13px] font-extrabold tracking-[0.06em] text-ink uppercase">
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
