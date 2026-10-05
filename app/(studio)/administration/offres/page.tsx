import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import OffersManager, { type StudioOfferContentAdmin } from "./OffersManager";

// STU-OFFER-03 : écran G2S manquant, trouvé en auditant LBP_V9.9_Studio.html
// (stContenus()) -- les 4 offres étaient en dur dans
// lib/studio/offer-tiers.ts, jamais éditables sans toucher au code.
export default async function AdminOffresPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: offers } = await supabase
    .from("studio_offer_content")
    .select("*")
    .order("tier_level")
    .returns<StudioOfferContentAdmin[]>();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/administration" className="text-sm text-studio-blue hover:underline">
        ← Administration
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-studio-navy">Offres</h1>
      <p className="mt-1 text-sm text-studio-muted">
        Contenu des 4 offres commerciales affichées côté client (/offres). Les 4 paliers sont fixes
        — un seul contenu à modifier par palier, aucun ajout/suppression possible ici.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {(offers ?? []).map((offer) => (
          <Card key={offer.tier_level}>
            <OffersManager offer={offer} />
          </Card>
        ))}
      </div>
    </main>
  );
}
