"use client";

import { useState } from "react";
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
export default function AssistanceButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed right-5 bottom-24 z-[91] w-72 rounded-xl border border-border bg-surface p-4 shadow-xl">
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
        className="fixed right-5 bottom-6 z-[90] flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_14px_32px_-10px_rgba(103,6,38,0.75)] transition-colors hover:bg-primary-hover"
      >
        <MessageCircle className="h-[18px] w-[18px]" />
        Assistance
      </button>
    </>
  );
}
