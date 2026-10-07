import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { Book, ChartLine, Check, File, Newspaper, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getStudioOfferTier,
  computeOfferPrice,
  tierLevels,
  LVLABEL,
  type StudioOfferTier,
} from "@/lib/studio/offer-tiers";
import { keyFigureLabel } from "@/lib/client/key-figure-labels";
import type { CalendarEventType, CalendarEventScope } from "@/lib/client/calendar-taxonomy";
import ChiffreCard, { type KpiVariant } from "./ChiffreCard";
import FamilyCard, { type FamilyVariant } from "./FamilyCard";
import RemindersWidget, { type TaskRow } from "./RemindersWidget";
import CompactCalendar from "./CompactCalendar";

// `.dash-card` / `.btn-line` / `.btn-primary` mesurés sur la V9.9.
const CARD =
  "rounded-2xl border border-border bg-surface px-5 py-[18px] shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]";
const BTN_LINE =
  "mt-2.5 flex w-full items-center justify-center gap-[7px] rounded-full border border-primary bg-white px-[18px] py-[9px] text-[12.5px] font-bold text-primary transition-colors hover:bg-primary hover:text-white";
const BTN_PRIMARY =
  "inline-flex items-center gap-[7px] rounded-full bg-primary px-[18px] py-[9px] text-[12.5px] font-bold whitespace-nowrap text-white transition hover:-translate-y-px hover:bg-primary-hover";

// `.sec-title.big` (bloc "TITRES — renforcement demandé") : 23px/800,
// -.015em, #33405A, pictogramme 18px, annexe `span` 12.5px italique 500
// #9A959A ; marges 6px 0 12px.
function SecTitle({
  Icon,
  sub,
  className = "",
  children,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  sub?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <h2
      className={`mb-3 flex items-baseline gap-2.5 text-[23px] leading-[1.5] font-extrabold tracking-[-0.015em] text-[#33405A] ${className}`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0 self-center" aria-hidden="true" />
      {children}
      {sub && <span className="text-[12.5px] font-medium text-[#9A959A] italic">{sub}</span>}
    </h2>
  );
}

// `.ov-a` : tuile crème, puce 9px (framboise + halo pour l'élément le plus
// récent `.new`, carbone sinon), titre 13.5px/700, sous-ligne 11.5px.
function ListTile({
  href,
  title,
  sub,
  isNew,
}: {
  href?: string;
  title: string;
  sub?: string;
  isNew?: boolean;
}) {
  const body = (
    <>
      <span
        className={`mt-[5px] h-[9px] w-[9px] shrink-0 rounded-full ${
          isNew ? "bg-primary shadow-[0_0_0_4px_rgba(103,6,38,0.2)]" : "bg-ink"
        }`}
      />
      <span className="min-w-0">
        <strong className="block text-[13.5px] leading-[1.5] font-bold text-ink">{title}</strong>
        {sub && <span className="text-[11.5px] leading-[1.5] text-muted">{sub}</span>}
      </span>
    </>
  );
  const cls = "flex items-start gap-[11px] rounded-[10px] bg-[#F5F0EC] px-[13px] py-[11px]";
  return href ? (
    <Link href={href} className={`${cls} hover:bg-[#EFE7E1]`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

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
  })
    .format(value)
    // Intl sépare les milliers par U+202F, absent d'Archivo : espace insécable classique.
    .replace(/ /g, " ");
  return `${formatted} ${unit}`;
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
      <div className="mb-[18px] grid items-start gap-4 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-3">
          <p className="text-[13.5px] leading-[1.5] font-semibold text-muted capitalize">
            🗓️ {dateStr} · {timeStr}
          </p>
          <div className="rounded-2xl bg-ink px-5 py-[18px] text-white shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]">
            <p className="text-[26px] leading-[1.5] font-extrabold">Bonjour {greetingName} 👋</p>
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

      <SecTitle Icon={ChartLine} sub="cliquez pour l'historique" className="mt-[6px]">
        Les chiffres clés
      </SecTitle>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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

      {/* Correctif fidélité (06/10/2026, mesures getComputedStyle de
          renderOverview(), LBP_V9.9_Studio.html ~L10121-10154) : titres
          `.sec-title.big` avec pictogramme SVG 18px (plus d'emoji), listes
          `.ov-alist` en tuiles crème (`.ov-a` : fond #F5F0EC, radius 10,
          padding 11px 13px, puce 9px), carte d'offre `.my-offer` (nom 19px
          800, pastilles de niveaux `.mo-chip`), bouton bibliothèque
          `.btn-primary` framboise à largeur de contenu. Ordre conservé :
          Actualités à gauche, Dernières mises à jour à droite. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col">
          <SecTitle Icon={Newspaper} className="mt-[6px] !mb-2.5">
            Actualités RH &amp; juridiques
          </SecTitle>
          <div className={CARD}>
            {(recentArticles ?? []).length === 0 ? (
              <p className="text-[13.5px] text-muted">Aucune actualité pour l&apos;instant.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(recentArticles ?? []).map((a, i) => (
                  <ListTile
                    key={a.id}
                    href={`${linkPrefix}/actu/${a.id}`}
                    title={a.title}
                    sub={[a.category, new Date(a.published_at).toLocaleDateString("fr-FR")]
                      .filter(Boolean)
                      .join(" · ")}
                    isNew={i === 0}
                  />
                ))}
              </div>
            )}
            <Link href={`${linkPrefix}/actu`} className={BTN_LINE}>
              Toute l&apos;actu →
            </Link>
          </div>
        </div>

        <div className="flex flex-col">
          <SecTitle Icon={File} className="mt-[6px] !mb-2.5">
            Dernières mises à jour de votre LBP
          </SecTitle>
          <div className={CARD}>
            {recentUpdates.length === 0 ? (
              <p className="text-[13.5px] text-muted">Aucune mise à jour récente.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {recentUpdates.map((u, i) => (
                  <ListTile
                    key={i}
                    title={u.title}
                    sub={
                      u.publishedAt
                        ? `Mise à jour le ${new Date(u.publishedAt).toLocaleDateString("fr-FR")}`
                        : ""
                    }
                    isNew={i === 0}
                  />
                ))}
              </div>
            )}
            <Link href={`${linkPrefix}/mon-entreprise`} className={BTN_LINE}>
              Mon entreprise →
            </Link>
          </div>
        </div>
      </div>

      {currentOfferTier && (
        <>
          <SecTitle Icon={Tag} className="mt-[6px]">
            Votre offre
          </SecTitle>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-border bg-surface px-6 py-5 shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]">
            <div>
              <p className="text-[19px] leading-[1.5] font-extrabold text-ink">
                {currentOfferTier.name}
              </p>
              <p className="mt-1 mb-2 text-[13px] leading-[1.5] text-muted">
                {currentOfferTier.sub}
              </p>
              <div className="flex flex-wrap gap-[7px]">
                {tierLevels(currentOfferTier.tierLevel).map((on, i) =>
                  on ? (
                    <span
                      key={i}
                      className="inline-flex items-center gap-[5px] rounded-full bg-[#F5F0EC] px-[11px] py-1 text-[11.5px] leading-[1.5] font-bold text-primary"
                    >
                      <Check className="h-[13px] w-[13px]" aria-hidden="true" /> {LVLABEL[i]}
                    </span>
                  ) : null,
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="mb-2 text-[22px] leading-[1.5] font-extrabold text-ink">
                {computeOfferPrice(currentOfferTier, "annual", currentOfferTier.users).main}
                <span className="ml-[3px] text-xs font-semibold text-muted">an</span>
              </p>
              <Link href={`${linkPrefix}/offres`} className={BTN_PRIMARY}>
                Voir le détail de mon offre
              </Link>
            </div>
          </div>
        </>
      )}

      <SecTitle Icon={Book} sub="3 grandes familles" className="mt-[22px]">
        La bibliothèque
      </SecTitle>
      <div className="grid gap-[14px] sm:grid-cols-3">
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
      <Link href={`${linkPrefix}/bibliotheque`} className={`mt-[14px] ${BTN_PRIMARY}`}>
        Ouvrir toute la bibliothèque →
      </Link>
    </main>
  );
}
