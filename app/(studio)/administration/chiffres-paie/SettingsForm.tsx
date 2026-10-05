"use client";

import { useActionState } from "react";
import { saveSettings } from "./actions";
import { TextField, TextAreaField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

interface Settings {
  title: string;
  intro: string;
  plafond_title: string;
  cot_title: string;
  source: string;
}

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [message, formAction, pending] = useActionState(saveSettings, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <TextField label="Titre de la page" name="title" defaultValue={settings.title} />
      <TextAreaField label="Introduction" name="intro" defaultValue={settings.intro} rows={2} />
      <div className="grid gap-2 sm:grid-cols-2">
        <TextField
          label="Titre du tableau plafond"
          name="plafond_title"
          defaultValue={settings.plafond_title}
        />
        <TextField
          label="Titre du tableau cotisations"
          name="cot_title"
          defaultValue={settings.cot_title}
        />
      </div>
      <TextAreaField label="Source" name="source" defaultValue={settings.source} rows={2} />
      <div className="flex items-center gap-2">
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "..." : "Enregistrer"}
        </Button>
        {message && (
          <p
            className={`text-xs ${message === "Enregistré." ? "text-studio-green" : "text-studio-red"}`}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
