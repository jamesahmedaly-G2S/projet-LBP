"use client";

import { useActionState, useState } from "react";
import { saveEvent, deleteEvent } from "./actions";
import { TextField, TextAreaField, SelectField, CheckboxField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";
import { Badge } from "@/ui-kit/Badge";
import {
  CALENDAR_THEMES,
  EVENT_TYPE_LABEL,
  type CalendarEventType,
} from "@/lib/client/calendar-taxonomy";

export interface CalendarEventAdmin {
  id: string;
  event_date: string;
  title: string;
  category: string | null;
  event_type: CalendarEventType | null;
  note: string | null;
  published: boolean;
}

export default function CalendarEventsManager({ events }: { events: CalendarEventAdmin[] }) {
  const [editing, setEditing] = useState<CalendarEventAdmin | "new" | null>(null);

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-studio-line text-left text-xs text-studio-muted">
            <th className="py-1.5 pr-2">Date</th>
            <th className="px-2 py-1.5">Intitulé</th>
            <th className="px-2 py-1.5">Thématique</th>
            <th className="px-2 py-1.5">Type</th>
            <th className="px-2 py-1.5">Statut</th>
            <th className="px-2 py-1.5"></th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-b border-studio-line">
              <td className="py-1.5 pr-2 text-studio-muted">
                {new Date(`${e.event_date}T00:00:00`).toLocaleDateString("fr-FR")}
              </td>
              <td className="px-2 py-1.5 text-studio-navy">{e.title}</td>
              <td className="px-2 py-1.5 text-studio-muted">{e.category ?? "—"}</td>
              <td className="px-2 py-1.5 text-studio-muted">
                {e.event_type ? EVENT_TYPE_LABEL[e.event_type] : "—"}
              </td>
              <td className="px-2 py-1.5">
                <Badge tone={e.published ? "green" : "amber"}>
                  {e.published ? "Publié" : "Brouillon"}
                </Badge>
              </td>
              <td className="px-2 py-1.5 text-right">
                <button
                  type="button"
                  className="text-xs text-studio-blue hover:underline"
                  onClick={() => setEditing(e)}
                >
                  Modifier
                </button>
                <DeleteButton id={e.id} title={e.title} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing ? (
        <EventForm event={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={() => setEditing("new")}
        >
          + Nouvelle échéance
        </Button>
      )}
    </div>
  );
}

function DeleteButton({ id, title }: { id: string; title: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className="ml-2 text-xs text-studio-red hover:underline"
      disabled={pending}
      onClick={async () => {
        if (!confirm(`Supprimer « ${title} » ?`)) return;
        setPending(true);
        await deleteEvent(id);
        setPending(false);
      }}
    >
      Supprimer
    </button>
  );
}

function EventForm({ event, onDone }: { event: CalendarEventAdmin | null; onDone: () => void }) {
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const result = await saveEvent(prev, fd);
    if (!result) onDone();
    return result;
  }, null);

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2 rounded-md border border-studio-line p-3"
    >
      {event && <input type="hidden" name="id" value={event.id} />}

      <div className="flex flex-wrap gap-2">
        <TextField
          label="Intitulé"
          name="title"
          defaultValue={event?.title ?? ""}
          required
          className="flex-1"
        />
        <TextField
          label="Date"
          name="event_date"
          type="date"
          defaultValue={event?.event_date ?? ""}
          required
          className="w-40"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <SelectField
          label="Thématique"
          name="category"
          defaultValue={event?.category ?? ""}
          className="flex-1"
        >
          <option value="">— Aucune —</option>
          {CALENDAR_THEMES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Type"
          name="event_type"
          defaultValue={event?.event_type ?? "advisory"}
          className="w-40"
        >
          {(Object.keys(EVENT_TYPE_LABEL) as CalendarEventType[]).map((t) => (
            <option key={t} value={t}>
              {EVENT_TYPE_LABEL[t]}
            </option>
          ))}
        </SelectField>
      </div>

      <TextAreaField
        label="Description (facultatif)"
        name="note"
        defaultValue={event?.note ?? ""}
        rows={2}
      />

      <CheckboxField
        label="Publié (visible côté client) — sinon, brouillon visible uniquement ici"
        name="published"
        defaultChecked={event?.published ?? false}
      />

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "..." : "Enregistrer"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
      {error && <p className="text-xs text-studio-red">{error}</p>}
    </form>
  );
}
