import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudioOfferTier } from "@/lib/studio/offer-tiers";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import RequestOfferButton from "./RequestOfferButton";

interface OfferTierRow {
  tier_level: number;
  includes_cba: boolean;
  includes_agreements: boolean;
  unlocks_detail: boolean;
  max_messages_per_month: number;
}

// LBP-CLIENT-07 : "Présentation et détail des 4 offres commerciales"
// [§1.8, p.12]. offer_tiers (table de James) reste la source des droits
// réels (includes_cba/agreements...) ; le vocabulaire et la tarification
// affichés viennent de lib/studio/offer-tiers.ts (déjà écrit pour ça lors
// de STU-DATA-06, jamais consommé par un écran jusqu'ici).
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

  const currentTier = session.profile.offer_tier;
  const supabase = await createClient();

  const [{ data: tiers }, { data: pendingRequest }] = await Promise.all([
    supabase
      .from("offer_tiers")
      .select(
        "tier_level, includes_cba, includes_agreements, unlocks_detail, max_messages_per_month",
      )
      .order("tier_level")
      .returns<OfferTierRow[]>(),
    supabase
      .from("offer_change_requests")
      .select("requested_tier")
      .eq("company_id", companyId)
      .eq("status", "pending")
      .maybeSingle(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-ink">Offres</h1>
      <p className="mt-1 text-sm text-muted">
        Votre société est actuellement sur le palier{" "}
        <span className="font-medium text-ink">{getStudioOfferTier(currentTier).name}</span>.
      </p>
      {pendingRequest && (
        <p className="mt-1 text-sm text-primary">
          Une demande de passage à {getStudioOfferTier(pendingRequest.requested_tier).name} est en
          attente de traitement par votre référent G2S.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(tiers ?? []).map((row) => {
          const tier = getStudioOfferTier(row.tier_level);
          const isCurrent = row.tier_level === currentTier;
          return (
            <Card key={row.tier_level} className={isCurrent ? "border-primary" : ""}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-ink">{tier.name}</h2>
                {isCurrent && <Badge tone="blue">Palier actuel</Badge>}
              </div>
              <p className="mt-1 text-sm font-medium text-ink">{tier.priceLabel}</p>
              <ul className="mt-3 flex flex-col gap-1 text-sm text-ink">
                <li>
                  {tier.includedUsers} utilisateur{tier.includedUsers > 1 ? "s" : ""} inclus
                  {tier.extraUserPrice !== null && ` (+${tier.extraUserPrice} € HT/an au-delà)`}
                </li>
                <li>{row.includes_cba ? "✓" : "—"} Compléments conventionnels (CCN)</li>
                <li>{row.includes_agreements ? "✓" : "—"} Contenu spécifique entreprise</li>
                <li>{row.unlocks_detail ? "✓" : "—"} Contenu détaillé</li>
                <li>
                  {row.max_messages_per_month > 0
                    ? `${row.max_messages_per_month} questions/mois`
                    : "Questions illimitées"}
                </li>
              </ul>
              {!isCurrent && (
                <div className="mt-4">
                  {pendingRequest ? (
                    <p className="text-xs text-muted">Une autre demande est déjà en attente.</p>
                  ) : (
                    <RequestOfferButton targetTier={row.tier_level} />
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </main>
  );
}
