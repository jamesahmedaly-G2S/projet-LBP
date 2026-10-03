"use client";

import {
  CALENDAR_THEMES,
  EVENT_TYPE_LABEL,
  type CalendarEventType,
} from "@/lib/client/calendar-taxonomy";

// LBP-CLIENT-15 (correctif fidélité, 03/10/2026), suite à un retour de
// l'utilisateur ("compare bien mot pour mot et taille pour taille") :
// revérifié contre le vrai `renderCalFull()` (LBP_V9.9_Studio.html
// ~L3323-3328) et `.calf-bar` (~L930-932) -- les filtres réels sont
// "Thématiques" / "Type d'entreprise" (`CAL_TAX.ent`) / "Type
// d'événement" / "Format" (`CAL_TAX.format`), appliqués au changement
// (`onchange`), jamais de bouton "Filtrer". Il n'y a PAS de filtre
// "portée" dans le vrai marquage (`CAL_TAX` n'a aucune clé `scope`) --
// notre ancien filtre "Toutes les portées" était une invention, retiré.
// "Type d'entreprise" et "Format" restent non portés : `calendar_events`
// (schéma réel) n'a ni colonne taille d'entreprise ni colonne format --
// ajouter ces deux filtres demanderait un vrai changement de schéma, pas
// un ajustement de texte/taille (question posée à Pauline, voir le point
// d'avancement). Libellé placeholder réel du thème : "Thématiques" seul
// (pas "Toutes les thématiques", qui est le libellé du widget compact de
// l'Accueil -- un texte différent pour un écran différent).
export default function CalendarFiltersRh({
  action,
  year,
  month,
  theme,
  typeEv,
}: {
  action: string;
  year: number;
  month: number;
  theme: string | null;
  typeEv: CalendarEventType | null;
}) {
  const selectClass =
    "rounded-full border border-border bg-white px-[14px] py-2 text-[13px] text-ink";
  const submit = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();
  const active = Boolean(theme || typeEv);

  return (
    <form
      action={action}
      className="mb-4 flex flex-wrap items-center gap-2.5 rounded-[14px] bg-[#F5F0EC] px-4 py-3"
    >
      <input type="hidden" name="annee" value={year} />
      <input type="hidden" name="mois" value={month} />
      <span className="text-[12.5px] font-extrabold text-muted">Filtrer par :</span>
      <select name="theme" defaultValue={theme ?? ""} onChange={submit} className={selectClass}>
        <option value="">Thématiques</option>
        {CALENDAR_THEMES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select name="type" defaultValue={typeEv ?? ""} onChange={submit} className={selectClass}>
        <option value="">Type d&apos;événement</option>
        {(Object.keys(EVENT_TYPE_LABEL) as CalendarEventType[]).map((t) => (
          <option key={t} value={t}>
            {EVENT_TYPE_LABEL[t]}
          </option>
        ))}
      </select>
      {active && (
        <a
          href={`${action}?annee=${year}&mois=${month}`}
          className="rounded-full border border-primary px-[15px] py-[7px] text-[12px] font-semibold text-primary hover:bg-primary hover:text-white"
        >
          Réinitialiser
        </a>
      )}
    </form>
  );
}
