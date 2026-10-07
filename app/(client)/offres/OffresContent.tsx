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
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>Nos offres</Eyebrow>
      <SectionTitle>Les offres LBP</SectionTitle>
      <p className="mb-5 max-w-[670px] text-[14px] leading-[1.5] text-muted">
        Le LBP fonctionne comme un <strong>entonnoir</strong> : on part du droit général, puis on
        ajoute vos conventions collectives, puis vos accords et usages d&apos;entreprise.{" "}
        <strong>Cliquez sur une offre</strong> pour voir le détail.
      </p>
      {pendingRequest && (
        <p className="-mt-2 mb-5 text-[13.5px] leading-[1.5] text-primary">
          Une demande de passage à un autre palier est en attente de traitement par votre référent
          G2S.
        </p>
      )}

      <div>
        <OffersClient
          tiers={await getAllStudioOfferTiers(supabase)}
          currentTier={offerTier}
          pendingRequestTier={pendingRequest?.requested_tier ?? null}
          linkPrefix={linkPrefix}
          readOnly={readOnly}
        />
      </div>

      <p className="mx-auto mt-6 max-w-[780px] text-center text-[13.5px] leading-[1.6] text-muted">
        Toutes nos offres sont rédigées à partir des textes en vigueur et mises à jour en fonction
        des évolutions législatives, réglementaires et conventionnelles.
      </p>
    </main>
  );
}
