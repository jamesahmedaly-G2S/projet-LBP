"use client";

import {
  CALENDAR_THEMES,
  EVENT_TYPE_LABEL,
  EVENT_SCOPE_LABEL,
  type CalendarEventType,
  type CalendarEventScope,
} from "@/lib/client/calendar-taxonomy";

// LBP-CLIENT-01 (correctif fidélité, 01/10/2026) : porté depuis les
// `<select onchange='calF.x=this.value;renderCalendar()'>` du vrai widget
// (renderCalendar(), LBP_V9.9_Studio.html ~L3376-3381) -- les filtres
// s'appliquent au changement, sans bouton "Filtrer" (absent du vrai
// marquage). Nécessite un Client Component pour `onChange` ; le reste du
// widget (données, grille) reste un Server Component.
export default function CalendarFilters({
  action,
  year,
  month,
  theme,
  typeEv,
  scope,
}: {
  action: string;
  year: number;
  month: number;
  theme: string | null;
  typeEv: CalendarEventType | null;
  scope: CalendarEventScope | null;
}) {
  const selectClass =
    "min-w-0 flex-1 rounded-lg border border-border bg-white px-[9px] py-[7px] text-[11.5px] font-semibold text-ink";
  const submit = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();

  return (
    <form action={action} className="mt-3 flex flex-col gap-1.5">
      <input type="hidden" name="cal_annee" value={year} />
      <input type="hidden" name="cal_mois" value={month} />
      <p className="text-[11px] font-extrabold tracking-[0.04em] text-muted uppercase">
        Filtrer par
      </p>
      <div className="flex flex-wrap gap-1.5">
        <select
          name="cal_theme"
          defaultValue={theme ?? ""}
          onChange={submit}
          className={selectClass}
        >
          <option value="">Toutes les thématiques</option>
          {CALENDAR_THEMES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          name="cal_type"
          defaultValue={typeEv ?? ""}
          onChange={submit}
          className={selectClass}
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
          onChange={submit}
          className={selectClass}
        >
          <option value="">Portée</option>
          {(Object.keys(EVENT_SCOPE_LABEL) as CalendarEventScope[]).map((s) => (
            <option key={s} value={s}>
              {EVENT_SCOPE_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
