import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getAllStudioOfferTiers } from "@/lib/studio/offer-tiers";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";
import OffersClient from "./OffersClient";

// LBP-CLIENT-07 : "Présentation et détail des 4 offres commerciales"
// [§1.8, p.12]. Reconstruit pour suivre le vrai style client — repéré en
// activant le mode client dans LBP_V6_Studio.html (le fichier contient,
// sous l'overlay Studio, l'appli client complète, jamais explorée avant
// que l'utilisateur ne le signale) : bascule facturation annuelle/
// mensuelle, simulateur d'utilisateurs, cartes avec niveaux de
// personnalisation, tableau comparatif, aide au choix. Contenu marketing
// (sub/promesse/inc/why...) porté 1:1 dans lib/studio/offer-tiers.ts.
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
          currentTier={session.profile.offer_tier}
          pendingRequestTier={pendingRequest?.requested_tier ?? null}
        />
      </div>
    </main>
  );
}
