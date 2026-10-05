"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";

// LBP Client (Mon entreprise, 04/10/2026) : le vrai prototype édite
// l'identité/la paie/les outils via un modal (`#identEditor`/
// `#paieEditor`/`#outilsEditor`, `pe-modal`) ouvert par un bouton crayon
// sur une carte d'affichage compacte -- jamais un formulaire en
// permanence déployé dans la carte (ce qui en gonflait la hauteur,
// signalé par l'utilisateur comme "la longueur à l'intérieur ça ne
// match pas"). Portail vers document.body, même raison que
// MobileNav.tsx : ce composant est souvent un enfant d'une Card dans un
// contexte d'empilement propre (`sticky`/`relative`), un portail évite
// tout z-index ambigu.
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-sans text-lg font-extrabold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1 text-muted hover:bg-surface"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
