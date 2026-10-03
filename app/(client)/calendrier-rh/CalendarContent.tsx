import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";
import AddEventForm from "./AddEventForm";
import DeleteEventButton from "./DeleteEventButton";
import { pad2, monthWeeks } from "@/lib/client/month-grid";
import {
  CALENDAR_THEMES,
  EVENT_TYPE_LABEL,
  EVENT_SCOPE_LABEL,
  PRIORITY_LABEL,
  TYPE_BADGE_TONE,
  TYPE_DOT_CLASS,
  type CalendarEventType,
  type CalendarEventScope,
} from "@/lib/client/calendar-taxonomy";

// LBP-CLIENT-15 : "Calendrier RH" [onglet réel repéré en auditant
// LBP_V9.9_Studio.html, absent du cahier écrit -- voir tickets/LBP-CLIENT.md].
// Portée volontairement réduite au minimum demandé : des évènements à date
// concrète (calendar_events, schéma réel de James), jamais un calcul de
// récurrence -- le vrai moteur (calendar_rules, 5 types de règles dont
// Pâques par l'algorithme de Meeus) est explicitement hors phase 1
// (docs/ARCHITECTURE.md §7.1), laissé intact et non consommé ici.
//
// Couleurs par type, taxonomie, pad2/monthWeeks : voir
// lib/client/calendar-taxonomy.ts et lib/client/month-grid.ts, partagés
// avec CompactCalendar.tsx (widget compact de l'Accueil, LBP-CLIENT-01).

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
const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface CalendarEventRow {
  id: string;
  scope: CalendarEventScope;
  event_date: string;
  title: string;
  category: string | null;
  event_type: CalendarEventType | null;
  priority: number | null;
  note: string | null;
  company_id: string | null;
  profile_id: string | null;
}

export default async function CalendarContent({
  year,
  month,
  day,
  theme,
  typeEv,
  scope,
  companyId,
  userId,
  linkPrefix = "",
}: {
  year: number;
  month: number;
  day: string | null;
  theme: string | null;
  typeEv: CalendarEventType | null;
  scope: CalendarEventScope | null;
  companyId: string | null;
  userId: string;
  linkPrefix?: string;
}) {
  const supabase = await createClient();

  const monthStart = `${year}-${pad2(month)}-01`;
  const monthEndExclusive = month === 12 ? `${year + 1}-01-01` : `${year}-${pad2(month + 1)}-01`;

  let query = supabase
    .from("calendar_events")
    .select(
      "id, scope, event_date, title, category, event_type, priority, note, company_id, profile_id",
    )
    .gte("event_date", monthStart)
    .lt("event_date", monthEndExclusive)
    .order("event_date");

  if (theme) query = query.eq("category", theme);
  if (typeEv) query = query.eq("event_type", typeEv);
  if (scope) query = query.eq("scope", scope);

  const { data: events } = await query.returns<CalendarEventRow[]>();
  const all = events ?? [];

  const byDate = new Map<string, CalendarEventRow[]>();
  for (const e of all) {
    if (!byDate.has(e.event_date)) byDate.set(e.event_date, []);
    byDate.get(e.event_date)!.push(e);
  }

  const weeks = monthWeeks(year, month);

  const buildHref = (params: {
    year?: number;
    month?: number;
    day?: string | null;
    theme?: string | null;
    typeEv?: string | null;
    scope?: string | null;
  }) => {
    const sp = new URLSearchParams();
    const finalYear = params.year ?? year;
    const finalMonth = params.month ?? month;
    const finalDay = params.day !== undefined ? params.day : day;
    const finalTheme = params.theme !== undefined ? params.theme : theme;
    const finalType = params.typeEv !== undefined ? params.typeEv : typeEv;
    const finalScope = params.scope !== undefined ? params.scope : scope;
    sp.set("annee", String(finalYear));
    sp.set("mois", String(finalMonth));
    if (finalDay) sp.set("jour", finalDay);
    if (finalTheme) sp.set("theme", finalTheme);
    if (finalType) sp.set("type", finalType);
    if (finalScope) sp.set("portee", finalScope);
    return `${linkPrefix}/calendrier-rh?${sp.toString()}`;
  };

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  const dayEvents = day ? (byDate.get(day) ?? []) : [];
  const dayLabel = day
    ? new Date(`${day}T00:00:00`).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>Votre année RH</Eyebrow>
      <SectionTitle>Calendrier RH</SectionTitle>
      <p className="-mt-3 text-sm text-muted">
        Obligations de paie, temps forts nationaux et actions RH à anticiper — cliquez un jour pour
        le détail ou pour ajouter votre propre échéance.
      </p>

      <form className="mt-4 flex flex-wrap gap-2" action={`${linkPrefix}/calendrier-rh`}>
        <input type="hidden" name="annee" value={year} />
        <input type="hidden" name="mois" value={month} />
        <select
          name="theme"
          defaultValue={theme ?? ""}
          className="rounded-md border border-border px-3 py-2 text-sm text-ink"
        >
          <option value="">Toutes les thématiques</option>
          {CALENDAR_THEMES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={typeEv ?? ""}
          className="rounded-md border border-border px-3 py-2 text-sm text-ink"
        >
          <option value="">Tous les types</option>
          {(Object.keys(EVENT_TYPE_LABEL) as CalendarEventType[]).map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <select
          name="portee"
          defaultValue={scope ?? ""}
          className="rounded-md border border-border px-3 py-2 text-sm text-ink"
        >
          <option value="">Toutes les portées</option>
          {(Object.keys(EVENT_SCOPE_LABEL) as CalendarEventScope[]).map((s) => (
            <option key={s} value={s}>
              {EVENT_SCOPE_LABEL[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Filtrer
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between">
        <Link
          href={buildHref({ year: prevMonth.year, month: prevMonth.month, day: null })}
          className="text-sm text-primary hover:underline"
        >
          ← Mois précédent
        </Link>
        <p className="text-lg font-semibold text-ink">
          {MONTH_NAMES[month - 1]} {year}
        </p>
        <Link
          href={buildHref({ year: nextMonth.year, month: nextMonth.month, day: null })}
          className="text-sm text-primary hover:underline"
        >
          Mois suivant →
        </Link>
      </div>

      <Card className="mt-3">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {weeks.flatMap((week, wi) =>
            week.map((d, di) => {
              if (d === null) return <div key={`${wi}-${di}`} />;
              const ds = `${year}-${pad2(month)}-${pad2(d)}`;
              const dEvents = byDate.get(ds) ?? [];
              const isSelected = ds === day;
              const isToday = ds === todayStr;
              return (
                <Link
                  key={ds}
                  href={buildHref({ day: ds })}
                  className={`flex min-h-16 flex-col items-center gap-1 rounded-md border p-1 text-xs hover:border-primary ${
                    isSelected ? "border-primary bg-primary-soft" : "border-border"
                  }`}
                >
                  <span className={`font-medium ${isToday ? "text-primary" : "text-ink"}`}>
                    {d}
                  </span>
                  {dEvents.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-0.5">
                      {dEvents.slice(0, 4).map((e) => (
                        <span
                          key={e.id}
                          className={`h-1.5 w-1.5 rounded-full ${
                            e.event_type ? TYPE_DOT_CLASS[e.event_type] : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </Link>
              );
            }),
          )}
        </div>
      </Card>

      {day && (
        <Card className="mt-4">
          <p className="text-sm font-semibold capitalize text-ink">{dayLabel}</p>
          {dayEvents.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Aucune échéance ce jour.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {dayEvents.map((e) => {
                const canDelete =
                  (e.scope === "personal" && e.profile_id === userId) ||
                  (e.scope === "company" && e.company_id === companyId);
                return (
                  <li
                    key={e.id}
                    className="flex items-start justify-between gap-2 border-b border-border pb-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {e.event_type && (
                          <Badge tone={TYPE_BADGE_TONE[e.event_type]}>
                            {EVENT_TYPE_LABEL[e.event_type]}
                          </Badge>
                        )}
                        <Badge tone="neutral">{EVENT_SCOPE_LABEL[e.scope]}</Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium text-ink">{e.title}</p>
                      <p className="text-xs text-muted">
                        {e.category}
                        {e.priority && ` · priorité ${PRIORITY_LABEL[e.priority] ?? e.priority}`}
                      </p>
                      {e.note && <p className="mt-1 text-xs text-muted">{e.note}</p>}
                    </div>
                    {canDelete && <DeleteEventButton id={e.id} title={e.title} />}
                  </li>
                );
              })}
            </ul>
          )}

          <AddEventForm defaultDate={day} />
        </Card>
      )}
    </main>
  );
}
