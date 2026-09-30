import { requireClient } from "@/lib/auth/session";
import OfferDetailContent from "./OfferDetailContent";

// Pendant de openOfferPage() (LBP_V6_Studio.html, lignes 5211-5249). Contenu
// extrait dans OfferDetailContent.tsx pour être réutilisé tel quel par la
// prévisualisation admin (STU-CLIENT-04 étendu).
export default async function OfferDetailPage({ params }: { params: Promise<{ tier: string }> }) {
  const session = await requireClient();
  const { tier: tierParam } = await params;
  return (
    <OfferDetailContent
      tierParam={tierParam}
      companyId={session.profile.company_id}
      offerTier={session.profile.offer_tier}
    />
  );
}
