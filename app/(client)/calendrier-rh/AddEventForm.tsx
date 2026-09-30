"use client";

import { useActionState } from "react";
import { addOwnEvent } from "./actions";
import { TextField, TextAreaField, SelectField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";
import {
  CALENDAR_THEMES,
  PERSONAL_REMINDER_THEME,
  EVENT_TYPE_LABEL,
  EVENT_SCOPE_LABEL,
  PRIORITY_LABEL,
  type CalendarEventType,
  type CalendarEventScope,
} from "@/lib/client/calendar-taxonomy";

const ADDABLE_TYPES: CalendarEventType[] = ["mandatory", "advisory", "news"];
// "national" volontairement exclu -- réservé à l'administration G2S,
// jamais proposé côté client (contrairement au prototype, qui l'exposait
// sans contrôle réel derrière).
const ADDABLE_SCOPES: CalendarEventScope[] = ["personal", "company"];

export default function AddEventForm({ defaultDate }: { defaultDate: string }) {
  const [error, formAction, pending] = useActionState(addOwnEvent, null);

  return (
    <form
      action={formAction}
      className="mt-4 flex flex-col gap-2 rounded-md border border-border p-3"
    >
      <p className="text-sm font-semibold text-ink">Ajouter un événement</p>
      <TextField
        label="Intitulé"
        name="title"
        required
        placeholder="Ex. Entretien annuel — équipe RH"
      />
      <div className="flex flex-wrap gap-2">
        <TextField label="Date" name="event_date" type="date" defaultValue={defaultDate} required />
        <SelectField label="Portée" name="scope" defaultValue="personal" className="w-40">
          {ADDABLE_SCOPES.map((s) => (
            <option key={s} value={s}>
              {EVENT_SCOPE_LABEL[s]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Type" name="event_type" defaultValue="advisory" className="w-40">
          {ADDABLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABEL[t]}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="flex flex-wrap gap-2">
        <SelectField
          label="Thématique"
          name="category"
          defaultValue={PERSONAL_REMINDER_THEME}
          className="flex-1"
        >
          <option value={PERSONAL_REMINDER_THEME}>{PERSONAL_REMINDER_THEME}</option>
          {CALENDAR_THEMES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectField>
        <SelectField label="Priorité" name="priority" defaultValue="2" className="w-32">
          {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
      </div>
      <TextAreaField label="Notes (facultatif)" name="note" rows={2} />
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "..." : "Ajouter"}
        </Button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </form>
  );
}
