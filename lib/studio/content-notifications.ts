import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * STU-WORKFLOW-07 : mécanisme de notification-à-la-publication partagé,
 * trouvé manquant sur Chiffres Paie/Dictionnaire/Offres en auditant
 * LBP_V9.9_Studio.html (`stContenus()`/`openPublish()` — "Une définition
 * a été ajoutée...", "Notre offre X évolue..."). `notifications` est une
 * vraie table du schéma de James (baseline_schema_reel.sql §9.5, RLS déjà
 * réelle `is_admin() or company_id = current_company_id() or profile_id
 * = auth.uid()`), jamais consommée par aucun écran avant ce ticket.
 *
 * Ces contenus (chiffres/dictionnaire/offres) sont globaux, pas propres à
 * une société -- `notifications.company_id` est nullable mais la RLS
 * n'a pas de notion de diffusion large (un company_id/profile_id NULL
 * des deux côtés ne matcherait la RLS pour personne). Une ligne par
 * société réelle est donc insérée plutôt qu'une seule ligne globale
 * invisible.
 */
export interface ContentPublicationNotice {
  kind: string;
  title: string;
  detail?: string | null;
}

export async function notifyAllClients(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  notice: ContentPublicationNotice,
): Promise<void> {
  const { data: companies } = await supabase.from("companies").select("id");
  if (!companies || companies.length === 0) return;

  const { error } = await supabase.from("notifications").insert(
    companies.map((c: { id: string }) => ({
      company_id: c.id,
      profile_id: null,
      audience: "client",
      kind: notice.kind,
      title: notice.title,
      detail: notice.detail ?? null,
    })),
  );
  // Ne bloque jamais l'action principale (le contenu est déjà enregistré) --
  // journalisé pour rester visible plutôt que silencieusement perdu.
  if (error) console.error("notifyAllClients: échec insertion notifications", error);
}
