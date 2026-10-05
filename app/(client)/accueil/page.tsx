import { requireClient } from "@/lib/auth/session";
import AccueilContent from "./AccueilContent";
import type { CalendarEventType, CalendarEventScope } from "@/lib/client/calendar-taxonomy";

// LBP-CLIENT-01 : "Accueil" [§1.2, p.8-9]. Contenu extrait dans
// AccueilContent.tsx (paramétré plutôt que dépendant de la session) pour
// être réutilisé tel quel par la prévisualisation admin (STU-CLIENT-04
// étendu). searchParams pilotent le widget calendrier compact (navigation
// mois + filtres), préfixés `cal_` pour ne jamais entrer en collision avec
// un futur paramètre propre à cette page.
export default async function AccueilPage({
  searchParams,
}: {
  searchParams: Promise<{
    cal_annee?: string;
    cal_mois?: string;
    cal_theme?: string;
    cal_type?: string;
    cal_portee?: string;
  }>;
}) {
  const session = await requireClient();
  const sp = await searchParams;

  return (
    <AccueilContent
      companyId={session.profile.company_id}
      greetingName={session.profile.full_name}
      offerTier={session.profile.offer_tier}
      linkPrefix=""
      userId={session.userId}
      calYear={sp.cal_annee ? Number(sp.cal_annee) : undefined}
      calMonth={sp.cal_mois ? Number(sp.cal_mois) : undefined}
      calTheme={sp.cal_theme ?? null}
      calType={(sp.cal_type as CalendarEventType) ?? null}
      calScope={(sp.cal_portee as CalendarEventScope) ?? null}
    />
  );
}
