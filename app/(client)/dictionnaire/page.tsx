import { requireClient } from "@/lib/auth/session";
import DictionnaireContent from "./DictionnaireContent";

// LBP-CLIENT-14 : "Dictionnaire" — module réel du prototype. Contenu
// extrait dans DictionnaireContent.tsx (aucune dépendance de session)
// pour être réutilisé tel quel par la prévisualisation admin
// (STU-CLIENT-04 étendu).
export default async function DictionnairePage() {
  await requireClient();
  return <DictionnaireContent />;
}
