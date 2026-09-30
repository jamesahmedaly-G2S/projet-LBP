"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function initials(fullName: string | null): string {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

// LBP Client (finitions design, 30/09/2026) : avatar avec initiales +
// nom, pendant de `.client-btn` dans le vrai header (LBP_V9.9_Studio.html,
// `av` = carbone, initiales). Un "use client" qui va chercher la session
// via /api/profiles/me (route déjà réelle, jamais consommée avant ce
// composant) plutôt qu'un appel direct dans app/(client)/layout.tsx : ce
// layout ne vérifie délibérément aucune session (voir son commentaire) --
// un boundary error.tsx ne peut pas rattraper une erreur levée par le
// layout de son propre segment, même limite déjà rencontrée côté Studio
// pour notifications-g2s. Un échec de fetch ici reste silencieux (juste
// pas d'avatar), jamais une page cassée.
export default function AccountBadge() {
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profiles/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.profile?.full_name) setFullName(data.profile.full_name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link
      href="/mon-compte"
      className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 py-1 pl-3 pr-1 text-white transition-colors hover:bg-white/20"
    >
      <span className="text-right leading-tight">
        <span className="block text-xs font-bold">{fullName ?? "Mon compte"}</span>
        <span className="block text-[10px] text-white/75">Mode client</span>
      </span>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-extrabold text-white">
        {initials(fullName)}
      </span>
    </Link>
  );
}
