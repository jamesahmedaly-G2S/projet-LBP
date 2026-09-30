import { requireClient } from "@/lib/auth/session";
import OffresContent from "./OffresContent";

// LBP-CLIENT-07 : "Présentation et détail des 4 offres commerciales"
// [§1.8, p.12]. Contenu extrait dans OffresContent.tsx pour être réutilisé
// tel quel par la prévisualisation admin (STU-CLIENT-04 étendu).
export default async function OffresPage() {
  const session = await requireClient();
  const companyId = session.profile.company_id;

  if (!companyId || session.profile.offer_tier === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-danger">
          Aucune société rattachée à ce compte — contactez votre référent G2S.
        </p>
      </main>
    );
  }

  return <OffresContent companyId={companyId} offerTier={session.profile.offer_tier} />;
}
