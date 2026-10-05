"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui-kit/Button";
import { Card } from "@/ui-kit/Card";

// Constaté en re-vérifiant l'ensemble du Studio après STU-REF-04 : une
// session dont le compte n'existe plus (ex. après un `supabase db reset`
// pendant qu'un onglet reste ouvert) fait planter requireSession() côté
// serveur (AuthError 401, "Authentification requise") — sans ce boundary,
// Next.js affichait sa page d'erreur générique au lieu de renvoyer vers
// /login. Le cas "Accès refusé" (403, rôle client sur un écran admin)
// reste volontairement affiché tel quel (déjà vérifié conforme par
// STU-REF-01), seul le cas "pas de session du tout" redirige.
export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const isAuthRequired = error.message === "Authentification requise";

  useEffect(() => {
    if (isAuthRequired) router.replace("/login");
  }, [isAuthRequired, router]);

  if (isAuthRequired) return null;

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <Card>
        <h1 className="text-lg font-semibold text-studio-navy">{error.message}</h1>
        <p className="mt-2 text-sm text-studio-muted">
          Une erreur est survenue sur cet écran du Studio.
        </p>
        <Button type="button" variant="secondary" className="mt-4" onClick={reset}>
          Réessayer
        </Button>
      </Card>
    </main>
  );
}
