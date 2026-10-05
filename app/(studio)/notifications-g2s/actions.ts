"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// LBP-CLIENT-11 (finitions, 30/09/2026) : pendant Studio de
// app/(client)/notifications/actions.ts, mais filtré explicitement sur
// `audience='admin'` -- sans ce filtre, un admin (qui voit tout via
// `is_admin()` dans la RLS) marquerait comme lues les notifications de
// TOUTES les sociétés clientes en cliquant "Tout marquer comme lu", pas
// seulement les siennes. Jamais compté sur la seule RLS ici.
export async function markAdminNotificationRead(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("id", id).eq("audience", "admin");
  revalidatePath("/notifications-g2s");
}

export async function markAllAdminNotificationsRead(): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("audience", "admin")
    .eq("read", false);
  revalidatePath("/notifications-g2s");
}
