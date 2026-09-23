import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withRole } from "@/lib/auth/with-role";

// Reserve a admin (= "editor/admin" du cahier des charges, role unique --
// voir docs/adr/0004-modele-de-roles-a-2-valeurs.md).
export const GET = withRole(["admin"], async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, company_id, full_name, has_onboarding_tour");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profiles: data });
});
