import { requireClient } from "@/lib/auth/session";
import AccueilContent from "./AccueilContent";

// LBP-CLIENT-01 : "Accueil" [§1.2, p.8-9]. Contenu extrait dans
// AccueilContent.tsx (paramétré plutôt que dépendant de la session) pour
// être réutilisé tel quel par la prévisualisation admin (STU-CLIENT-04
// étendu).
export default async function AccueilPage() {
  const session = await requireClient();
  return (
    <AccueilContent
      companyId={session.profile.company_id}
      greetingName={session.profile.full_name}
      offerTier={session.profile.offer_tier}
      linkPrefix=""
    />
  );
}
