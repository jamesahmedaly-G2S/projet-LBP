"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui-kit/Button";
import { Card } from "@/ui-kit/Card";

// Pendant client de app/(studio)/error.tsx — même règle : "Authentification
// requise" (401, session invalide/expirée) renvoie vers /login, "Accès
// refusé" (403, rôle admin sur un écran client) reste affiché tel quel.
// Vérifié en réel : un admin sur /bibliotheque voit maintenant "Accès
// refusé" au lieu de planter sur la page d'erreur générique de Next.
export default function ClientError({
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
    <main className="theme-client mx-auto max-w-lg px-6 py-10">
      <Card>
        <h1 className="text-lg font-semibold text-ink">{error.message}</h1>
        <p className="mt-2 text-sm text-muted">Une erreur est survenue sur cet écran.</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={reset}>
          Réessayer
        </Button>
      </Card>
    </main>
  );
}
