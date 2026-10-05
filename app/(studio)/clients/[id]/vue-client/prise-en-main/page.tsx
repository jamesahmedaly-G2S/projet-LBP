import { requireAdmin } from "@/lib/auth/session";
import PriseEnMainContent from "@/app/(client)/prise-en-main/PriseEnMainContent";

export default async function VueClientPriseEnMainPage() {
  await requireAdmin();
  return <PriseEnMainContent />;
}
