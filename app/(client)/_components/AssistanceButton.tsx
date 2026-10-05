"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";

// LBP-CLIENT-13 : "Assistance" [§1.14, p.13 : "widget de chat"] --
// toujours bloqué faute de service tiers choisi (chat en direct ou IA),
// même prudence que PISTE/Brevo/Anthropic ailleurs dans ce projet : jamais
// simulé. Ce bouton est la partie visuelle seule (présente sur toutes les
// pages dans le vrai prototype, `.chat-fab`, LBP_V9.9_Studio.html) --
// cliquer ouvre un état honnête plutôt qu'un faux chat qui ne répondrait
// jamais. Le vrai branchement (`toggleChat()`/`sendChat()` du prototype)
// reste à faire une fois qu'un service réel est choisi et ses identifiants
// fournis.
//
// Bulle ronde compacte (icône seule), pas la pilule large "Assistance" du
// prototype -- signalé par l'utilisateur : sur certaines pages, une pilule
// de ~130px de large en bas à droite pouvait recouvrir un vrai bouton
// d'action ou une info de contenu (ex. "Voir le détail de mon offre →",
// tableaux Chiffres Paie). Une bulle ~52px réduit nettement l'emprise,
// mais sur mobile (contenu pleine largeur, pas de marge vide à droite
// comme en desktop) un chevauchement avec une ligne de texte en cours de
// défilement reste possible -- vérifié en réel sur /offres. Corrigé en
// masquant la bulle pendant un défilement actif vers le bas (l'utilisateur
// est en train de lire, la bulle gênerait) et en la réaffichant dès l'arrêt
// du défilement ou une remontée -- pattern standard des widgets de chat
// (Intercom, Crisp...), pas une fidélité du prototype à porter.
export default function AssistanceButton() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const lastY = { current: window.scrollY };
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const goingDown = y > lastY.current + 4;
        const goingUp = y < lastY.current - 4;
        if (goingDown && y > 80) {
          setVisible(false);
        } else if (goingUp || y <= 80) {
          setVisible(true);
        }
        lastY.current = y;
        ticking = false;
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => setVisible(true), 600);
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {open && (
        <div className="fixed right-4 bottom-[4.75rem] z-[91] w-72 rounded-xl border border-border bg-surface p-4 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-ink">Assistance</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="text-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">
            Le chat d&apos;assistance n&apos;est pas encore disponible dans cette version.
          </p>
          <p className="mt-2 text-sm text-muted">
            Pour une question, contactez votre référent G2S directement par e-mail.
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Ouvrir l'assistance"
        title="Assistance"
        className={`fixed right-4 bottom-4 z-[90] grid h-[52px] w-[52px] place-items-center rounded-full bg-primary text-white shadow-[0_14px_32px_-10px_rgba(103,6,38,0.75)] transition-all duration-200 hover:bg-primary-hover ${
          visible || open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-20 opacity-0"
        }`}
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </>
  );
}
