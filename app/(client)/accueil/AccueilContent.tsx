import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getStudioOfferTier,
  computeOfferPrice,
  type StudioOfferTier,
} from "@/lib/studio/offer-tiers";
import { keyFigureLabel } from "@/lib/client/key-figure-labels";
import { Card } from "@/ui-kit/Card";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";
import ChiffreCard from "./ChiffreCard";

const KEY_FIGURE_ORDER = ["smic-h", "smic-m", "pmss", "pass"];

const FAMILY_DECOR: Record<string, { icon: string; example: string }> = {
  "FAM-VIE": {
    icon: "👤",
    example: "Embauche · contrat · période d'essai · absences · protection sociale · départ",
  },
  "FAM-REM": {
    icon: "💶",
    example: "Salaire · primes · avantages en nature · congés · frais · net",
  },
  "FAM-COT": {
    icon: "📊",
    example: "Cotisations sociales · exonérations · réductions · charges patronales · DSN",
  },
};

interface KeyFigureRow {
  key: string;
  year: number;
  value: number;
  unit: string;
  note: string | null;
  label: string | null;
}

interface RecentArticleRow {
  id: string;
  title: string;
  category: string | null;
  published_at: string;
}

export interface AccueilContentProps {
  companyId: string | null;
  /** Nom affiché dans "Bonjour {greetingName}" -- prénom du client connecté,
   * ou raison sociale de la société en prévisualisation admin (pas de
   * personne précise à saluer dans ce mode). */
  greetingName: string;
  offerTier: number | null;
  /** Préfixe des liens internes -- "" pour la vraie appli client, ou
   * "/clients/[id]/vue-client" en prévisualisation admin (STU-CLIENT-04
   * étendu), pour ne jamais renvoyer l'admin vers une route qui lui
   * répondrait "Accès refusé". */
  linkPrefix: string;
}

// LBP-CLIENT-01 : "Accueil" [§1.2, p.8-9]. Contenu extrait pour être
// réutilisé par la vraie page client (companyId/greetingName/offerTier
// dérivés de la session) et la prévisualisation admin (dérivés de l'URL) --
// jamais deux implémentations de ce tableau de bord.
export default async function AccueilContent({
  companyId,
  greetingName,
  offerTier,
  linkPrefix,
}: AccueilContentProps) {
  const supabase = await createClient();

  const [{ data: keyFigures }, { data: families }, { data: themes }, { data: recentArticles }] =
    await Promise.all([
      supabase
        .from("key_figures")
        .select("key, year, value, unit, note, label")
        .in("key", KEY_FIGURE_ORDER)
        .order("year", { ascending: false })
        .returns<KeyFigureRow[]>(),
      supabase.from("master_families").select("id, code, name").order("display_order"),
      supabase.from("master_themes").select("id, family_id"),
      supabase
        .from("articles")
        .select("id, title, category, published_at")
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(3)
        .returns<RecentArticleRow[]>(),
    ]);

  const currentOfferTier: StudioOfferTier | null =
    offerTier !== null ? await getStudioOfferTier(supabase, offerTier) : null;

  const historyByKey = new Map<string, KeyFigureRow[]>();
  for (const row of keyFigures ?? []) {
    if (!historyByKey.has(row.key)) historyByKey.set(row.key, []);
    historyByKey.get(row.key)!.push(row);
  }

  const themeCountByFamily = new Map<string, number>();
  for (const t of themes ?? []) {
    themeCountByFamily.set(t.family_id, (themeCountByFamily.get(t.family_id) ?? 0) + 1);
  }

  let recentUpdates: { title: string; publishedAt: string | null }[] = [];
  if (companyId) {
    const { data: recentVersions } = await supabase
      .from("client_sheet_content")
      .select("master_sheet_id, published_at")
      .eq("layer_kind", "rg")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(3);

    const sheetIds = (recentVersions ?? []).map((v) => v.master_sheet_id);
    if (sheetIds.length > 0) {
      const { data: sheets } = await supabase
        .from("master_sheets")
        .select("id, title")
        .in("id", sheetIds);
      const titleById = new Map((sheets ?? []).map((s) => [s.id, s.title]));
      recentUpdates = (recentVersions ?? []).map((v) => ({
        title: titleById.get(v.master_sheet_id) ?? "—",
        publishedAt: v.published_at,
      }));
    }
  }

  const dateStr = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Eyebrow>{dateStr}</Eyebrow>
      <SectionTitle>Bonjour {greetingName} 👋</SectionTitle>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Les chiffres clés</h2>
        <Link href={`${linkPrefix}/chiffres-paie`} className="text-sm text-primary hover:underline">
          Tous les chiffres Paie →
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {KEY_FIGURE_ORDER.map((key) => {
          const history = historyByKey.get(key) ?? [];
          const current = history[0];
          if (!current) return null;
          return (
            <ChiffreCard
              key={key}
              label={keyFigureLabel(key, current.label)}
              currentNote={current.note ?? `${current.value} ${current.unit}`}
              history={history.map((h) => ({
                year: h.year,
                note: h.note ?? `${h.value} ${h.unit}`,
              }))}
            />
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-ink">Dernières mises à jour de votre LBP</h2>
          <Card className="mt-3">
            {recentUpdates.length === 0 ? (
              <p className="text-sm text-muted">Aucune mise à jour récente.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {recentUpdates.map((u, i) => (
                  <li key={i} className="text-ink">
                    {u.title}
                    {u.publishedAt && (
                      <span className="ml-2 text-xs text-muted">
                        {new Date(u.publishedAt).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`${linkPrefix}/bibliotheque`}
              className="mt-3 block text-center text-sm text-primary hover:underline"
            >
              La bibliothèque →
            </Link>
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Actualités RH &amp; juridiques</h2>
          <Card className="mt-3">
            {(recentArticles ?? []).length === 0 ? (
              <p className="text-sm text-muted">Aucune actualité pour l&apos;instant.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {(recentArticles ?? []).map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`${linkPrefix}/actu/${a.id}`}
                      className="text-ink hover:text-primary"
                    >
                      {a.title}
                    </Link>
                    <span className="ml-2 text-xs text-muted">
                      {new Date(a.published_at).toLocaleDateString("fr-FR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`${linkPrefix}/actu`}
              className="mt-3 block text-center text-sm text-primary hover:underline"
            >
              Toute l&apos;actu →
            </Link>
          </Card>
        </div>
      </div>

      {currentOfferTier && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-ink">Votre offre</h2>
          <Card className="mt-3">
            {(() => {
              const tier = currentOfferTier;
              const price = computeOfferPrice(tier, "annual", tier.users);
              return (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{tier.name}</p>
                    <p className="text-sm text-muted">{tier.sub}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-ink">
                      {price.main} <span className="text-sm text-muted">{price.unit}</span>
                    </p>
                    <Link
                      href={`${linkPrefix}/offres`}
                      className="text-sm text-primary hover:underline"
                    >
                      Voir le détail de mon offre →
                    </Link>
                  </div>
                </div>
              );
            })()}
          </Card>
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold text-ink">
        La bibliothèque <span className="text-sm font-normal text-muted">3 grandes familles</span>
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {(families ?? []).map((f) => {
          const decor = FAMILY_DECOR[f.code];
          return (
            <Link key={f.id} href={`${linkPrefix}/bibliotheque`}>
              <Card className="h-full hover:border-primary">
                <p className="text-lg">
                  {decor?.icon} {f.name}
                </p>
                {decor && <p className="mt-1 text-xs text-muted">{decor.example}</p>}
                <p className="mt-2 text-xs text-primary">
                  {themeCountByFamily.get(f.id) ?? 0} thématiques →
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
      <Link href={`${linkPrefix}/bibliotheque`}>
        <button className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-hover">
          Ouvrir toute la bibliothèque →
        </button>
      </Link>
    </main>
  );
}
