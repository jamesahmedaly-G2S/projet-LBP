"use client";

import { useActionState } from "react";
import { inviteClientUser } from "../../actions";
import { TextField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

// STU-CLIENT-01 (étape 8 — Accès client). Port de la sémantique réelle du
// prototype avec un vrai compte : `inviteUserByEmail` (service_role)
// envoie un vrai e-mail d'invitation (capturé par Inbucket en local).
export default function InviteClientForm({ companyId }: { companyId: string }) {
  const [error, formAction, pending] = useActionState(inviteClientUser, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="company_id" value={companyId} />
      <TextField label="Nom complet" name="full_name" required placeholder="Ex. Camille Dubois" />
      <TextField label="Email" name="email" type="email" required />
      {error && <p className="text-sm text-studio-red">{error}</p>}
      <Button type="submit" variant="primary" disabled={pending} className="w-fit">
        {pending ? "Envoi..." : "Envoyer l'invitation"}
      </Button>
    </form>
  );
}
