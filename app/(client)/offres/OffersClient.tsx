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
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { Button } from "@/ui-kit/Button";
import RequestOfferButton from "./RequestOfferButton";

// Port 1:1 du tableau comparatif et de l'aide au choix réels
// (LBP_V6_Studio.html, renderOffres(), lignes 5192-5207).
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
      <div className="flex flex-wrap items-center gap-4 rounded-md border border-border bg-surface p-4">
        <div className="inline-flex overflow-hidden rounded-full border border-border">
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className={`px-3 py-1.5 text-sm ${billing === "annual" ? "bg-primary text-white" : "text-ink"}`}
          >
            Paiement annuel
          </button>
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`px-3 py-1.5 text-sm ${billing === "monthly" ? "bg-primary text-white" : "text-ink"}`}
          >
            Paiement mensuel
          </button>
        </div>
        <span className="text-xs text-muted">
          {billing === "annual" ? "Le plus avantageux" : "Économisez avec le paiement annuel"}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted">Combien serez-vous à utiliser le LBP ?</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Retirer un utilisateur"
              className="h-7 w-7 rounded-full border border-border text-ink"
              onClick={() => setUserCount((u) => Math.max(1, u - 1))}
            >
              –
            </button>
            <input
              type="number"
              min={1}
              max={200}
              value={userCount}
              onChange={(e) => setUserCount(Math.max(1, Math.min(200, +e.target.value || 1)))}
              className="w-14 rounded-md border border-border px-2 py-1 text-center text-sm text-ink"
            />
            <button
              type="button"
              aria-label="Ajouter un utilisateur"
              className="h-7 w-7 rounded-full border border-border text-ink"
              onClick={() => setUserCount((u) => Math.min(200, u + 1))}
            >
              +
            </button>
          </div>
          <span className="text-sm text-muted">utilisateur{userCount > 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => {
          const isCurrent = tier.tierLevel === currentTier;
          const price = computeOfferPrice(tier, billing, userCount);
          const levels = tierLevels(tier.tierLevel);

          return (
            <Card
              key={tier.tierLevel}
              className={isCurrent ? "border-primary" : tier.reco ? "border-primary/50" : ""}
            >
              {isCurrent ? (
                <Badge tone="blue">Votre offre actuelle</Badge>
              ) : tier.badge ? (
                <Badge tone={tier.reco ? "blue" : "amber"}>{tier.badge}</Badge>
              ) : null}

              <h2 className="mt-2 text-lg font-semibold text-ink">{tier.name}</h2>
              <p className="mt-1 text-xs text-muted">{tier.sub}</p>

              <div className="mt-3">
                {tier.isCustomQuote && <span className="text-xs text-muted">à partir de </span>}
                <span className="text-2xl font-semibold text-ink">{price.main}</span>
                <span className="ml-1 text-sm text-muted">{price.unit}</span>
              </div>
              <p className="text-xs text-muted">{price.sub}</p>
              <p className="mt-1 text-xs text-ink">
                Jusqu&apos;à <b>{tier.users}</b> utilisateurs inclus
              </p>
              <p className="text-xs text-muted">{price.extraText}</p>
              {price.extraUsers > 0 && (
                <p className="mt-1 text-xs font-medium text-primary">Total : {price.totalText}</p>
              )}

              <ul className="mt-3 flex flex-col gap-1 text-xs text-ink">
                {tier.inc.slice(0, 6).map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>

              <ul className="mt-3 flex flex-col gap-1 text-xs">
                {LVLABEL.map((label, i) => (
                  <li
                    key={label}
                    className={`flex items-center gap-1.5 ${levels[i] ? "text-ink" : "text-muted"}`}
                  >
                    {levels[i] ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted" />
                    )}
                    {label}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-col gap-2">
                {isCurrent ? (
                  <Link href={`${linkPrefix}/offres/${tier.tierLevel}`}>
                    <Button type="button" variant="secondary" className="w-full">
                      Voir le détail de mon offre
                    </Button>
                  </Link>
                ) : pendingRequestTier ? (
                  <p className="text-xs text-muted">Une demande est déjà en attente.</p>
                ) : readOnly ? (
                  <Button type="button" variant="secondary" className="w-full" disabled>
                    {tier.cta}
                  </Button>
                ) : (
                  <RequestOfferButton targetTier={tier.tierLevel} label={tier.cta} />
                )}
                <Link
                  href={`${linkPrefix}/offres/${tier.tierLevel}`}
                  className="text-center text-xs text-primary hover:underline"
                >
                  Voir tout le détail
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <h3 className="mt-10 text-lg font-semibold text-ink">Comparez les offres LBP</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-2 font-medium text-muted">Ce qui est inclus</th>
              {tiers.map((t) => (
                <th
                  key={t.tierLevel}
                  className={`py-2 px-2 font-medium ${t.reco ? "text-primary" : "text-ink"}`}
                >
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map(([label, cells]) => (
              <tr key={label} className="border-b border-border">
                <td className="py-1.5 pr-2 text-ink">{label}</td>
                {cells.map((v, i) => (
                  <td key={i} className="px-2 py-1.5 text-center">
                    {v ? (
                      <Check className="mx-auto h-3.5 w-3.5 text-success" />
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-10 text-lg font-semibold text-ink">
        Quelle offre LBP est faite pour vous ?
      </h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {HELP_QUESTIONS.map(([question, tierLevel]) => {
          const tier = tiers.find((t) => t.tierLevel === tierLevel);
          return (
            <Link
              key={question}
              href={`${linkPrefix}/offres/${tierLevel}`}
              className="rounded-md border border-border bg-surface p-3 text-sm hover:border-primary"
            >
              <p className="text-ink">{question}</p>
              <p className="mt-1 font-medium text-primary">{tier?.name} →</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
