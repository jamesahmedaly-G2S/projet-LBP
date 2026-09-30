import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";
import NotificationsList, { type NotificationRow } from "./NotificationsList";

// LBP-CLIENT-11 (partiel) : boucle de STU-WORKFLOW-07 -- les notifications
// créées par les écrans admin (Chiffres Paie/Dictionnaire/Offres) doivent
// être visibles quelque part côté client, sinon la fonctionnalité est
// invérifiable. `notifications` (table réelle de James, RLS déjà réelle)
// jamais consommée par aucun écran avant ce ticket.
export default async function NotificationsPage() {
  await requireClient();
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, kind, title, detail, read, created_at")
    .order("created_at", { ascending: false })
    .returns<NotificationRow[]>();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Eyebrow>Mon espace</Eyebrow>
      <SectionTitle>Notifications</SectionTitle>

      <NotificationsList notifications={notifications ?? []} />
    </main>
  );
}
