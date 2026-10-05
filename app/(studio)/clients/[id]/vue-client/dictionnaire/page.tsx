import { requireAdmin } from "@/lib/auth/session";
import DictionnaireContent from "@/app/(client)/dictionnaire/DictionnaireContent";

export default async function VueClientDictionnairePage() {
  await requireAdmin();
  return <DictionnaireContent />;
}
