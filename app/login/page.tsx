"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, null);

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 px-6 py-20">
      <h1 className="text-xl font-semibold text-zinc-900">Connexion</h1>

      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          Email
          <input
            type="email"
            name="email"
            required
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-700">
          Mot de passe
          <input
            type="password"
            name="password"
            required
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
