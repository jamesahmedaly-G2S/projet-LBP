"use client";

import { usePathname } from "next/navigation";
import { PAGE_BACKGROUNDS } from "@/lib/client/page-backgrounds";

// Rendu en `position:fixed` (plutôt que `background-attachment:fixed` sur
// <body>, comme le fait le prototype) : équivalent visuel, mais évite le
// bug classique de Safari iOS où `background-attachment:fixed` est
// silencieusement ignoré -- pas besoin du fallback mobile à
// `background-attachment:scroll` que le prototype doit ajouter pour ça.
//
// Rendu systématiquement (même sans image pour la page courante) et porte
// la couleur de fond de base (`--color-page-bg`) habituellement posée sur
// le wrapper `.theme-client` : un `bg-page-bg` opaque sur ce wrapper
// recouvrait ce composant (élément `fixed` sans contexte d'empilement
// propre à son parent -> hissé dans le contexte racine, où un z-index
// négatif passe sous le fond -- même non positionné -- du wrapper),
// constaté en testant en réel sur /accueil (image invisible).
export default function PageBackdrop() {
  const pathname = usePathname();
  const bg = PAGE_BACKGROUNDS[pathname];

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10"
      style={{
        backgroundImage: bg
          ? `linear-gradient(rgba(250,249,247,${bg.veil}), rgba(250,249,247,${bg.veil})), url(${bg.src})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "var(--color-page-bg)",
      }}
    />
  );
}
