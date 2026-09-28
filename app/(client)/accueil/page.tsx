import Link from "next/link";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudioOfferTier, computeOfferPrice } from "@/lib/studio/offer-tiers";
import { Card } from "@/ui-kit/Card";
import ChiffreCard from "./ChiffreCard";

const KEY_FIGURE_LABELS: Record<string, string> = {
  "smic-h": "SMIC horaire brut",
  "smic-m": "SMIC mensuel brut (35 h)",
  pmss: "Plafond mensuel SS (PMSS)",
  pass: "Plafond annuel SS (PASS)",
};
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
}

// LBP-CLIENT-01 : "Accueil" [§1.2, p.8-9]. Rappels de semaine et
// calendrier compact non construits ici — dépendent d'un vrai moteur de
// calendrier/récurrence, explicitement hors phase 1
// (docs/ARCHITECTURE.md §7.1). Le reste est réel : chiffres clés
// (key_figures, schéma réel de James, jamais peuplée avant ce ticket —
// valeurs portées 1:1 du prototype, migration 20260928140000), dernières
// mises à jour (vraies publications récentes visibles par ce client via
// client_sheet_content), offre actuelle (déjà construit pour /offres,
// réutilisé ici), 3 familles de la bibliothèque avec leur vrai nombre de
// thèmes.
export default async function AccueilPage() {
  const session = await requireClient();
  const companyId = session.profile.company_id;

  const supabase = await createClient();

  const [{ data: keyFigures }, { data: families }, { data: themes }] = await Promise.all([
    supabase
      .from("key_figures")
      .select("key, year, value, unit, note")
      .in("key", KEY_FIGURE_ORDER)
      .order("year", { ascending: false })
      .returns<KeyFigureRow[]>(),
    supabase.from("master_families").select("id, code, name").order("display_order"),
    supabase.from("master_themes").select("id, family_id"),
  ]);

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
      <p className="text-sm text-muted">{dateStr}</p>
      <h1 className="mt-1 text-2xl font-semibold text-ink">
        Bonjour {session.profile.full_name} 👋
      </h1>

      <h2 className="mt-8 text-lg font-semibold text-ink">Les chiffres clés</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {KEY_FIGURE_ORDER.map((key) => {
          const history = historyByKey.get(key) ?? [];
          const current = history[0];
          if (!current) return null;
          return (
            <ChiffreCard
              key={key}
              label={KEY_FIGURE_LABELS[key]}
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
              href="/bibliotheque"
              className="mt-3 block text-center text-sm text-primary hover:underline"
            >
              La bibliothèque →
            </Link>
          </Card>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Actualités RH &amp; juridiques</h2>
          <Card className="mt-3">
            <p className="text-sm text-muted">Aucune actualité pour l&apos;instant.</p>
          </Card>
        </div>
      </div>

      {session.profile.offer_tier !== null && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-ink">Votre offre</h2>
          <Card className="mt-3">
            {(() => {
              const tier = getStudioOfferTier(session.profile.offer_tier!);
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
                    <Link href="/offres" className="text-sm text-primary hover:underline">
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
            <Link key={f.id} href="/bibliotheque">
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
      <Link href="/bibliotheque">
        <button className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-medium text-white hover:bg-primary-hover">
          Ouvrir toute la bibliothèque →
        </button>
      </Link>
    </main>
  );
}
