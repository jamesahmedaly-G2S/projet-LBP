import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";
import AddEventForm from "./AddEventForm";
import DeleteEventButton from "./DeleteEventButton";
import CalendarFiltersRh from "./CalendarFiltersRh";
import { pad2 } from "@/lib/client/month-grid";
import {
  EVENT_TYPE_LABEL,
  EVENT_SCOPE_LABEL,
  EVENT_TYPE_COLOR,
  PRIORITY_LABEL,
  TYPE_BADGE_TONE,
  type CalendarEventType,
  type CalendarEventScope,
} from "@/lib/client/calendar-taxonomy";

// LBP-CLIENT-15 : "Calendrier RH" [onglet réel repéré en auditant
// LBP_V9.9_Studio.html, absent du cahier écrit -- voir tickets/LBP-CLIENT.md].
// Portée volontairement réduite au minimum demandé : des évènements à date
// concrète (calendar_events, schéma réel de James), jamais un calcul de
// récurrence -- le vrai moteur (calendar_rules, 5 types de règles dont
// Pâques par l'algorithme de Meeus) est explicitement hors phase 1
// (docs/ARCHITECTURE.md §7.1), laissé intact et non consommé ici.
//
// Correctif fidélité (03/10/2026), suite à un retour de l'utilisateur
// ("compare bien mot pour mot et taille pour taille") : revérifié contre
// le vrai `renderCalFull()` (LBP_V9.9_Studio.html ~L3315-3359, PAS
// `renderCalendar()`, le widget compact de l'Accueil -- deux fonctions,
// deux designs différents) et son CSS (`.calf-*`, ~L930-950). Écarts
// trouvés et corrigés :
// - Grille réelle : 42 cellules englobant les jours des mois voisins
//   (grisés, `.calf-cell.out`), pas seulement les jours du mois courant
//   avec des cases vides -- `monthWeeks()` (partagé avec CompactCalendar,
//   qui lui N'A PAS ce débordement dans le vrai `renderCalendar()`) ne
//   convient pas ici, grille reconstruite localement.
// - Cellule réelle : chaque événement s'affiche en PUCE DE TEXTE lisible
//   directement dans la grille (`.calf-ev`, titre complet tronqué à 3
//   lignes), pas un simple point de couleur -- l'info est visible sans
//   cliquer.
// - Navigation : boutons année (« »), pas seulement mois (‹ ›) ; compteur
//   "X échéance(s) ce mois" ; légende + indice "Cliquez sur une journée
//   pour le détail ou pour ajouter votre échéance." sous la grille --
//   rien de tout ça n'existait.
// - Filtres : extraits dans CalendarFiltersRh.tsx, appliqués au
//   changement (aucun bouton "Filtrer" dans le vrai marquage, même
//   principe que CompactCalendar/CalendarFilters de l'Accueil) --
//   "portée" retiré du filtre (n'existe pas dans le vrai `CAL_TAX`,
//   c'était une invention), toujours affiché en revanche dans le détail
//   du jour (le vrai `renderDayModal()` montre bien la portée par
//   événement, juste pas comme filtre global).
// - En-têtes de colonnes : vrais noms de jours en toutes lettres
//   ("lundi".."dimanche"), pas des abréviations à 3 lettres.
//
// Couleurs par type, taxonomie : voir lib/client/calendar-taxonomy.ts,
// partagé avec CompactCalendar.tsx (widget compact de l'Accueil,
// LBP-CLIENT-01). EVENT_TYPE_COLOR (teintes propres EVCOL du prototype)
// utilisé ici pour les puces d'événement (`--c` dans le vrai CSS, une
// couleur par événement, pas une classe Tailwind sémantique) -- la
// légende, elle, garde les tons sémantiques déjà choisis (TYPE_DOT_CLASS)
// pour rester cohérente avec le widget compact et /calendrier-rh lui-même
// ailleurs sur la page (badges de la liste du jour).
//
// Correctif fidélité (04/10/2026), suite au retour de l'utilisateur
// ("regarde aussi la page calendrier RH mot pour mot") : re-audit contre
// `.calf-title`/`.cal-legend`/`.dm-sec` (~L934, ~L948, ~L634) et
// `renderDayModal()` (~L3403-3432). Écarts trouvés et corrigés :
// - Titre mois/année sans taille explicite (texte par défaut du
//   navigateur) -- le vrai `.calf-title` fait 20px (`text-xl`).
// - Légende : `gap-x-3.5 gap-y-1`/`text-[11px]` approximés -- le vrai
//   `.cal-legend` (dernière couche, qui l'emporte) fait `gap:16px`
//   uniforme/`font-size:12px`, pastille à `margin-right:6px` (pas 4px).
// - Section "Échéances & événements" (`.dm-sec`, sur le vrai modal jour)
//   manquait entièrement au-dessus de la liste d'événements du jour --
//   ajoutée, port 1:1 du style (`11.5px/800/uppercase/.04em`).
// - `EVENT_SCOPE_LABEL` (`lib/client/calendar-taxonomy.ts`) : "National"
//   devait être "National / général", "Mon entreprise" devait être
//   "Entreprise" -- jamais vérifiés contre le vrai `scopeLbl`
//   (`renderDayModal()` ~L3406) jusqu'ici.
// - `AddEventForm.tsx` : placeholder "Ex. Entretien annuel — équipe RH"
//   inventé -- le vrai `#dm-t` a pour placeholder "Intitulé de
//   l'événement" (générique, pas un exemple concret), corrigé.
//
// Écart assumé, non corrigé : pas de capacité de modification d'un
// événement personnel déjà créé (le vrai `editDayEvent()`/✎) -- seuls
// l'ajout (`AddEventForm`) et la suppression (`DeleteEventButton`)
// existent. Un utilisateur qui se trompe supprime et recrée l'événement
// plutôt que de l'éditer en place -- fonctionnellement suffisant, mais
// un vrai écart avec le prototype, à construire si Pauline le juge
// prioritaire (formulaire déjà prêt à être réutilisé en mode édition).
//
// Correctif fidélité (04/10/2026 bis), suite à un nouveau retour de
// l'utilisateur citant le vrai texte mot pour mot : le paragraphe
// d'intro était reformulé ("Obligations de paie, temps forts
// nationaux..."), pas porté 1:1 depuis le vrai `<p>` statique
// (`<div class="view" id="v-calendrier">`, ~L2571, PAS généré par
// `renderCalFull()` -- jamais vérifié à cet endroit jusqu'ici) : "Toutes
// les dates clés de l'année : obligations de paie et déclaratives, temps
// forts nationaux, actions RH à anticiper. Cliquez sur une journée pour
// consulter le détail ou ajouter votre propre échéance.", `max-width:
// 720px`. Corrigé mot pour mot.
//
// "← Retour" (`#backBar`/`.subbar`, ~L2563) volontairement absent :
// c'est un bouton générique d'historique de vues internes au prototype
// (`goBack()`/`viewHistory`, affiché dès qu'on arrive sur N'IMPORTE
// QUELLE vue via un clic depuis une autre, pas un texte propre à
// Calendrier RH) -- notre routage utilise de vraies URL/le bouton retour
// natif du navigateur, qui couvre déjà ce besoin ; ajouter un second
// bouton "retour" ferait doublon avec une fonctionnalité native, pas un
// manque de contenu.

const WEEKDAY_NAMES = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const WEEKDAY_SHORT = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
const MONTH_NAMES = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

interface CalendarEventRow {
  id: string;
  scope: CalendarEventScope;
  event_date: string;
  title: string;
  category: string | null;
  event_type: CalendarEventType | null;
  priority: number | null;
  note: string | null;
  company_id: string | null;
  profile_id: string | null;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// Grille réelle : 6 semaines (42 jours), lundi en première colonne,
// débordant sur les mois voisins -- distincte de monthWeeks() (utilisée
// par le widget compact, qui n'a pas ce débordement dans le vrai
// renderCalendar()).
function buildFullGrid(year: number, month: number): { date: Date; inMonth: boolean }[] {
  const first = new Date(year, month - 1, 1);
  const dow = first.getDay() || 7;
  const gridStart = new Date(year, month - 1, 1 - (dow - 1));
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return { date: d, inMonth: d.getMonth() === month - 1 };
  });
}

export default async function CalendarContent({
  year,
  month,
  day,
  theme,
  typeEv,
  companyId,
  userId,
  linkPrefix = "",
}: {
  year: number;
  month: number;
  day: string | null;
  theme: string | null;
  typeEv: CalendarEventType | null;
  companyId: string | null;
  userId: string;
  linkPrefix?: string;
}) {
  const supabase = await createClient();

  const grid = buildFullGrid(year, month);
  const gridStartKey = dateKey(grid[0].date);
  const gridEndKey = dateKey(grid[grid.length - 1].date);

  let query = supabase
    .from("calendar_events")
    .select(
      "id, scope, event_date, title, category, event_type, priority, note, company_id, profile_id",
    )
    .gte("event_date", gridStartKey)
    .lte("event_date", gridEndKey)
    .order("event_date");

  if (theme) query = query.eq("category", theme);
  if (typeEv) query = query.eq("event_type", typeEv);

  const { data: events } = await query.returns<CalendarEventRow[]>();
  const all = events ?? [];

  const byDate = new Map<string, CalendarEventRow[]>();
  for (const e of all) {
    if (!byDate.has(e.event_date)) byDate.set(e.event_date, []);
    byDate.get(e.event_date)!.push(e);
  }
  const monthStart = `${year}-${pad2(month)}-01`;
  const monthEndExclusive = month === 12 ? `${year + 1}-01-01` : `${year}-${pad2(month + 1)}-01`;
  const monthCount = all.filter(
    (e) => e.event_date >= monthStart && e.event_date < monthEndExclusive,
  ).length;

  const buildHref = (params: {
    year?: number;
    month?: number;
    day?: string | null;
    theme?: string | null;
    typeEv?: string | null;
  }) => {
    const sp = new URLSearchParams();
    const finalYear = params.year ?? year;
    const finalMonth = params.month ?? month;
    const finalDay = params.day !== undefined ? params.day : day;
    const finalTheme = params.theme !== undefined ? params.theme : theme;
    const finalType = params.typeEv !== undefined ? params.typeEv : typeEv;
    sp.set("annee", String(finalYear));
    sp.set("mois", String(finalMonth));
    if (finalDay) sp.set("jour", finalDay);
    if (finalTheme) sp.set("theme", finalTheme);
    if (finalType) sp.set("type", finalType);
    return `${linkPrefix}/calendrier-rh?${sp.toString()}`;
  };

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  const today = new Date();
  const todayStr = dateKey(today);

  const dayEvents = day ? (byDate.get(day) ?? []) : [];
  const dayLabel = day
    ? new Date(`${day}T00:00:00`).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>Votre année RH</Eyebrow>
      <SectionTitle>Calendrier RH</SectionTitle>
      <p className="-mt-3 max-w-[720px] text-sm text-muted">
        Toutes les dates clés de l&apos;année : obligations de paie et déclaratives, temps forts
        nationaux, actions RH à anticiper. Cliquez sur une journée pour consulter le détail ou
        ajouter votre propre échéance.
      </p>

      <div className="mt-4">
        <CalendarFiltersRh
          action={`${linkPrefix}/calendrier-rh`}
          year={year}
          month={month}
          theme={theme}
          typeEv={typeEv}
        />
      </div>

      <div className="mb-3 flex items-center gap-2.5">
        <Link
          href={buildHref({ year: year - 1, day: null })}
          title="Année précédente"
          className="grid h-[26px] w-[26px] place-items-center rounded-lg bg-[#F5F0EC] text-[15px] text-ink hover:bg-[#EFE7E1]"
        >
          «
        </Link>
        <Link
          href={buildHref({ year: prevMonth.year, month: prevMonth.month, day: null })}
          className="grid h-[26px] w-[26px] place-items-center rounded-lg bg-[#F5F0EC] text-[15px] text-ink hover:bg-[#EFE7E1]"
        >
          ‹
        </Link>
        <p className="min-w-[190px] text-xl font-extrabold text-ink capitalize">
          {MONTH_NAMES[month - 1]} {year}
        </p>
        <Link
          href={buildHref({ year: nextMonth.year, month: nextMonth.month, day: null })}
          className="grid h-[26px] w-[26px] place-items-center rounded-lg bg-[#F5F0EC] text-[15px] text-ink hover:bg-[#EFE7E1]"
        >
          ›
        </Link>
        <Link
          href={buildHref({ year: year + 1, day: null })}
          title="Année suivante"
          className="grid h-[26px] w-[26px] place-items-center rounded-lg bg-[#F5F0EC] text-[15px] text-ink hover:bg-[#EFE7E1]"
        >
          »
        </Link>
        <span className="ml-auto text-[12.5px] text-muted">
          {monthCount} échéance{monthCount > 1 ? "s" : ""} ce mois
        </span>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-[14px] border border-border bg-border">
        {WEEKDAY_NAMES.map((w, i) => (
          <div
            key={w}
            className="bg-[#F5F0EC] py-[9px] text-center text-[11px] font-extrabold tracking-[0.03em] text-muted uppercase"
          >
            <span className="hidden sm:inline">{w}</span>
            <span className="sm:hidden">{WEEKDAY_SHORT[i]}</span>
          </div>
        ))}
        {grid.map(({ date, inMonth }) => {
          const ds = dateKey(date);
          const dEvents = byDate.get(ds) ?? [];
          const isToday = ds === todayStr;
          const isSelected = ds === day;
          return (
            <Link
              key={ds}
              href={buildHref({ day: ds })}
              className={`flex min-h-[112px] flex-col gap-[5px] bg-white p-[7px_7px_9px] ${
                inMonth ? "" : "bg-[#FAF9F7]"
              } ${isSelected ? "ring-2 ring-primary ring-inset" : ""} hover:bg-[#FAF9F7]`}
            >
              <span
                className={`flex items-baseline gap-[5px] font-extrabold ${
                  !inMonth ? "text-[#C6BFC3]" : isToday ? "text-primary" : "text-ink"
                }`}
              >
                <span className="text-[15px]">{date.getDate()}</span>
                <span className="text-[10px] font-semibold text-muted lowercase">
                  {WEEKDAY_SHORT[(date.getDay() || 7) - 1]}
                </span>
              </span>
              <div className="flex flex-col gap-1">
                {dEvents.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className={`line-clamp-3 rounded-[5px] bg-[#F5F0EC] py-1 pr-1.5 pl-1.5 text-[10.5px] leading-[1.3] text-ink ${
                      e.scope === "personal" ? "bg-[#F5F0EC] font-semibold" : ""
                    }`}
                    style={{
                      borderLeft: `3px solid ${e.event_type ? EVENT_TYPE_COLOR[e.event_type] : "#ccc"}`,
                    }}
                  >
                    {e.title}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        {(Object.keys(EVENT_TYPE_LABEL) as CalendarEventType[]).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span
              className="h-[9px] w-[9px] rounded-full"
              style={{ background: EVENT_TYPE_COLOR[t] }}
            />
            {EVENT_TYPE_LABEL[t]}
          </span>
        ))}
        <span className="ml-auto italic">
          Cliquez sur une journée pour le détail ou pour ajouter votre échéance.
        </span>
      </div>

      {day && (
        <Card className="mt-4">
          <p className="text-sm font-semibold text-ink capitalize">{dayLabel}</p>
          <p className="mt-4 mb-2 text-[11.5px] font-extrabold tracking-[0.04em] text-muted uppercase">
            Échéances &amp; événements
          </p>
          {dayEvents.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Aucune échéance ce jour.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {dayEvents.map((e) => {
                const canDelete =
                  (e.scope === "personal" && e.profile_id === userId) ||
                  (e.scope === "company" && e.company_id === companyId);
                return (
                  <li
                    key={e.id}
                    className="flex items-start justify-between gap-2 border-b border-border pb-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {e.event_type && (
                          <Badge tone={TYPE_BADGE_TONE[e.event_type]}>
                            {EVENT_TYPE_LABEL[e.event_type]}
                          </Badge>
                        )}
                        <Badge tone="neutral">{EVENT_SCOPE_LABEL[e.scope]}</Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium text-ink">{e.title}</p>
                      <p className="text-xs text-muted">
                        {e.category}
                        {e.priority && ` · priorité ${PRIORITY_LABEL[e.priority] ?? e.priority}`}
                      </p>
                      {e.note && <p className="mt-1 text-xs text-muted">{e.note}</p>}
                    </div>
                    {canDelete && <DeleteEventButton id={e.id} title={e.title} />}
                  </li>
                );
              })}
            </ul>
          )}

          <AddEventForm defaultDate={day} />
        </Card>
      )}
    </main>
  );
}
