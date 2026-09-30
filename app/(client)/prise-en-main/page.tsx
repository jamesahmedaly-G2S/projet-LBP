import { requireClient } from "@/lib/auth/session";
import PriseEnMainContent from "./PriseEnMainContent";

// LBP-CLIENT-09 : "Prise en main" [§1.10, p.12]. Contenu extrait dans
// PriseEnMainContent.tsx (aucune dépendance de session) pour être
// réutilisé tel quel par la prévisualisation admin (STU-CLIENT-04 étendu).
export default async function PriseEnMainPage() {
  await requireClient();
  return <PriseEnMainContent />;
}
