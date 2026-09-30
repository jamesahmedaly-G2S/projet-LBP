import { createClient } from "@/lib/supabase/server";
import { getAllStudioOfferTiers } from "@/lib/studio/offer-tiers";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";
import OffersClient from "./OffersClient";

export interface OffresContentProps {
  companyId: string;
  offerTier: number;
  linkPrefix?: string;
  readOnly?: boolean;
}

// LBP-CLIENT-07 : contenu extrait (paramétré par companyId/offerTier
// plutôt que dépendant de la session) pour être réutilisé tel quel par la
// prévisualisation admin (STU-CLIENT-04 étendu, readOnly=true masque la
// demande de changement d'offre).
export default async function OffresContent({
  companyId,
  offerTier,
  linkPrefix = "",
  readOnly = false,
}: OffresContentProps) {
  const supabase = await createClient();
  const { data: pendingRequest } = await supabase
    .from("offer_change_requests")
    .select("requested_tier")
    .eq("company_id", companyId)
    .eq("status", "pending")
    .maybeSingle();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Eyebrow>Nos offres</Eyebrow>
      <SectionTitle>Les offres LBP</SectionTitle>
      <p className="-mt-3 text-sm text-muted">
        Choisissez le niveau de LBP adapté à votre entreprise.
      </p>
      {pendingRequest && (
        <p className="mt-2 text-sm text-primary">
          Une demande de passage à un autre palier est en attente de traitement par votre référent
          G2S.
        </p>
      )}

      <div className="mt-6">
        <OffersClient
          tiers={await getAllStudioOfferTiers(supabase)}
          currentTier={offerTier}
          pendingRequestTier={pendingRequest?.requested_tier ?? null}
          linkPrefix={linkPrefix}
          readOnly={readOnly}
        />
      </div>
    </main>
  );
}
