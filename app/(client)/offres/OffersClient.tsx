"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import {
  LVLABEL,
  computeOfferPrice,
  tierLevels,
  type StudioOfferTier,
} from "@/lib/studio/offer-tiers";
import RequestOfferButton from "./RequestOfferButton";
import { btnLineClass, btnLineXsClass, btnPrimaryClass } from "./offer-styles";

// Port 1:1 du tableau comparatif et de l'aide au choix réels
// (LBP_V9.9_Studio.html, renderOffres(), ~L11415-11430).
//
// Correctif fidélité (03/10/2026), suite à un retour de l'utilisateur
// ("+30€ HT/an par utilisateur supplémentaire... Total: 411€ HT/an...
// ça ne colle pas") : le calcul lui-même était déjà correct
// (computeOfferPrice), mais le détail intermédiaire manquait -- le vrai
// `offPrice()`/`renderOffres()` (~L11397-11402) affiche un encart
// `.off-sim` ("{N} utilisateurs · {M} inclus" / "+ {X} supplémentaire(s)
// : {coût} € HT" / "Total : ...") entre le taux et le total, seulement
// quand il y a des utilisateurs en plus des inclus -- on sautait
// directement du taux au total, sans montrer d'où il sortait.
//
// Correctif fidélité (03/10/2026) : cartes et titres recalés sur le vrai
// CSS (.off-card/.off-name/.off-sub/.off-price/.off-h2, ~L1217-1261) --
// tailles exactes en valeurs arbitraires, pas les classes Tailwind
// devinées précédentes. Libellés de section "Tout ce qui est inclus" /
// "Votre niveau de personnalisation" (.off-sec) ajoutés : absents de
// cette version, alors que renderOffres() les affiche explicitement
// au-dessus de chaque liste.
const COMPARISON_ROWS: [string, [number, number, number, number]][] = [
  ["Réglementation", [1, 1, 1, 1]],
  ["Fiches pratiques", [1, 1, 1, 1]],
  ["Actualités", [1, 1, 1, 1]],
  ["Calendrier RH", [1, 1, 1, 1]],
  ["Quiz", [1, 1, 1, 1]],
  ["Convention collective", [0, 1, 1, 1]],
  ["Comparatif Loi / CCN", [0, 1, 1, 1]],
  ["Accords d'entreprise", [0, 0, 1, 1]],
  ["Usages internes", [0, 0, 1, 1]],
  ["Comparatif Loi / CCN / Entreprise", [0, 0, 1, 1]],
  ["Procédures internes", [0, 0, 0, 1]],
  ["Paramétrages Paie", [0, 0, 0, 1]],
  ["Spécificités DSN", [0, 0, 0, 1]],
  ["Justificatifs internes", [0, 0, 0, 1]],
  ["Modèles internes", [0, 0, 0, 1]],
  ["Cas pratiques personnalisés", [0, 0, 0, 1]],
  ["Accompagnement G2S", [0, 0, 0, 1]],
];

// LBP-CLIENT-07 (correctif fidélité, 03/10/2026), suite à un retour de
// l'utilisateur ("ce n'est pas aligné") : `.off-badge` (LBP_V9.9_Studio.html
// ~L1224) réserve toujours `min-height:20px;margin-bottom:12px`, même
// sans badge réel -- un `.off-badge.ghost` transparent (`&nbsp;`) occupe
// la même place, pour que le titre de chaque carte démarre à la même
// hauteur. Un `null` à la place (notre première version) décale "LBP
// Essentiel" (seule carte sans badge) vers le haut par rapport aux 3
// autres. `.reco`/`.prem` pointent toutes deux vers `--sage-deep`/`--ink`,
// la même couleur carbone dans ce fichier -- jamais deux teintes
// distinctes à reproduire, une seule classe suffit ici.
const badgeClass =
  "mb-3 inline-flex min-h-[20px] items-center gap-[5px] self-start rounded-full px-[11px] py-1 text-[9.5px] leading-[1.5] font-extrabold tracking-[0.05em] uppercase";

// `.off-sec` : 10.5px/800, capitales, .04em, muted, marges 18px/8px.
const sectionLabelClass =
  "mt-[18px] mb-2 text-[10.5px] leading-[1.5] font-extrabold tracking-[0.04em] text-muted uppercase";

// `.off-h2` : 22px/800, -.02em, carbone, centré, marges 44px/16px.
const offH2Class =
  "mt-11 mb-4 text-center text-[22px] leading-[1.5] font-extrabold tracking-[-0.02em] text-ink";

// `.off-table td` : 12.5px, padding 11px 14px, filet bas --line ; première
// colonne 600 à gauche, autres centrées ; colonne recommandée sur #FAF9F7.
const firstCellClass =
  "border-b border-border px-[14px] py-[11px] text-left text-[12.5px] leading-[1.5] font-semibold text-ink";
const cellClass = (reco?: boolean) =>
  `border-b border-border px-[14px] py-[11px] text-center text-[12.5px] leading-[1.5] text-ink ${reco ? "bg-[#FAF9F7]" : ""}`;

const HELP_QUESTIONS: [string, number][] = [
  ["Je veux disposer d'une base Paie fiable", 1],
  ["Je veux intégrer les règles de ma convention collective", 2],
  ["Je veux connaître la règle réellement applicable dans mon entreprise", 3],
  ["Je veux construire le référentiel Paie propre à mon organisation", 4],
];

export default function OffersClient({
  tiers,
  currentTier,
  pendingRequestTier,
  linkPrefix = "",
  readOnly = false,
}: {
  tiers: StudioOfferTier[];
  currentTier: number;
  pendingRequestTier: number | null;
  /** "" pour la vraie appli client, "/clients/[id]/vue-client" en
   * prévisualisation admin (STU-CLIENT-04 étendu). */
  linkPrefix?: string;
  /** Prévisualisation admin : masque la demande de changement d'offre --
   * "aucun droit d'écriture supplémentaire" (STU-CLIENT-04). */
  readOnly?: boolean;
}) {
  const [billing, setBilling] = useState<"annual" | "monthly">("annual");
  const [userCount, setUserCount] = useState(10);

  return (
    <div>
      {/* Correctif fidélité (06/10/2026, mesures getComputedStyle de
          `.off-config` & co., renderOffres() ~L11380) : barre crème
          (#F5F0EC, radius 16, padding 14px 18px, mb 26), bascule
          segmentée blanche dont l'état actif est CARBONE (pas framboise),
          mention « Le plus avantageux » framboise 12px/700 avec coche,
          compteur d'utilisateurs dans une pilule blanche unique. */}
      <div className="mb-[26px] flex flex-wrap items-center gap-[18px] rounded-2xl bg-[#F5F0EC] px-[18px] py-[14px]">
        <div
          role="group"
          aria-label="Mode de facturation"
          className="flex rounded-full border border-border bg-white p-[3px]"
        >
          {(["annual", "monthly"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setBilling(mode)}
              className={`rounded-full px-[18px] py-2 text-[13px] leading-[14px] font-bold transition-colors ${billing === mode ? "bg-ink text-white" : "text-muted"}`}
            >
              {mode === "annual" ? "Paiement annuel" : "Paiement mensuel"}
            </button>
          ))}
        </div>
        <span className="flex items-center gap-[5px] text-[12px] leading-[1.5] font-bold text-primary">
          {billing === "annual" ? (
            <>
              <Check className="h-[13px] w-[13px]" strokeWidth={2} aria-hidden="true" />
              Le plus avantageux
            </>
          ) : (
            "Économisez avec le paiement annuel"
          )}
        </span>

        <div className="ml-auto flex items-center gap-[10px]">
          <span className="text-[12.5px] leading-[1.5] font-semibold text-muted">
            Combien serez-vous à utiliser le LBP ?
          </span>
          <div className="flex items-center rounded-full border border-border bg-white">
            <button
              type="button"
              aria-label="Retirer un utilisateur"
              className="h-[34px] w-8 text-[17px] text-ink"
              onClick={() => setUserCount((u) => Math.max(1, u - 1))}
            >
              –
            </button>
            <input
              type="number"
              min={1}
              max={200}
              aria-label="Nombre d'utilisateurs"
              value={userCount}
              onChange={(e) => setUserCount(Math.max(1, Math.min(200, +e.target.value || 1)))}
              className="w-[52px] [appearance:textfield] border-none bg-white text-center text-[14px] font-extrabold text-ink outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button
              type="button"
              aria-label="Ajouter un utilisateur"
              className="h-[34px] w-8 text-[17px] text-ink"
              onClick={() => setUserCount((u) => Math.min(200, u + 1))}
            >
              +
            </button>
          </div>
          <span className="text-[12.5px] leading-[1.5] text-muted">
            utilisateur{userCount > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[1150px]:grid-cols-4">
        {tiers.map((tier) => {
          const isCurrent = tier.tierLevel === currentTier;
          const price = computeOfferPrice(tier, billing, userCount);
          const levels = tierLevels(tier.tierLevel);

          return (
            <div
              key={tier.tierLevel}
              className={`flex flex-col rounded-[18px] border bg-white px-[22px] py-6 ${isCurrent ? "border-primary" : tier.reco ? "border-ink shadow-[0_0_0_2px_rgba(103,6,38,0.16)]" : "border-border"}`}
            >
              {isCurrent ? (
                <span className={badgeClass + " bg-primary text-white"}>
                  <Check className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                  Votre offre actuelle
                </span>
              ) : tier.badge ? (
                <span className={badgeClass + " bg-ink text-white"}>{tier.badge}</span>
              ) : (
                <span className={badgeClass + " bg-transparent"}>&nbsp;</span>
              )}

              <h2 className="mb-1 text-[19px] leading-[1.5] font-extrabold text-ink">
                {tier.name}
              </h2>
              <p className="mt-[5px] mb-4 text-[12.5px] leading-[1.5] text-muted">{tier.sub}</p>

              {/* `.off-price` : montant 32px/800 (pas 22px), unité 12.5px/600 ;
                  « À partir de » 11px/600 capitales sur sa propre ligne. */}
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
              {tier.isCustomQuote ? (
                <div className="mt-[11px] rounded-[10px] bg-[#F5F0EC] px-3 py-[9px] text-[11.5px] leading-[1.6] text-ink">
                  Tarification personnalisée selon le projet et le nombre d&apos;utilisateurs.
                </div>
              ) : (
                price.extraUsers > 0 && (
                  <div className="mt-[11px] rounded-[10px] bg-[#F5F0EC] px-3 py-[9px] text-[11.5px] leading-[1.6] text-ink">
                    <div>
                      {userCount} utilisateurs · {tier.users} inclus
                    </div>
                    <div>
                      + {price.extraUsers} supplémentaire{price.extraUsers > 1 ? "s" : ""} :{" "}
                      {price.extraCostText}
                    </div>
                    <div className="mt-[3px] font-extrabold text-primary">
                      Total : {price.totalText}
                    </div>
                  </div>
                )
              )}

              <p className={sectionLabelClass}>Tout ce qui est inclus</p>
              <ul className="flex flex-col gap-1.5 text-[12.5px] leading-[1.45] text-ink">
                {tier.inc.slice(0, 6).map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-[13px] w-[13px] shrink-0" strokeWidth={2} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* `.off-lv` : liste CENTRÉE ; niveaux non inclus en #C6BFC3
                  barrés -- pas une croix grise alignée à gauche. */}
              <p className={sectionLabelClass}>Votre niveau de personnalisation</p>
              <ul className="flex flex-col items-center gap-1.5 text-[12.5px] leading-[1.45]">
                {LVLABEL.map((label, i) => (
                  <li
                    key={label}
                    className={`flex items-start gap-2 ${levels[i] ? "text-ink" : "text-[#C6BFC3] line-through"}`}
                  >
                    {levels[i] ? (
                      <Check className="mt-0.5 h-[13px] w-[13px] shrink-0" strokeWidth={2} />
                    ) : (
                      <X className="mt-0.5 h-[13px] w-[13px] shrink-0" strokeWidth={2} />
                    )}
                    <span>{label}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-col gap-[7px] pt-[18px]">
                {isCurrent ? (
                  <Link href={`${linkPrefix}/offres/${tier.tierLevel}`} className={btnLineClass}>
                    Voir le détail de mon offre
                  </Link>
                ) : pendingRequestTier ? (
                  <p className="text-center text-[11.5px] leading-[1.5] text-muted">
                    Une demande est déjà en attente.
                  </p>
                ) : readOnly ? (
                  <button type="button" className={btnPrimaryClass} disabled>
                    {tier.cta}
                  </button>
                ) : (
                  <RequestOfferButton targetTier={tier.tierLevel} label={tier.cta} />
                )}
                <Link href={`${linkPrefix}/offres/${tier.tierLevel}`} className={btnLineXsClass}>
                  Voir tout le détail
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* `.off-table-wrap` : carte blanche radius 16 ; en-têtes sur fond
          crème ; colonne recommandée sur fond minéral (#FAF9F7) avec la
          mention « Recommandé » ; lignes « Utilisateurs inclus » /
          « Utilisateur supplémentaire » après un filet de 2px. */}
      <h3 className={offH2Class}>Comparez les offres LBP</h3>
      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[560px] border-collapse [&_tbody_tr:last-child_td]:border-b-0">
          <thead>
            <tr>
              <th className="bg-[#F5F0EC] px-[14px] py-[11px] text-left text-[13px] leading-[1.5] font-semibold text-ink">
                Ce qui est inclus
              </th>
              {tiers.map((t) => (
                <th
                  key={t.tierLevel}
                  className={`px-[14px] py-[11px] text-center text-[13px] leading-[1.5] font-extrabold text-ink ${t.reco ? "bg-[#FAF9F7]" : "bg-[#F5F0EC]"}`}
                >
                  {t.name}
                  {t.reco && (
                    <span className="block text-[9.5px] leading-[1.5] font-extrabold uppercase">
                      Recommandé
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map(([label, cells]) => (
              <tr key={label}>
                <td className={firstCellClass}>{label}</td>
                {cells.map((v, i) => (
                  <td key={i} className={cellClass(tiers[i]?.reco)}>
                    {v ? (
                      <Check className="mx-auto h-3.5 w-3.5 text-ink" strokeWidth={2} />
                    ) : (
                      <span className="text-[#C6BFC3]">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className={`${firstCellClass} border-t-2`}>Utilisateurs inclus</td>
              {tiers.map((t) => (
                <td key={t.tierLevel} className={`${cellClass(t.reco)} border-t-2`}>
                  <b>{t.users}</b>
                </td>
              ))}
            </tr>
            <tr>
              <td className={firstCellClass}>Utilisateur supplémentaire</td>
              {tiers.map((t) => (
                <td key={t.tierLevel} className={cellClass(t.reco)}>
                  {t.extraUserPrice != null ? `+ ${t.extraUserPrice} € HT/an` : "Sur devis"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className={offH2Class}>Quelle offre LBP est faite pour vous ?</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {HELP_QUESTIONS.map(([question, tierLevel]) => {
          const tier = tiers.find((t) => t.tierLevel === tierLevel);
          return (
            <Link
              key={question}
              href={`${linkPrefix}/offres/${tierLevel}`}
              className="rounded-[14px] border border-border bg-white px-[18px] py-4 text-left transition hover:-translate-y-0.5 hover:border-ink"
            >
              <span className="mb-2 block text-[13.5px] leading-[1.45] text-ink">{question}</span>
              <span className="text-[13px] font-extrabold text-ink">{tier?.name} →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
