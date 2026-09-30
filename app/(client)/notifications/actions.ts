"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(id: string): Promise<void> {
  await requireClient();
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("id", id);
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead(): Promise<void> {
  await requireClient();
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("read", false);
  revalidatePath("/notifications");
}
