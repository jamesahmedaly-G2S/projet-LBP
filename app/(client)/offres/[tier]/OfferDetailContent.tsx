import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LVLABEL,
  computeOfferPrice,
  getStudioOfferTier,
  tierLevels,
} from "@/lib/studio/offer-tiers";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { Button } from "@/ui-kit/Button";
import { Check, X } from "lucide-react";
import RequestOfferButton from "../RequestOfferButton";

export interface OfferDetailContentProps {
  tierParam: string;
  companyId: string | null;
  offerTier: number | null;
  linkPrefix?: string;
  readOnly?: boolean;
}

// Pendant de openOfferPage() (LBP_V6_Studio.html, lignes 5211-5249). Extrait
// (paramétré plutôt que dépendant de la session) pour être réutilisé tel
// quel par la prévisualisation admin (STU-CLIENT-04 étendu).
export default async function OfferDetailContent({
  tierParam,
  companyId,
  offerTier,
  linkPrefix = "",
  readOnly = false,
}: OfferDetailContentProps) {
  const tierLevel = Number(tierParam);
  if (!Number.isInteger(tierLevel) || tierLevel < 1 || tierLevel > 4) notFound();

  const supabase = await createClient();
  const tier = await getStudioOfferTier(supabase, tierLevel);
  const isCurrent = tierLevel === offerTier;
  const price = computeOfferPrice(tier, "annual", tier.users);
  const levels = tierLevels(tierLevel);

  let pendingRequestTier: number | null = null;
  if (companyId) {
    const { data } = await supabase
      .from("offer_change_requests")
      .select("requested_tier")
      .eq("company_id", companyId)
      .eq("status", "pending")
      .maybeSingle();
    pendingRequestTier = data?.requested_tier ?? null;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href={`${linkPrefix}/offres`} className="text-sm text-primary hover:underline">
        ← Retour aux offres
      </Link>

      <Card className={`mt-4 ${tier.reco ? "border-primary/50" : ""}`}>
        {tier.badge && <Badge tone={tier.reco ? "blue" : "amber"}>{tier.badge}</Badge>}
        <p className="mt-2 text-xs uppercase tracking-wide text-muted">Offre LBP</p>
        <h1 className="text-2xl font-semibold text-ink">{tier.name}</h1>
        <p className="mt-1 text-sm text-muted">{tier.sub}</p>
        <p className="mt-3 text-lg font-medium text-ink">{tier.promesse}</p>
        {tier.sousPromesse && <p className="mt-1 text-sm text-muted">{tier.sousPromesse}</p>}
        <p className="mt-3 text-sm text-ink">{tier.desc}</p>

        <div className="mt-4 rounded-md border border-border bg-page-bg p-3">
          <div>
            {tier.isCustomQuote && <span className="text-xs text-muted">à partir de </span>}
            <span className="text-2xl font-semibold text-ink">{price.main}</span>
            <span className="ml-1 text-sm text-muted">{price.unit}</span>
          </div>
          <p className="text-xs text-muted">{price.sub}</p>
          <p className="mt-1 text-xs text-ink">
            Jusqu&apos;à <b>{tier.users}</b> utilisateurs inclus
          </p>
          <p className="text-xs text-muted">{price.extraText}</p>
          {tier.note && <p className="mt-1 text-xs text-muted">{tier.note}</p>}
        </div>

        {tier.highlight && (
          <p className="mt-4 text-center text-sm font-semibold uppercase tracking-wide text-primary">
            {tier.highlight}
          </p>
        )}
        {tier.formula && (
          <p className="mt-2 text-center text-xs text-muted">
            {tier.formula.join(" + ")} = <b className="text-ink">VOTRE RÈGLE APPLICABLE</b>
          </p>
        )}

        <h2 className="mt-5 text-sm font-semibold text-ink">Pour qui ?</h2>
        <p className="mt-1 text-sm text-ink">{tier.pourqui}</p>

        <h2 className="mt-5 text-sm font-semibold text-ink">Ce que vous obtenez</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {tier.inc.map((item) => (
            <li key={item} className="flex items-start gap-1.5 text-ink">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
              {item}
            </li>
          ))}
        </ul>

        {tier.blocs && (
          <>
            <h2 className="mt-5 text-sm font-semibold text-ink">
              LBP Signature s&apos;adapte à votre entreprise
            </h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {tier.blocs.map(([title, text]) => (
                <div key={title} className="rounded-md border border-border p-2">
                  <p className="text-xs font-semibold text-ink">{title}</p>
                  <p className="mt-0.5 text-xs text-muted">{text}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="mt-5 text-sm font-semibold text-ink">Votre niveau de personnalisation</h2>
        <div className="mt-2 flex flex-col gap-1">
          {LVLABEL.map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 text-sm ${levels[i] ? "text-ink" : "text-muted"}`}
            >
              {levels[i] ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <X className="h-3.5 w-3.5 text-muted" />
              )}
              {label}
            </div>
          ))}
        </div>

        {tier.why.length > 0 && (
          <>
            <h2 className="mt-5 text-sm font-semibold text-ink">Pourquoi choisir cette offre ?</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-ink">
              {tier.why.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </>
        )}

        {tier.foot && <p className="mt-4 text-xs italic text-muted">{tier.foot}</p>}

        <div className="mt-5">
          {isCurrent ? (
            <p className="flex items-center gap-1.5 text-sm text-success">
              <Check className="h-4 w-4" /> Il s&apos;agit de votre offre actuelle
            </p>
          ) : pendingRequestTier ? (
            <p className="text-sm text-muted">Une demande est déjà en attente de traitement.</p>
          ) : readOnly ? (
            <Button type="button" variant="secondary" disabled>
              {tier.cta}
            </Button>
          ) : (
            <RequestOfferButton targetTier={tierLevel} label={tier.cta} />
          )}
        </div>
      </Card>
    </main>
  );
}
