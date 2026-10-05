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
//
// Écart assumé (vérifié 03/10/2026) : le prototype n'a pas de page dédiée
// pour les notifications côté client -- seulement un panneau déroulant
// (`#notifPanel`/`updateBell()`, LBP_V9.9_Studio.html) ouvert depuis la
// cloche de l'en-tête. Une vraie page (`/notifications`) est délibérément
// préférée ici : plus robuste (lien direct, pas de contenu perdu à la
// fermeture du panneau), cohérent avec "Mon compte" qui est aussi une
// vraie page dans le prototype -- pas une tentative manquée de porter le
// panneau.
export default async function NotificationsPage() {
  await requireClient();
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, kind, title, detail, read, created_at")
    .order("created_at", { ascending: false })
    .returns<NotificationRow[]>();

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>Mon espace</Eyebrow>
      <SectionTitle>Notifications</SectionTitle>

      <NotificationsList notifications={notifications ?? []} />
    </main>
  );
}
