import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { pad2, monthWeeks } from "@/lib/client/month-grid";
import {
  CALENDAR_THEMES,
  EVENT_TYPE_LABEL,
  EVENT_SCOPE_LABEL,
  TYPE_DOT_CLASS,
  type CalendarEventType,
  type CalendarEventScope,
} from "@/lib/client/calendar-taxonomy";

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
    <div id="calendrier" className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <Link
          href={buildHref({ year: prevMonth.year, month: prevMonth.month })}
          className="px-1 text-muted hover:text-primary"
        >
          ‹
        </Link>
        <p className="text-[13.5px] font-bold text-ink">
          {MONTH_NAMES[month - 1]} {year}
        </p>
        <Link
          href={buildHref({ year: nextMonth.year, month: nextMonth.month })}
          className="px-1 text-muted hover:text-primary"
        >
          ›
        </Link>
      </div>

      <form action={`${linkPrefix}/accueil`} className="mt-3 flex flex-col gap-1.5">
        <input type="hidden" name="cal_annee" value={year} />
        <input type="hidden" name="cal_mois" value={month} />
        <select
          name="cal_theme"
          defaultValue={theme ?? ""}
          className="rounded-md border border-border px-2 py-1 text-[11.5px] text-ink"
        >
          <option value="">Toutes les thématiques</option>
          {CALENDAR_THEMES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          <select
            name="cal_type"
            defaultValue={typeEv ?? ""}
            className="flex-1 rounded-md border border-border px-2 py-1 text-[11.5px] text-ink"
          >
            <option value="">Type d&apos;événement</option>
            {(Object.keys(EVENT_TYPE_LABEL) as CalendarEventType[]).map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <select
            name="cal_portee"
            defaultValue={scope ?? ""}
            className="flex-1 rounded-md border border-border px-2 py-1 text-[11.5px] text-ink"
          >
            <option value="">Portée</option>
            {(Object.keys(EVENT_SCOPE_LABEL) as CalendarEventScope[]).map((s) => (
              <option key={s} value={s}>
                {EVENT_SCOPE_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-full bg-primary py-1 text-[11.5px] font-semibold text-white hover:bg-primary-hover"
        >
          Filtrer
        </button>
      </form>

      <div className="mt-3 grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-muted">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {weeks.flatMap((week, wi) =>
          week.map((d, di) => {
            if (d === null) return <div key={`${wi}-${di}`} />;
            const ds = `${year}-${pad2(month)}-${pad2(d)}`;
            const dEvents = byDate.get(ds) ?? [];
            const isToday = ds === todayStr;
            return (
              <Link
                key={ds}
                href={`${linkPrefix}/calendrier-rh?annee=${year}&mois=${month}&jour=${ds}`}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded text-[11px] hover:bg-primary-soft ${
                  isToday ? "bg-primary-soft font-bold text-primary" : "text-ink"
                }`}
              >
                {d}
                {dEvents.length > 0 && (
                  <span className="flex gap-[1.5px]">
                    {dEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className={`h-1 w-1 rounded-full ${e.event_type ? TYPE_DOT_CLASS[e.event_type] : "bg-muted"}`}
                      />
                    ))}
                  </span>
                )}
              </Link>
            );
          }),
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] text-muted">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" /> Obligatoire
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Conseil
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Actualité
        </span>
      </div>

      <Link
        href={`${linkPrefix}/calendrier-rh`}
        className="mt-3 block rounded-full border border-border py-1.5 text-center text-[11.5px] font-semibold text-ink hover:border-primary"
      >
        📅 Ouvrir le calendrier RH complet →
      </Link>
    </div>
  );
}
