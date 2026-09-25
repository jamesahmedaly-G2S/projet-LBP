import { requireAdmin } from "@/lib/auth/session";
import { Card } from "@/ui-kit/Card";
import NewMonitoringForm from "./NewMonitoringForm";

export default async function NouvelleVeillePage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Nouvelle entrée de veille</h1>
      <Card>
        <NewMonitoringForm />
      </Card>
    </main>
  );
}
