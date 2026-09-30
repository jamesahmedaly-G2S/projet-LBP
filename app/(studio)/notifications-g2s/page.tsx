import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import NotificationsList, { type AdminNotificationRow } from "./NotificationsList";

// LBP-CLIENT-11 (finitions, 30/09/2026) : "deux audiences" [§1.12, p.13] --
// pendant Studio de app/(client)/notifications/, audience='admin' cette
// fois. Route volontairement hors des 10 sections de StudioNav.tsx (§3 du
// dossier, découpage figé) : accessible depuis la cloche de l'en-tête,
// même principe que le lien "LBP Client" déjà hors nav. Filtre explicite
// sur `audience='admin'` -- is_admin() dans la RLS laisserait sinon
// remonter aussi toutes les notifications clientes de toutes les sociétés.
export default async function AdminNotificationsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, kind, title, detail, read, created_at")
    .eq("audience", "admin")
    .order("created_at", { ascending: false })
    .returns<AdminNotificationRow[]>();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-studio-navy">Notifications</h1>
      <p className="mt-1 text-sm text-studio-muted">
        Ce qui vous concerne en tant qu&apos;équipe G2S — aujourd&apos;hui, essentiellement les
        détections de la veille réglementaire.
      </p>

      <div className="mt-6">
        <NotificationsList notifications={notifications ?? []} />
      </div>
    </main>
  );
}
