import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// Studio header "LBP Client" (LBP_V9.9_Studio.html L.6619, closeStudio())
// : dans le prototype, bascule directement vers l'appli client complète,
// sans étape de sélection ("profile" est une persona fixe, jamais un
// choix par société -- vérifié dans le vrai code avant de construire).
// Chez nous, chaque page client réelle est propre à une société (RLS
// réelle, pas de session "générique") -- ce redirect choisit la société
// la plus récemment créée comme équivalent le plus proche d'un "profil
// par défaut", pour arriver directement dans la vraie prévisualisation
// (STU-CLIENT-04 étendu) sans étape intermédiaire, comme demandé.
export default async function LbpClientRedirectPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  redirect(company ? `/clients/${company.id}/vue-client/accueil` : "/clients");
}
