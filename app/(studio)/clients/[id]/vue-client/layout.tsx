import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// STU-CLIENT-04 : bandeau persistant "MODE VISUALISATION CLIENT" — visible
// sur TOUTES les pages sous /clients/[id]/vue-client, sans exception
// (critère d'acceptation explicite, §5.3). Ce mode reste réservé à
// l'admin (requireAdmin) : il n'accorde jamais de droit d'écriture
// supplémentaire, uniquement une lecture filtrée exactement comme un vrai
// profil client la verrait (lib/studio/client-view.ts).
export default async function VueClientLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("company_name")
    .eq("id", id)
    .single();

  if (!company) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 bg-studio-amber px-6 py-2.5 text-sm font-medium text-white">
        <span>
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-white align-middle" />
          MODE VISUALISATION CLIENT — Vous consultez actuellement le LBP de{" "}
          <strong>{company.company_name}</strong>
        </span>
        <Link
          href={`/clients/${id}`}
          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-studio-navy hover:bg-studio-bg"
        >
          Retour au LBP Studio
        </Link>
      </div>
      {children}
    </div>
  );
}
