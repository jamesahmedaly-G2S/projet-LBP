"use client";

import { usePathname, useRouter } from "next/navigation";

// `#backBar` du prototype (LBP_V9.9_Studio.html ~L2563) : bouton
// « ← Retour » `.btn-line` (pilule, filet framboise, 12.5px/700, padding
// 9px 18px) affiché au-dessus de chaque vue sauf l'Accueil, marge basse
// 14px. Le prototype dépile son propre historique de vues ; ici, l'historique
// du navigateur (repli sur l'Accueil quand la page a été ouverte directement).
export default function BackBar() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/accueil") return null;

  return (
    <div className="mx-auto -mb-2.5 flex max-w-[1240px] px-[30px] pt-6">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/accueil"))}
        className="flex items-center gap-[7px] rounded-full border border-primary bg-white px-[18px] py-[9px] text-[12.5px] leading-[1.35] font-bold text-primary transition-colors hover:bg-primary hover:text-white"
      >
        ← Retour
      </button>
    </div>
  );
}
