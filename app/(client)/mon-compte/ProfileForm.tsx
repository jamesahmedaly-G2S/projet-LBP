"use client";

import { useActionState } from "react";
import { updateMyProfile } from "./actions";
import { TextField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

export default function ProfileForm({
  jobTitle,
  department,
  phone,
}: {
  jobTitle: string | null;
  department: string | null;
  phone: string | null;
}) {
  const [message, formAction, pending] = useActionState(updateMyProfile, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <TextField label="Poste" name="job_title" defaultValue={jobTitle ?? ""} />
      <TextField label="Service / équipe" name="department" defaultValue={department ?? ""} />
      <TextField label="Téléphone professionnel" name="phone" defaultValue={phone ?? ""} />
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "..." : "Enregistrer mes informations"}
        </Button>
        {message && (
          <p className={`text-xs ${message === "Enregistré." ? "text-success" : "text-danger"}`}>
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
