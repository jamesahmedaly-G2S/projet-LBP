import type { SupabaseClient } from "@supabase/supabase-js";

export interface ActivityEvent {
  date: string;
  label: string;
}

/**
 * STU-DASH-02 / STU-ADMIN-01 : "journal d'activité simple" — aucune table
 * de log dédiée n'existe dans le schéma réel (constaté dès l'historique
 * client, STU-CLIENT-02) ; agrège les événements déjà réellement horodatés
 * (publications, overrides manuels, entretiens réalisés) plutôt que d'en
 * inventer une. Source unique, réutilisée par le tableau de bord ET
 * l'administration — jamais deux implémentations du même flux.
 */
export async function getRecentActivity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  limit: number,
): Promise<ActivityEvent[]> {
  const [{ data: recentPublications }, { data: recentOverrides }, { data: recentInterviewsDone }] =
    await Promise.all([
      supabase
        .from("sheet_versions")
        .select("id, master_sheet_id, version, published_at, master_sheets(title)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit),
      supabase
        .from("company_sheet_overrides")
        .select("action, created_at, companies(company_name), master_sheets(title)")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("company_interviews")
        .select("completed_at, companies(company_name)")
        .eq("status", "done")
        .order("completed_at", { ascending: false })
        .limit(limit),
    ]);

  return [
    ...(recentPublications ?? []).map((p) => ({
      date: p.published_at as string,
      label: `Publication — ${(p.master_sheets as unknown as { title: string } | null)?.title ?? "?"} (v${p.version})`,
    })),
    ...(recentOverrides ?? []).map((o) => ({
      date: o.created_at as string,
      label: `${o.action === "add" ? "Ajout manuel" : "Retrait manuel"} — ${(o.companies as unknown as { company_name: string } | null)?.company_name ?? "?"} · ${(o.master_sheets as unknown as { title: string } | null)?.title ?? "?"}`,
    })),
    ...(recentInterviewsDone ?? []).map((i) => ({
      date: i.completed_at as string,
      label: `Entretien réalisé — ${(i.companies as unknown as { company_name: string } | null)?.company_name ?? "?"}`,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}
