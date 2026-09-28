"use client";

import { useActionState } from "react";
import { saveHelpSettings } from "./actions";
import { TextField, TextAreaField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

interface Settings {
  title: string;
  points: string[];
  video_title: string;
  video_text: string;
  video_url: string | null;
}

export default function HelpSettingsForm({ settings }: { settings: Settings }) {
  const [message, formAction, pending] = useActionState(saveHelpSettings, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <TextField label="Titre" name="title" defaultValue={settings.title} required />
      <TextAreaField
        label="Les 5 points clés (un par ligne)"
        name="points"
        defaultValue={settings.points.join("\n")}
        rows={6}
        required
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <TextField
          label="Titre du bloc vidéo"
          name="video_title"
          defaultValue={settings.video_title}
        />
        <TextField
          label="Texte du bloc vidéo"
          name="video_text"
          defaultValue={settings.video_text}
        />
      </div>
      <TextField
        label="URL de la vidéo (embed, optionnel)"
        name="video_url"
        defaultValue={settings.video_url ?? ""}
        placeholder="https://www.youtube.com/embed/…"
      />
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
