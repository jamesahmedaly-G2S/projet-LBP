import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getStudioOfferTier,
  computeOfferPrice,
  type StudioOfferTier,
} from "@/lib/studio/offer-tiers";
import { keyFigureLabel } from "@/lib/client/key-figure-labels";
import type { CalendarEventType, CalendarEventScope } from "@/lib/client/calendar-taxonomy";
import { Card } from "@/ui-kit/Card";
import ChiffreCard, { type KpiVariant } from "./ChiffreCard";
import FamilyCard, { type FamilyVariant } from "./FamilyCard";
import RemindersWidget, { type TaskRow } from "./RemindersWidget";
import CompactCalendar from "./CompactCalendar";

const KEY_FIGURE_ORDER = ["smic-h", "smic-m", "pmss", "pass"];

// LBP-CLIENT-01 (correctif design, 01/10/2026) : vérifié contre le vrai
// code (`chiffreVal()`, LBP_V9.9_Studio.html ligne ~6060) -- la carte de
// l'Accueil n'affiche que la VALEUR COURANTE simple ("12,31 €"), jamais
// `note`, qui chez nous peut contenir le détail des révisions
// intra-année ("12,02 € (janv.) · 12,31 € (juin)", réel pour le SMIC
// 2026 -- deux revalorisations la même année). Cette confusion (note
// utilisée comme valeur affichée) faisait déborder les cartes sur
// plusieurs lignes -- pas un problème de largeur de conteneur. `note`
// reste utilisée telle quelle dans l'historique déroulant de la carte
// (ChiffreCard.tsx), où le détail par année a sa place.
function formatAmount(value: number, unit: string): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: value % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} ${unit}`;
}
const KPI_VARIANTS: KpiVariant[] = ["ka", "kb", "kc", "kd"];

// LBP-CLIENT-01 (finitions design, 01/10/2026) : couleur par famille portée
// 1:1 depuis le vrai prototype (.fam-card.ta/tb/tc, "COUCHE CHARTE G2S") --
// voir FamilyCard.tsx pour le détail des couleurs. Associée par code plutôt
// que par index : robuste si l'ordre réel en base (display_order) diverge
// de l'ordre du prototype.
const FAMILY_DECOR: Record<string, { icon: string; example: string; variant: FamilyVariant }> = {
  "FAM-VIE": {
    icon: "👤",
    example: "Embauche · contrat · période d'essai · absences · protection sociale · départ",
    variant: "ta",
  },
  "FAM-REM": {
    icon: "💶",
    example: "Salaire · primes · avantages en nature · congés · frais · net",
    variant: "tb",
  },
  "FAM-COT": {
    icon: "📊",
    example: "Cotisations sociales · exonérations · réductions · charges patronales · DSN",
    variant: "tc",
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
  /** Absent en prévisualisation admin (pas de vrai profil client dont
   * afficher/amorcer les tâches personnelles) -- le widget "Vos rappels de
   * la semaine" ne s'affiche alors pas. */
  userId?: string;
  calYear?: number;
  calMonth?: number;
  calTheme?: string | null;
  calType?: CalendarEventType | null;
  calScope?: CalendarEventScope | null;
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
  userId,
  calYear,
  calMonth,
  calTheme = null,
  calType = null,
  calScope = null,
}: AccueilContentProps) {
  const supabase = await createClient();

  const today = new Date();
  const effectiveCalYear = calYear ?? today.getFullYear();
  const effectiveCalMonth = calMonth ?? today.getMonth() + 1;

  // LBP-CLIENT-01 (correctif, 01/10/2026) : amorçage + lecture faits en un
  // seul appel atomique côté base (seed_weekly_tasks, migration
  // 20261001130000) -- un "SELECT puis INSERT si vide" fait ici en JS
  // n'est pas atomique et se dupliquait en usage réel (deux rendus quasi
  // simultanés du Server Component, ex. pré-chargement de <Link> par
  // Next.js + navigation réelle, voyaient chacun "aucune tâche" et
  // inséraient chacun leur lot).
  let weeklyTasks: TaskRow[] = [];
  if (userId) {
    const { data } = await supabase.rpc("seed_weekly_tasks", { p_profile_id: userId });
    weeklyTasks = (data as TaskRow[] | null) ?? [];
  }

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

  const dateStr = today.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = today.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      {/* LBP-CLIENT-01 (finitions fidélité, 01/10/2026) : "Vos rappels de la
          semaine" + calendrier compact manquaient entièrement -- signalé par
          l'utilisateur après vérification directe de la V9.9. Layout
          dash-top porté 1:1 (grid 1fr 380px -- colonne gauche : date/heure +
          bandeau "Bonjour" + rappels ; colonne droite : calendrier compact),
          LBP_V9.9_Studio.html lignes ~10121-10128. L'heure est figée au
          rendu serveur (pas de minuteur temps réel comme #dashClock, qui
          tick côté client toutes les secondes dans le prototype) --
          simplification assumée, sans impact fonctionnel. */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-3">
          <p className="text-[13.5px] font-semibold text-muted capitalize">
            🗓️ {dateStr} · {timeStr}
          </p>
          <div className="rounded-2xl bg-ink p-5 text-white">
            <p className="text-xl font-extrabold">Bonjour {greetingName} 👋</p>
          </div>
          {userId && <RemindersWidget tasks={weeklyTasks} />}
        </div>
        <CompactCalendar
          year={effectiveCalYear}
          month={effectiveCalMonth}
          theme={calTheme}
          typeEv={calType}
          scope={calScope}
          linkPrefix={linkPrefix}
        />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Les chiffres clés</h2>
        <Link href={`${linkPrefix}/chiffres-paie`} className="text-sm text-primary hover:underline">
          Tous les chiffres Paie →
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {KEY_FIGURE_ORDER.map((key, i) => {
          const history = historyByKey.get(key) ?? [];
          const current = history[0];
          if (!current) return null;
          return (
            <ChiffreCard
              key={key}
              variant={KPI_VARIANTS[i % KPI_VARIANTS.length]}
              label={keyFigureLabel(key, current.label)}
              currentNote={formatAmount(current.value, current.unit)}
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
            <FamilyCard
              key={f.id}
              href={`${linkPrefix}/bibliotheque`}
              icon={decor?.icon ?? "📁"}
              name={f.name}
              example={decor?.example}
              themeCount={themeCountByFamily.get(f.id) ?? 0}
              variant={decor?.variant ?? "tb"}
            />
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
