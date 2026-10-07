"use server";

import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { optionOutcome, type ChatbotQuestion, type ChatbotOption } from "@/lib/client/chatbot";

// LBP-CLIENT-13 : moteur du chatbot à arbre de décision --
// "AssistanceButton.tsx" ne fait qu'afficher, toute la logique (quota,
// journalisation, escalade) vit ici.
//
// Réutilise `chat_conversations`/`chat_messages`/`check_and_increment_chat_quota()`
// (schéma réel de James, section 10 "AI CHATBOT", jamais consommé par
// aucun écran avant ce correctif) : chaque question posée est journalisée
// en `role='assistant'`, chaque choix de l'utilisateur en `role='user'`
// -- un "tour" dans l'arbre consomme un message de quota comme n'importe
// quel message de chat conversationnel, le plafond mensuel par palier
// d'offre (`offer_tiers.max_messages_per_month`) s'applique donc déjà
// sans code supplémentaire.

const OPTION_COLUMNS =
  "id, question_id, label, sort_order, next_question_id, solution_text, is_escalation";
const QUESTION_COLUMNS = "id, prompt, is_root";

export interface QuestionState {
  question: ChatbotQuestion;
  options: ChatbotOption[];
}

export async function getRootQuestion(): Promise<QuestionState | null> {
  const supabase = await createClient();
  const { data: question } = await supabase
    .from("chatbot_questions")
    .select(QUESTION_COLUMNS)
    .eq("is_root", true)
    .maybeSingle<ChatbotQuestion>();
  if (!question) return null;

  const { data: options } = await supabase
    .from("chatbot_options")
    .select(OPTION_COLUMNS)
    .eq("question_id", question.id)
    .order("sort_order")
    .returns<ChatbotOption[]>();

  return { question, options: options ?? [] };
}

export type ChooseOptionResult =
  | { status: "quota_exceeded" }
  | {
      status: "next_question";
      conversationId: string;
      question: ChatbotQuestion;
      options: ChatbotOption[];
    }
  | { status: "solution"; conversationId: string; text: string }
  | { status: "escalated"; conversationId: string }
  | { status: "error"; message: string };

export async function chooseOption(input: {
  conversationId: string | null;
  questionPrompt: string;
  optionId: string;
  optionLabel: string;
}): Promise<ChooseOptionResult> {
  const session = await requireClient();
  const supabase = await createClient();

  const { data: quotaOk } = await supabase.rpc("check_and_increment_chat_quota", {
    p_profile_id: session.userId,
  });
  if (!quotaOk) return { status: "quota_exceeded" };

  let conversationId = input.conversationId;
  if (!conversationId) {
    const { data: conversation, error: convError } = await supabase
      .from("chat_conversations")
      .insert({
        profile_id: session.userId,
        company_id: session.profile.company_id,
        title: input.questionPrompt.slice(0, 80),
      })
      .select("id")
      .single();
    if (convError || !conversation) {
      return { status: "error", message: "Impossible de démarrer la conversation." };
    }
    conversationId = conversation.id;
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: input.questionPrompt,
    });
  }
  // `conversationId` est garanti non nul ici (branche ci-dessus passée ou
  // déjà fourni par l'appelant) -- ce garde redondant sert uniquement à
  // faire disparaître le type `string | null` pour TypeScript.
  if (!conversationId) {
    return { status: "error", message: "Conversation introuvable." };
  }

  await supabase
    .from("chat_messages")
    .insert({ conversation_id: conversationId, role: "user", content: input.optionLabel });

  const { data: option } = await supabase
    .from("chatbot_options")
    .select(OPTION_COLUMNS)
    .eq("id", input.optionId)
    .single<ChatbotOption>();
  if (!option) return { status: "error", message: "Ce choix n'existe plus." };

  const outcome = optionOutcome(option);

  if (outcome.kind === "next_question") {
    const { data: nextQuestion } = await supabase
      .from("chatbot_questions")
      .select(QUESTION_COLUMNS)
      .eq("id", outcome.questionId)
      .single<ChatbotQuestion>();
    if (!nextQuestion) return { status: "error", message: "La question suivante n'existe plus." };

    const { data: nextOptions } = await supabase
      .from("chatbot_options")
      .select(OPTION_COLUMNS)
      .eq("question_id", nextQuestion.id)
      .order("sort_order")
      .returns<ChatbotOption[]>();

    await supabase
      .from("chat_messages")
      .insert({ conversation_id: conversationId, role: "assistant", content: nextQuestion.prompt });

    return {
      status: "next_question",
      conversationId,
      question: nextQuestion,
      options: nextOptions ?? [],
    };
  }

  if (outcome.kind === "solution") {
    await supabase
      .from("chat_messages")
      .insert({ conversation_id: conversationId, role: "assistant", content: outcome.text });
    return { status: "solution", conversationId, text: outcome.text };
  }

  // Escalade : "dans le cas où le choix est impossible... l'app va faire
  // appel à un lien n8n qui va déclencher le trigger de mon automatisation
  // n8n" -- l'automatisation elle-même n'est jamais construite ici,
  // seulement l'appel HTTP qui la déclenche.
  await triggerN8nEscalation({
    conversationId,
    profileId: session.userId,
    companyId: session.profile.company_id,
  });
  const escalationMessage =
    "Votre demande a été transmise à un conseiller G2S, qui reviendra vers vous rapidement.";
  await supabase
    .from("chat_messages")
    .insert({ conversation_id: conversationId, role: "assistant", content: escalationMessage });
  return { status: "escalated", conversationId };
}

async function triggerN8nEscalation(payload: {
  conversationId: string;
  profileId: string;
  companyId: string | null;
}): Promise<void> {
  const webhookUrl = process.env.N8N_CHATBOT_WEBHOOK_URL;
  if (!webhookUrl) {
    // Même prudence que Brevo/PISTE ailleurs dans ce projet : jamais
    // simulé. Tant que l'URL réelle n'est pas fournie, l'escalade reste
    // journalisée (chat_messages) mais n'appelle personne.
    console.warn(
      "N8N_CHATBOT_WEBHOOK_URL absente -- escalade journalisée mais pas transmise à n8n.",
    );
    return;
  }
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: payload.conversationId,
        profile_id: payload.profileId,
        company_id: payload.companyId,
      }),
    });
  } catch (err) {
    console.error("Échec de l'appel du webhook n8n :", err);
  }
}
