import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// STU-CLIENT-04 (étendu 30/09/2026) : bandeau persistant "MODE
// VISUALISATION CLIENT" — visible sur TOUTES les pages sous
// /clients/[id]/vue-client, sans exception (critère d'acceptation
// explicite, §5.3). Ce mode reste réservé à l'admin (requireAdmin) : il
// n'accorde jamais de droit d'écriture supplémentaire, uniquement une
// lecture filtrée exactement comme un vrai profil client la verrait
// (lib/studio/client-view.ts).
//
// Étendu de "Bibliothèque seule" à la vraie appli client complète (sauf
// "Mon compte", intrinsèquement personnel à un utilisateur précis, sans
// équivalent au niveau d'une société) -- demande explicite de
// l'utilisateur, vérifiée contre le vrai comportement de
// LBP_V9.9_Studio.html (closeStudio()/setMode('client') : bascule vers
// l'appli client complète, pas un fragment).
const NAV_ITEMS = [
  { href: "/accueil", label: "Accueil" },
  { href: "/mon-entreprise", label: "Mon entreprise" },
  { href: "", label: "La bibliothèque" },
  { href: "/chiffres-paie", label: "Chiffres Paie" },
  { href: "/dictionnaire", label: "Dictionnaire" },
  { href: "/mes-quiz", label: "Quizz" },
  { href: "/offres", label: "Offres" },
  { href: "/prise-en-main", label: "Prise en main" },
];

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

  const base = `/clients/${id}/vue-client`;

  return (
    <div className="theme-client min-h-screen bg-page-bg">
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
      <nav className="flex flex-wrap items-center gap-4 border-b border-border bg-surface px-6 py-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={`${base}${item.href}`}
            className="text-sm font-medium text-muted hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
