import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LVLABEL,
  computeOfferPrice,
  getStudioOfferTier,
  tierLevels,
} from "@/lib/studio/offer-tiers";
import { Check, X } from "lucide-react";
import RequestOfferButton from "../RequestOfferButton";
import { btnPrimaryClass } from "../offer-styles";

export interface OfferDetailContentProps {
  tierParam: string;
  companyId: string | null;
  offerTier: number | null;
  linkPrefix?: string;
  readOnly?: boolean;
}

// `.od-h` : 16px/800, -.02em, carbone, marges 26px/10px.
const odHeadingClass =
  "mt-[26px] mb-[10px] text-[16px] leading-[1.5] font-extrabold tracking-[-0.02em] text-ink";
// `.od-p` : 14px, interligne 1.7.
const odParagraphClass = "text-[14px] leading-[1.7] text-ink";

// Pendant de openOfferPage() (LBP_V9.9_Studio.html ~L11433). Extrait
// (paramétré plutôt que dépendant de la session) pour être réutilisé tel
// quel par la prévisualisation admin (STU-CLIENT-04 étendu).
//
// Correctif fidélité (06/10/2026) : mise en forme reprise des valeurs
// calculées de la maquette (getComputedStyle à 1240px) plutôt que des
// composants génériques ui-kit -- carte `.od-card` (radius 20, padding
// 34px 38px, largeur max 820px, filet carbone si recommandée), titre 30px,
// promesse sur fond « essentiel » framboise, encart prix crème, bandeau
// `.od-highlight` bleu-gris, formule `.od-formula` sur fond « maîtriser »,
// niveaux de personnalisation en grille de tuiles crème (`.od-lvs`),
// note de bas `.od-foot` en encart crème italique, état « offre actuelle »
// en pilule `.od-current`.
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
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <div className="mb-1.5 flex items-center gap-3">
        <Link
          href={`${linkPrefix}/offres`}
          className="py-1 text-[13px] font-bold text-ink hover:text-primary"
        >
          ← Retour aux offres
        </Link>
      </div>

      <div
        className={`max-w-[820px] rounded-[20px] border bg-white px-[38px] py-[34px] shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)] max-[700px]:px-5 max-[700px]:py-6 ${tier.reco ? "border-ink" : "border-border"}`}
      >
        {tier.badge && (
          <span className="mb-3 inline-flex items-center gap-[5px] rounded-full bg-ink px-[11px] py-1 text-[9.5px] leading-[1.5] font-extrabold tracking-[0.05em] text-white uppercase">
            {tier.badge}
          </span>
        )}
        <p className="mt-1.5 mb-1 text-[11.5px] leading-[1.5] font-extrabold tracking-[0.14em] text-primary uppercase">
          Offre LBP
        </p>
        <h1 className="mt-1 mb-1.5 text-[30px] leading-[1.5] font-extrabold tracking-[-0.02em] text-ink">
          {tier.name}
        </h1>
        <p className="mb-4 text-[15px] leading-[1.5] text-muted">{tier.sub}</p>
        <div className="mb-[10px] rounded-xl bg-[#F5E6EB] px-[18px] py-[14px] text-[17px] leading-[1.45] font-extrabold text-primary">
          {tier.promesse}
        </div>
        {tier.sousPromesse && (
          <p className="mb-3 text-[13.5px] leading-[1.5] text-ink italic">{tier.sousPromesse}</p>
        )}
        <p className={odParagraphClass}>{tier.desc}</p>

        <div className="my-5 rounded-[14px] bg-[#F5F0EC] px-[22px] py-[18px]">
          <div className="flex flex-wrap items-baseline gap-[5px] text-ink">
            {tier.isCustomQuote && (
              <span className="ml-[3px] basis-full text-[11px] leading-[1.5] font-semibold tracking-[0.04em] text-muted uppercase">
                à partir de
              </span>
            )}
            <b className="text-[32px] leading-none font-extrabold">{price.main}</b>
            <span className="ml-[3px] text-[12.5px] leading-[1.5] font-semibold text-muted">
              {price.unit}
            </span>
          </div>
          <p className="mt-1 text-[11.5px] leading-[1.5] text-muted">{price.sub}</p>
          <p className="mt-[10px] text-[13px] leading-[1.5] text-ink">
            Jusqu&apos;à <b>{tier.users}</b> utilisateurs inclus
          </p>
          <p className="mt-[3px] text-[11.5px] leading-[1.5] text-muted">{price.extraText}</p>
          {tier.note && <p className="mb-2 text-[12px] leading-[1.5] text-muted">{tier.note}</p>}
        </div>

        {tier.highlight && (
          <div className="my-[18px] rounded-xl bg-[#EAECEF] p-[14px] text-center text-[14px] leading-[1.5] font-extrabold tracking-[0.02em] text-[#364054]">
            {tier.highlight}
          </div>
        )}
        {tier.formula && (
          <div className="my-[18px] flex flex-wrap items-center justify-center gap-[9px] rounded-xl bg-[#EFE7E1] p-4">
            {tier.formula.map((f, i) => (
              <span key={f} className="contents">
                {i > 0 && <i className="font-extrabold text-[#3E0417] not-italic">+</i>}
                <span className="text-[11.5px] leading-[1.5] font-extrabold text-[#3E0417] uppercase">
                  {f}
                </span>
              </span>
            ))}
            <i className="font-extrabold text-[#3E0417] not-italic">=</i>
            <b className="text-[13px] leading-[1.5] text-ink">VOTRE RÈGLE APPLICABLE</b>
          </div>
        )}

        <h2 className={odHeadingClass}>Pour qui ?</h2>
        <p className={odParagraphClass}>{tier.pourqui}</p>

        <h2 className={odHeadingClass}>Ce que vous obtenez</h2>
        <ul className="flex flex-col gap-1.5 text-[13.5px] leading-[1.45] text-ink">
          {tier.inc.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {tier.blocs && (
          <>
            <h2 className={odHeadingClass}>LBP Signature s&apos;adapte à votre entreprise</h2>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
              {tier.blocs.map(([title, text]) => (
                <div key={title} className="rounded-xl bg-[#EAF7F6] px-4 py-[14px]">
                  <b className="mb-[5px] block text-[12px] leading-[1.5] font-extrabold tracking-[0.03em] text-[#0B6E6C]">
                    {title}
                  </b>
                  <span className="text-[12.5px] leading-[1.5] text-ink">{text}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className={odHeadingClass}>Votre niveau de personnalisation</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-[9px]">
          {LVLABEL.map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-[10px] bg-[#F5F0EC] px-[13px] py-[10px] text-[13px] leading-[1.5] ${levels[i] ? "text-ink" : "text-[#C6BFC3] line-through"}`}
            >
              {levels[i] ? (
                <Check className="h-[15px] w-[15px] shrink-0" strokeWidth={2} />
              ) : (
                <X className="h-[15px] w-[15px] shrink-0" strokeWidth={2} />
              )}
              <span>{label}</span>
            </div>
          ))}
        </div>

        {tier.why.length > 0 && (
          <>
            <h2 className={odHeadingClass}>Pourquoi choisir cette offre ?</h2>
            <ul className="list-disc pl-5 text-[13.5px] leading-[1.8] text-ink">
              {tier.why.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </>
        )}

        {tier.foot && (
          <p className="mt-5 mb-[22px] rounded-xl border border-border bg-[#F5F0EC] px-[17px] pt-4 pb-[14px] text-[13.5px] leading-[1.5] text-muted italic">
            {tier.foot}
          </p>
        )}

        {isCurrent ? (
          <p className="mt-[22px] inline-flex items-center gap-[7px] rounded-full bg-[#EFE7E1] px-[18px] py-[10px] text-[13.5px] leading-[1.5] font-bold text-primary">
            <Check className="h-[15px] w-[15px]" strokeWidth={2} aria-hidden="true" /> Il
            s&apos;agit de votre offre actuelle
          </p>
        ) : (
          <div className="mt-[22px] flex flex-wrap gap-[10px]">
            {pendingRequestTier ? (
              <p className="text-[13.5px] leading-[1.5] text-muted">
                Une demande est déjà en attente de traitement.
              </p>
            ) : readOnly ? (
              <button
                type="button"
                className={`${btnPrimaryClass} w-auto min-w-[190px] py-[10px]`}
                disabled
              >
                {tier.cta}
              </button>
            ) : (
              <div className="min-w-[190px]">
                <RequestOfferButton targetTier={tierLevel} label={tier.cta} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
