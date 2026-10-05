import { requireClient } from "@/lib/auth/session";
import ChiffresPaieContent from "./ChiffresPaieContent";

// LBP-CLIENT-05 : "Chiffres Paie" [§1.6, p.11]. Vérifié contre le vrai
// code du prototype (LBP_V6_Studio.html, renderChiffres(), lignes
// 3141-3165) avant de construire. Contenu extrait dans
// ChiffresPaieContent.tsx (aucune dépendance de session) pour être
// réutilisé tel quel par la prévisualisation admin (STU-CLIENT-04 étendu).
export default async function ChiffresPaiePage() {
  await requireClient();
  return <ChiffresPaieContent />;
}
