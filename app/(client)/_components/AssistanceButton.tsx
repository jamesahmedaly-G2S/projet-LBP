"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { getRootQuestion, chooseOption } from "./chatbot-actions";
import type { ChatbotQuestion, ChatbotOption } from "@/lib/client/chatbot";

// LBP-CLIENT-13 : "Assistance" [§1.14, p.13 : "widget de chat"] --
// bouton flottant déjà présent sur toutes les pages (`.chat-fab` du
// prototype). Bulle ronde compacte (pas la pilule large du prototype,
// signalé par l'utilisateur comme recouvrant parfois un vrai bouton
// d'action), masquée pendant un défilement actif vers le bas (pattern
// standard des widgets de chat, pas une fidélité du prototype).
//
// Correctif (06/10/2026), suite à la demande explicite de l'utilisateur
// d'un chatbot à arbre de décision (question -> choix -> question
// affinée ou solution, remontée vers n8n si aucun choix ne convient) :
// le panneau affichait jusqu'ici un message statique "pas encore
// disponible" -- remplacé par le vrai moteur (`chatbot-actions.ts`),
// piloté par l'arbre configuré depuis l'administration G2S
// (`/administration/chatbot`). Si aucune question racine n'est
// configurée (arbre vide), le panneau garde ce même message honnête --
// jamais un faux chat qui ne répondrait à rien.
type ChatState =
  | { phase: "loading" }
  | { phase: "no_bot" }
  | {
      phase: "question";
      conversationId: string | null;
      question: ChatbotQuestion;
      options: ChatbotOption[];
    }
  | { phase: "solution"; text: string }
  | { phase: "escalated" }
  | { phase: "quota_exceeded" }
  | { phase: "error"; message: string };

export default function AssistanceButton() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [chat, setChat] = useState<ChatState>({ phase: "loading" });
  const [pending, setPending] = useState(false);

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

  async function startConversation() {
    setChat({ phase: "loading" });
    const root = await getRootQuestion();
    if (!root) {
      setChat({ phase: "no_bot" });
      return;
    }
    setChat({
      phase: "question",
      conversationId: null,
      question: root.question,
      options: root.options,
    });
  }

  function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && chat.phase === "loading") startConversation();
  }

  async function handleOptionClick(
    question: ChatbotQuestion,
    option: ChatbotOption,
    conversationId: string | null,
  ) {
    setPending(true);
    const result = await chooseOption({
      conversationId,
      questionPrompt: question.prompt,
      optionId: option.id,
      optionLabel: option.label,
    });
    setPending(false);

    if (result.status === "next_question") {
      setChat({
        phase: "question",
        conversationId: result.conversationId,
        question: result.question,
        options: result.options,
      });
    } else if (result.status === "solution") {
      setChat({ phase: "solution", text: result.text });
    } else if (result.status === "escalated") {
      setChat({ phase: "escalated" });
    } else if (result.status === "quota_exceeded") {
      setChat({ phase: "quota_exceeded" });
    } else {
      setChat({ phase: "error", message: result.message });
    }
  }

  return (
    <>
      {open && (
        <div className="fixed right-4 bottom-[4.75rem] z-[91] flex max-h-[70vh] w-80 flex-col rounded-xl border border-border bg-surface p-4 shadow-xl">
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

          <div className="mt-3 overflow-y-auto">
            {chat.phase === "loading" && <p className="text-sm text-muted">Chargement…</p>}

            {chat.phase === "no_bot" && (
              <>
                <p className="text-sm text-muted">
                  Le chat d&apos;assistance n&apos;est pas encore configuré dans cette version.
                </p>
                <p className="mt-2 text-sm text-muted">
                  Pour une question, contactez votre référent G2S directement par e-mail.
                </p>
              </>
            )}

            {chat.phase === "question" && (
              <>
                <p className="text-sm text-ink">{chat.question.prompt}</p>
                <div className="mt-3 flex flex-col gap-2">
                  {chat.options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      disabled={pending}
                      onClick={() => handleOptionClick(chat.question, o, chat.conversationId)}
                      className="rounded-md border border-border px-3 py-1.5 text-left text-sm text-ink hover:border-primary hover:bg-primary-soft disabled:opacity-50"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {chat.phase === "solution" && (
              <>
                <p className="text-sm whitespace-pre-wrap text-ink">{chat.text}</p>
                <button
                  type="button"
                  onClick={startConversation}
                  className="mt-3 text-xs font-medium text-primary hover:underline"
                >
                  ← Poser une autre question
                </button>
              </>
            )}

            {chat.phase === "escalated" && (
              <>
                <p className="text-sm text-ink">
                  Votre demande a été transmise à un conseiller G2S, qui reviendra vers vous
                  rapidement.
                </p>
                <button
                  type="button"
                  onClick={startConversation}
                  className="mt-3 text-xs font-medium text-primary hover:underline"
                >
                  ← Poser une autre question
                </button>
              </>
            )}

            {chat.phase === "quota_exceeded" && (
              <p className="text-sm text-muted">
                Vous avez atteint le nombre de questions incluses dans votre offre ce mois-ci.
                Contactez votre référent G2S pour en savoir plus.
              </p>
            )}

            {chat.phase === "error" && <p className="text-sm text-danger">{chat.message}</p>}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={handleOpen}
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
