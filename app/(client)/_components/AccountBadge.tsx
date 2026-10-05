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
//
// Correctif (03/10/2026), suite à un retour de l'utilisateur ("ça ne
// correspond pas avec la v9 en terme de contenu mais aussi en terme de
// fond") : revérifié contre le vrai code (`updateClientBtn()`,
// LBP_V9.9_Studio.html ~L2829-2837, et `.client-btn`, ~L90-95) --
// - Texte réel : `cbRole.textContent='Mode client · lecture'`, pas "Mode
//   client" seul (incomplet, deviné de mémoire plutôt que vérifié).
// - Fond réel : `.client-btn{background:var(--card)}` -- un fond **blanc
//   plein**, délibérément distinct des autres boutons translucides de ce
//   même bandeau (cloche, déconnexion) -- pas `bg-white/10`, qui le
//   confondait avec eux. Texte en `--ink`/`--grey` sur ce fond clair, pas
//   en blanc. Dimensions (padding/gap/taille avatar) également calées sur
//   les vraies valeurs CSS.
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
      className="flex items-center gap-[10px] rounded-full border border-border bg-white py-[7px] pr-2 pl-[14px] transition-colors hover:bg-page-bg"
    >
      <span className="text-right leading-tight">
        <span className="block text-[12.5px] font-bold text-ink">{fullName ?? "Mon compte"}</span>
        <span className="block text-[10px] text-muted">Mode client · lecture</span>
      </span>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-extrabold text-white">
        {initials(fullName)}
      </span>
    </Link>
  );
}
