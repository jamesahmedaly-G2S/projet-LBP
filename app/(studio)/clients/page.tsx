import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";

// Liste minimale — juste de quoi naviguer vers une société sans connaître
// son UUID. Le code couleur par échéance d'entretien (§5.1 du dossier)
// reste à faire en STU-CLIENT-03 : rien ici ne l'anticipe.
export default async function ClientsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: companies } = await supabase
    .from("companies")
    .select("id, company_name, offer_tier")
    .order("company_name");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Clients</h1>

      <Card padded={false}>
        <ul className="divide-y divide-zinc-100">
          {(companies ?? []).map((company) => (
            <li key={company.id}>
              <Link
                href={`/clients/${company.id}`}
                className="flex items-center justify-between px-5 py-3 text-sm hover:bg-zinc-50"
              >
                <span className="text-zinc-800">{company.company_name}</span>
                <Badge tone="blue">Palier {company.offer_tier}</Badge>
              </Link>
            </li>
          ))}
          {(companies ?? []).length === 0 && (
            <li className="px-5 py-3 text-sm text-zinc-400">Aucune société.</li>
          )}
        </ul>
      </Card>
    </main>
  );
}
