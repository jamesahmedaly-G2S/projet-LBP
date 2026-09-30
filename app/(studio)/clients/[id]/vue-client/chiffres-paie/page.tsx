import { requireAdmin } from "@/lib/auth/session";
import ChiffresPaieContent from "@/app/(client)/chiffres-paie/ChiffresPaieContent";

export default async function VueClientChiffresPaiePage() {
  await requireAdmin();
  return <ChiffresPaieContent />;
}
