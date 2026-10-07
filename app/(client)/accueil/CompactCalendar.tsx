import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { pad2, monthWeeks } from "@/lib/client/month-grid";
import type { CalendarEventType, CalendarEventScope } from "@/lib/client/calendar-taxonomy";
import CalendarFilters from "./CalendarFilters";

// LBP-CLIENT-01 (finitions fidélité, 01/10/2026) : widget calendrier
// compact de l'Accueil -- manquait entièrement, signalé par l'utilisateur
// après vérification directe de la V9.9. Porté depuis renderCalendar()
// (LBP_V9.9_Studio.html, lignes ~3361-3388, remplit #calHost dans
// .dash-top) : mini-grille du mois, filtres thème/type/portée, légende,
// clic sur un jour. Réutilise les mêmes données que /calendrier-rh
// (calendar_events, LBP-CLIENT-15) -- jamais une deuxième source.
//
// Différence assumée : le vrai widget ouvre un modal JS (`openDay()`) au
// clic sur un jour, pour voir/ajouter l'événement sans quitter l'Accueil.
// Notre architecture est server-rendered (searchParams, pas de modal
// global) -- un clic sur un jour navigue directement vers la vraie page
// /calendrier-rh (déjà construite, détail + ajout), plutôt que dupliquer
// cette logique ici.
//
// Correctif (01/10/2026), suite à un retour direct de l'utilisateur
// ("le design du calendrier toujours pas fidèle") : la première version
// réinventait la mise en forme (cellules carrées, filtres empilés avec
// bouton "Filtrer", pas de libellé "Filtrer par", pas de texte d'aide, pas
// de distinction visuelle "jour avec événement", conteneur sans ombre).
// Reporté ligne à ligne contre le vrai CSS (`.dh-cal`/`.cal-*`, feuille de
// style ~L608-631 et ~L661-673 -- ces règles arrivent APRÈS celles
// ~L549-569 dans le fichier et les emportent en cascade, à spécificité
// égale) :
// - `.dh-cal{border-radius:18px;box-shadow:var(--shadow-sm)}` puis
//   `.dh-cal{padding:18px 20px}` (règle plus tardive, ne change QUE le
//   padding) -- jamais un `rounded-2xl p-4` deviné.
// - `.cal-nav{background:var(--panel);border-radius:8px;width/height:26px}`
//   -- de vrais boutons carrés, pas juste du texte `‹ ›` sans fond.
// - `.cal-cell{padding:9px 0 15px;border-radius:9px}` + points positionnés
//   en absolu en bas (`.cal-dots{position:absolute;bottom:4px}`) -- pas des
//   cellules carrées (`aspect-square`) avec contenu centré en colonne.
// - `.cal-cell.hasev{background:#FAF9F7;font-weight:700}` (jour avec
//   événement, distinct de "aujourd'hui") et `.cal-cell.today{background:
//   var(--sage-deep)}` -- `--sage-deep` vaut en réalité `#445068` (le nom
//   de variable date d'une itération "vert sauge" antérieure à la charte
//   G2S, jamais renommé), exactement notre `--color-ink` (carbone) --
//   jamais `primary-soft`/`text-primary` (framboise) deviné.
// - `.cal-flabel`/`.cal-hint` (libellé "Filtrer par" et texte d'aide sous
//   la grille) absents de notre version -- ajoutés.
// - Les filtres s'appliquent au changement (`onchange='...;renderCalendar()'`),
//   aucun bouton "Filtrer" dans le vrai marquage -- extrait dans
//   `CalendarFilters.tsx` (Client Component, `requestSubmit()` au
//   `onChange`) pour porter ce comportement sans rendre tout le widget
//   client.
const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

// Couleurs réelles des types d'événement du prototype (`EVCOL`,
// LBP_V9.9_Studio.html ~L2915) : point + liseré intérieur 2px de la
// cellule, couleur du type prioritaire (Obligatoire > Conseil > Actualité).
const EV_COLOR: Record<CalendarEventType, string> = {
  mandatory: "#E48AAA",
  advisory: "#E8C24A",
  news: "#A98BD6",
};
const EV_PRIORITY: CalendarEventType[] = ["mandatory", "advisory", "news"];

interface CalendarEventRow {
  id: string;
  event_date: string;
  event_type: CalendarEventType | null;
}

export default async function CompactCalendar({
  year,
  month,
  theme,
  typeEv,
  scope,
  linkPrefix = "",
}: {
  year: number;
  month: number;
  theme: string | null;
  typeEv: CalendarEventType | null;
  scope: CalendarEventScope | null;
  linkPrefix?: string;
}) {
  const supabase = await createClient();

  const monthStart = `${year}-${pad2(month)}-01`;
  const monthEndExclusive = month === 12 ? `${year + 1}-01-01` : `${year}-${pad2(month + 1)}-01`;

  let query = supabase
    .from("calendar_events")
    .select("id, event_date, event_type")
    .gte("event_date", monthStart)
    .lt("event_date", monthEndExclusive)
    .order("event_date");

  if (theme) query = query.eq("category", theme);
  if (typeEv) query = query.eq("event_type", typeEv);
  if (scope) query = query.eq("scope", scope);

  const { data: events } = await query.returns<CalendarEventRow[]>();
  const byDate = new Map<string, CalendarEventRow[]>();
  for (const e of events ?? []) {
    if (!byDate.has(e.event_date)) byDate.set(e.event_date, []);
    byDate.get(e.event_date)!.push(e);
  }

  const weeks = monthWeeks(year, month);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  const buildHref = (params: {
    year?: number;
    month?: number;
    theme?: string | null;
    typeEv?: string | null;
    scope?: string | null;
  }) => {
    const sp = new URLSearchParams();
    const finalYear = params.year ?? year;
    const finalMonth = params.month ?? month;
    const finalTheme = params.theme !== undefined ? params.theme : theme;
    const finalType = params.typeEv !== undefined ? params.typeEv : typeEv;
    const finalScope = params.scope !== undefined ? params.scope : scope;
    sp.set("cal_annee", String(finalYear));
    sp.set("cal_mois", String(finalMonth));
    if (finalTheme) sp.set("cal_theme", finalTheme);
    if (finalType) sp.set("cal_type", finalType);
    if (finalScope) sp.set("cal_portee", finalScope);
    return `${linkPrefix}/accueil?${sp.toString()}#calendrier`;
  };

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return (
    <div
      id="calendrier"
      className="rounded-2xl border border-border bg-white/[.62] px-5 py-[18px] shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]"
    >
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={buildHref({ year: prevMonth.year, month: prevMonth.month })}
          className="grid h-[26px] w-[26px] place-items-center rounded-lg bg-[#F5F0EC] text-[15px] text-ink hover:bg-[#EFE7E1]"
        >
          ‹
        </Link>
        <p className="mb-2.5 text-[15px] leading-[1.5] font-extrabold text-ink capitalize">
          {MONTH_NAMES[month - 1]} {year}
        </p>
        <Link
          href={buildHref({ year: nextMonth.year, month: nextMonth.month })}
          className="grid h-[26px] w-[26px] place-items-center rounded-lg bg-[#F5F0EC] text-[15px] text-ink hover:bg-[#EFE7E1]"
        >
          ›
        </Link>
      </div>

      <CalendarFilters
        action={`${linkPrefix}/accueil`}
        year={year}
        month={month}
        theme={theme}
        typeEv={typeEv}
        scope={scope}
      />

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((w, i) => (
          <div
            key={i}
            className="py-[3px] text-center text-[11px] leading-[1.5] font-extrabold text-muted"
          >
            {w}
          </div>
        ))}
        {weeks.flatMap((week, wi) =>
          week.map((d, di) => {
            if (d === null) return <div key={`${wi}-${di}`} />;
            const ds = `${year}-${pad2(month)}-${pad2(d)}`;
            const dEvents = byDate.get(ds) ?? [];
            const isToday = ds === todayStr;
            const hasEvents = dEvents.length > 0;
            const types = EV_PRIORITY.filter((t) => dEvents.some((e) => e.event_type === t));
            const ring = hasEvents ? (EV_COLOR[types[0]] ?? "#ccc") : null;
            return (
              <Link
                key={ds}
                href={`${linkPrefix}/calendrier-rh?annee=${year}&mois=${month}&jour=${ds}`}
                style={ring && !isToday ? { boxShadow: `inset 0 0 0 2px ${ring}` } : undefined}
                className={`relative rounded-[9px] pt-[9px] pb-[15px] text-center text-[13.5px] leading-[1.5] hover:bg-[#F5F0EC] ${
                  isToday
                    ? "bg-ink font-extrabold text-white"
                    : hasEvents
                      ? "bg-[#FAF9F7] font-bold text-ink"
                      : "text-ink"
                }`}
              >
                {d}
                {hasEvents && (
                  <span className="absolute right-0 bottom-1 left-0 flex justify-center gap-0.5">
                    {(types.length ? types : [null]).map((t, i) => (
                      <span
                        key={i}
                        className="h-[7px] w-[7px] rounded-full"
                        style={{ background: t ? EV_COLOR[t] : "#ccc" }}
                      />
                    ))}
                  </span>
                )}
              </Link>
            );
          }),
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs leading-[1.5] text-muted">
        {(
          [
            ["mandatory", "Obligatoire"],
            ["advisory", "Conseil"],
            ["news", "Actualité"],
          ] as const
        ).map(([t, label]) => (
          <span key={t} className="flex items-center gap-1">
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: EV_COLOR[t] }} />{" "}
            {label}
          </span>
        ))}
      </div>

      <p className="mt-[10px] text-[11.5px] leading-[1.5] text-muted italic">
        Cliquez sur un jour pour consulter ou ajouter un événement.
      </p>

      <Link
        href={`${linkPrefix}/calendrier-rh`}
        className="mt-2 flex items-center justify-center gap-[7px] rounded-lg border border-primary bg-white px-[11px] py-[5px] text-xs font-bold text-primary hover:bg-primary hover:text-white"
      >
        📅 Ouvrir le calendrier RH complet →
      </Link>
    </div>
  );
}
