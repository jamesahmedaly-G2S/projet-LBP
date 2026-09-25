import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";
import { AffectationList } from "../_components/AffectationList";
import { getCompanyAffectations } from "@/lib/studio/affectations";

// STU-AFFECT-04 : vue transverse des affectations. Réutilise exactement la
// même source (getCompanyAffectations -> company_sheet_affectations) et le
// même composant d'affichage que la fiche client (STU-AFFECT-02/03), pour
// qu'il ne puisse pas y avoir de divergence entre les deux écrans. Lecture
// seule ici volontairement : l'ajout/retrait manuel reste une action de la
// fiche client, pour ne pas avoir deux endroits qui modifient la même
// donnée sans être synchronisés.
export default async function AffectationsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  await requireAdmin();
  const { company: selectedId } = await searchParams;
  const supabase = await createClient();

  const { data: companies } = await supabase
    .from("companies")
    .select("id, company_name, offer_tier")
    .order("company_name");

  const list = companies ?? [];
  const selected = list.find((c) => c.id === selectedId) ?? list[0] ?? null;
  const affectations = selected ? await getCompanyAffectations(supabase, selected.id) : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Affectations</h1>

      <div className="flex flex-col gap-6 md:flex-row">
        <Card padded={false} className="w-full shrink-0 self-start md:w-64">
          <ul className="divide-y divide-zinc-100">
            {list.map((company) => {
              const isActive = company.id === selected?.id;
              return (
                <li key={company.id}>
                  <Link
                    href={`/affectations?company=${company.id}`}
                    className={`flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-50 ${
                      isActive ? "bg-blue-50 font-medium text-blue-800" : "text-zinc-800"
                    }`}
                  >
                    <span>{company.company_name}</span>
                    <Badge tone="blue">Palier {company.offer_tier}</Badge>
                  </Link>
                </li>
              );
            })}
            {list.length === 0 && (
              <li className="px-4 py-3 text-sm text-zinc-400">Aucune société.</li>
            )}
          </ul>
        </Card>

        <Card className="flex-1">
          {selected ? (
            <>
              <h2 className="mb-3 text-lg font-semibold text-zinc-800">
                {selected.company_name} — pourquoi ces fiches sont présentes
              </h2>
              <AffectationList affectations={affectations} />
            </>
          ) : (
            <p className="text-sm text-zinc-400">Aucune société à afficher.</p>
          )}
        </Card>
      </div>
    </main>
  );
}
