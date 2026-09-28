import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import CcnManager, { type CcnAdmin } from "./CcnManager";

// Écran G2S manquant, signalé par l'utilisateur. ccn_catalog n'avait
// qu'une policy de lecture (migration 20260925085051), jamais de policy
// d'écriture ni d'écran — jamais géré depuis le début du projet
// (migration 20260928170000 ajoute les policies manquantes).
export default async function AdminCcnPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("ccn_catalog")
    .select("idcc, name")
    .order("idcc")
    .returns<CcnAdmin[]>();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/administration" className="text-sm text-studio-blue hover:underline">
        ← Administration
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-studio-navy">
        Catalogue des conventions collectives
      </h1>
      <p className="mt-1 text-sm text-studio-muted">
        Utilisé pour la sélection des CCN des sociétés, les couches conventionnelles des fiches, et
        le catalogue de recherche.
      </p>

      <Card className="mt-6">
        <CcnManager items={items ?? []} />
      </Card>
    </main>
  );
}
