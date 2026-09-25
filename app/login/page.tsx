"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { Card } from "@/ui-kit/Card";
import { TextField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <Card className="w-full max-w-sm">
        <h1 className="mb-5 text-xl font-semibold text-zinc-900">Connexion</h1>

        <form action={formAction} className="flex flex-col gap-4">
          <TextField label="Email" type="email" name="email" required />
          <TextField label="Mot de passe" type="password" name="password" required />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" variant="primary" disabled={pending} className="mt-1">
            {pending ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
