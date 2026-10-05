"use client";

import { useActionState, useState } from "react";
import { changeMyPassword } from "./actions";
import { TextField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

export default function PasswordForm() {
  const [open, setOpen] = useState(false);
  const [message, formAction, pending] = useActionState(changeMyPassword, null);

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Modifier le mot de passe
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <TextField
        label="Nouveau mot de passe"
        name="password"
        type="password"
        required
        minLength={8}
      />
      <TextField
        label="Confirmer le mot de passe"
        name="confirm"
        type="password"
        required
        minLength={8}
      />
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "..." : "Confirmer"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
      </div>
      {message && (
        <p
          className={`text-xs ${message === "Mot de passe modifié." ? "text-success" : "text-danger"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
