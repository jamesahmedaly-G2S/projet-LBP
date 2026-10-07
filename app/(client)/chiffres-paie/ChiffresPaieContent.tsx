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
//
// Correctif fidélité (06/10/2026, mesures getComputedStyle sur la maquette) :
// la vraie carte (`renderChiffres()` alimenté par CHIFFRES_MASTER) n'affiche
// ni année au-dessus des valeurs (`oy`/`ny` vides) ni sous-titre de groupe
// (`sub:''`), et la valeur courante est `chiffreVal()` -- la valeur simple
// ("12,31 €"), jamais le détail intra-année de `note`. Chiffres en Archivo
// `tabular-nums` (`.mono`), jamais en police monospace. Tableaux dans un
// `.valo` (carte blanche radius 18, `overflow:hidden`) avec en-têtes
// `table.grid th` (fond #EAECEF, 11px 700 uppercase .04em).
const GTITLE =
  "mt-[26px] mb-3 text-[13px] leading-[19.5px] font-extrabold tracking-[0.06em] text-ink uppercase";
const VALO =
  "overflow-x-auto overflow-y-hidden rounded-[18px] border border-border bg-surface shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]";
const TH =
  "border-b border-border bg-[#eaecef] px-4 py-3 text-left text-[11px] leading-[16.5px] font-bold tracking-[0.04em] text-ink uppercase";
const TD_DECL = "border-b border-border px-4 py-3";
const TD_COT = "border-b border-border px-2.5 py-[7px] text-[12.5px] leading-[18.75px]";

function cardValue(row: KeyFigureRow): string {
  if (!row.note) return `${row.value} ${row.unit}`;
  const last = row.note.split(" · ").pop() ?? row.note;
  return last.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function formatVariation(v: number): string {
  return `${v >= 0 ? "▲ +" : "▼ "}${v.toFixed(1).replace(".", ",")} %`;
}

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
      {settings?.intro && (
        <p className="mb-5 max-w-[700px] text-[14px] leading-[21px] text-muted">{settings.intro}</p>
      )}

      <div className="flex flex-col gap-[22px]">
        {(groups ?? []).map((group) => {
          const keys = (cardKeysByGroup.get(group.id) ?? []).sort(
            (a, b) => CARD_KEY_ORDER.indexOf(a) - CARD_KEY_ORDER.indexOf(b),
          );
          if (keys.length === 0) return null;
          return (
            <div key={group.id}>
              <h2 className="mb-3 text-[13px] leading-[19.5px] font-extrabold tracking-[0.06em] text-ink uppercase">
                {group.title}
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
                      <p className="mb-2.5 text-[12.5px] leading-[18.75px] font-bold text-muted">
                        {keyFigureLabel(key, latest.label)}
                      </p>
                      <div className="mb-2.5 flex items-center gap-2.5">
                        {previous && (
                          <>
                            <span className="text-[14px] leading-[21px] text-muted tabular-nums line-through">
                              {cardValue(previous)}
                            </span>
                            <span className="text-[14px] leading-[21px] text-muted">→</span>
                          </>
                        )}
                        <span className="text-[24px] leading-[36px] font-extrabold text-ink tabular-nums">
                          {cardValue(latest)}
                        </span>
                      </div>
                      {variation !== null && (
                        <span className="inline-block rounded-full bg-primary/[0.14] px-2.5 py-[3px] text-[11.5px] leading-[17.25px] font-extrabold text-success">
                          {formatVariation(variation)}
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

      <h2 className={GTITLE}>
        {settings?.plafond_title ?? "Plafond Sécurité sociale — toutes périodicités"}
      </h2>
      <div className={VALO}>
        <table className="w-full border-collapse text-[13.5px] leading-[20.25px] text-ink">
          <thead>
            <tr>
              <th className={TH}>Périodicité</th>
              <th className={`${TH} text-right`}>2025</th>
              <th className={`${TH} text-right`}>2026</th>
            </tr>
          </thead>
          <tbody>
            {CEILING_TABLE_ORDER.map((key) => {
              const years = ceilingByYear.get(key);
              const v2025 = years?.get(2025);
              const v2026 = years?.get(2026);
              if (!v2025 && !v2026) return null;
              return (
                <tr key={key} className="hover:[&>td]:bg-[#f5f0ec]">
                  <td className={TD_DECL}>{keyFigureLabel(key, v2026?.label ?? v2025?.label)}</td>
                  <td className={`${TD_DECL} text-right tabular-nums`}>{v2025?.note ?? "—"}</td>
                  <td
                    className={`${TD_DECL} text-right text-[16px] leading-[24px] font-extrabold tabular-nums`}
                  >
                    {v2026?.note ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className={GTITLE}>{settings?.cot_title ?? "Taux de cotisations"}</h2>
      <div className={VALO}>
        <table className="w-full min-w-[560px] border-collapse text-[13.5px] leading-[20.25px] text-ink">
          <thead>
            <tr>
              <th className={TH}>Cotisation</th>
              <th className={TH}>Assiette / base</th>
              <th className={`${TH} text-right`}>Salariale</th>
              <th className={`${TH} text-right`}>Patronale</th>
            </tr>
          </thead>
          <tbody>
            {(contributions ?? []).map((row) =>
              row.is_header ? (
                <tr key={row.id}>
                  <td
                    colSpan={4}
                    className="border-b border-border bg-[#f5f0ec] px-2.5 py-[7px] text-[11px] leading-[16.5px] font-extrabold tracking-[0.05em] uppercase"
                  >
                    {row.label}
                  </td>
                </tr>
              ) : (
                <tr key={row.id} className="hover:[&>td]:bg-[#f5f0ec]">
                  <td className={TD_COT}>{row.label}</td>
                  <td className={`${TD_COT} text-muted`}>{row.base}</td>
                  <td className={`${TD_COT} text-right tabular-nums`}>{row.employee_rate}</td>
                  <td className={`${TD_COT} text-right tabular-nums`}>{row.employer_rate}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {settings?.source && (
        <p className="mt-[18px] bg-[#f5f0ec] px-4 py-3 text-[11.5px] leading-[17.25px] text-muted italic">
          {settings.source}
        </p>
      )}
    </main>
  );
}
