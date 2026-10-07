"use client";

import { useActionState, useState, useTransition } from "react";
import { saveQuestion, deleteQuestion, saveOption, deleteOption } from "./actions";
import {
  optionOutcome,
  type ChatbotQuestionWithOptions,
  type ChatbotOption,
} from "@/lib/client/chatbot";
import { TextField, TextAreaField, SelectField, CheckboxField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

// LBP-CLIENT-13 : CRUD admin de l'arbre de décision -- une carte par
// question (prompt + racine + ses options), chaque option résumée par
// son issue (question suivante / solution / escalade n8n). Même pattern
// liste+formulaire inline que CcnManager.tsx/DocumentsManager.tsx.
export default function ChatbotManager({ questions }: { questions: ChatbotQuestionWithOptions[] }) {
  const [editingQuestion, setEditingQuestion] = useState<ChatbotQuestionWithOptions | "new" | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const questionLabel = (id: string) =>
    questions.find((q) => q.id === id)?.prompt.slice(0, 60) ?? "(question supprimée)";

  return (
    <div className="flex flex-col gap-4">
      {questions.length === 0 && (
        <p className="text-sm text-studio-muted">
          Aucune question configurée -- créez d&apos;abord une question racine.
        </p>
      )}

      {questions.map((q) => (
        <div key={q.id} className="rounded-md border border-studio-line p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-studio-navy">
                {q.is_root && (
                  <span className="mr-2 rounded bg-studio-blue/10 px-1.5 py-0.5 text-[11px] font-bold text-studio-blue">
                    RACINE
                  </span>
                )}
                {q.prompt}
              </p>
              <p className="mt-0.5 text-[11px] text-studio-muted">id : {q.id}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                className="text-xs text-studio-blue hover:underline"
                onClick={() => setEditingQuestion(q)}
              >
                Modifier
              </button>
              <button
                type="button"
                className="text-xs text-studio-red hover:underline"
                onClick={() => {
                  if (confirm(`Supprimer la question « ${q.prompt} » ?`)) {
                    startTransition(async () => {
                      setDeleteError(await deleteQuestion(q.id));
                    });
                  }
                }}
              >
                Supprimer
              </button>
            </div>
          </div>

          {editingQuestion !== "new" && editingQuestion?.id === q.id && (
            <QuestionForm item={q} onDone={() => setEditingQuestion(null)} />
          )}

          <ul className="mt-3 flex flex-col gap-1.5 pl-3">
            {q.options.map((o) => (
              <OptionRow
                key={o.id}
                option={o}
                questions={questions}
                questionLabel={questionLabel}
                onDeleted={() => startTransition(() => deleteOption(o.id))}
              />
            ))}
          </ul>

          <OptionAdder questionId={q.id} questions={questions} />
        </div>
      ))}

      {deleteError && <p className="text-xs text-studio-red">{deleteError}</p>}

      {editingQuestion === "new" ? (
        <QuestionForm item={null} onDone={() => setEditingQuestion(null)} />
      ) : (
        <Button type="button" variant="secondary" onClick={() => setEditingQuestion("new")}>
          + Nouvelle question
        </Button>
      )}
    </div>
  );
}

function OptionRow({
  option,
  questions,
  questionLabel,
  onDeleted,
}: {
  option: ChatbotOption;
  questions: ChatbotQuestionWithOptions[];
  questionLabel: (id: string) => string;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const outcome = optionOutcome(option);

  if (editing) {
    return (
      <li>
        <OptionForm
          questionId={option.question_id}
          item={option}
          questions={questions}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 rounded bg-studio-bg px-2 py-1.5 text-xs">
      <span className="text-studio-navy">
        <b>{option.label}</b>{" "}
        {outcome.kind === "next_question" && (
          <span className="text-studio-muted">→ {questionLabel(outcome.questionId)}</span>
        )}
        {outcome.kind === "solution" && (
          <span className="text-studio-muted">✓ Solution : {outcome.text.slice(0, 50)}</span>
        )}
        {outcome.kind === "escalation" && (
          <span className="font-semibold text-studio-red">⚠ Escalade (n8n)</span>
        )}
      </span>
      <span className="flex shrink-0 gap-2">
        <button
          type="button"
          className="text-studio-blue hover:underline"
          onClick={() => setEditing(true)}
        >
          Modifier
        </button>
        <button
          type="button"
          className="text-studio-red hover:underline"
          onClick={() => {
            if (confirm(`Supprimer l'option « ${option.label} » ?`)) onDeleted();
          }}
        >
          Supprimer
        </button>
      </span>
    </li>
  );
}

function OptionAdder({
  questionId,
  questions,
}: {
  questionId: string;
  questions: ChatbotQuestionWithOptions[];
}) {
  const [adding, setAdding] = useState(false);
  if (adding) {
    return (
      <div className="mt-2 pl-3">
        <OptionForm
          questionId={questionId}
          item={null}
          questions={questions}
          onDone={() => setAdding(false)}
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      className="mt-2 ml-3 text-xs text-studio-blue hover:underline"
      onClick={() => setAdding(true)}
    >
      + Ajouter une option
    </button>
  );
}

function QuestionForm({
  item,
  onDone,
}: {
  item: ChatbotQuestionWithOptions | null;
  onDone: () => void;
}) {
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const result = await saveQuestion(prev, fd);
    if (!result) onDone();
    return result;
  }, null);

  return (
    <form
      action={formAction}
      className="mt-2 flex flex-wrap items-end gap-2 rounded border border-studio-line bg-studio-bg p-3"
    >
      {item && <input type="hidden" name="id" value={item.id} />}
      <TextAreaField
        label="Question"
        name="prompt"
        defaultValue={item?.prompt ?? ""}
        required
        rows={2}
        className="w-80"
      />
      <CheckboxField
        label="Question racine (point d'entrée)"
        name="is_root"
        defaultChecked={item?.is_root ?? false}
      />
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "..." : "Enregistrer"}
      </Button>
      <Button type="button" variant="ghost" onClick={onDone}>
        Annuler
      </Button>
      {error && <p className="w-full text-xs text-studio-red">{error}</p>}
    </form>
  );
}

type Outcome = "next_question" | "solution" | "escalation";

function currentOutcome(item: ChatbotOption | null): Outcome {
  if (!item) return "solution";
  if (item.next_question_id) return "next_question";
  if (item.is_escalation) return "escalation";
  return "solution";
}

function OptionForm({
  questionId,
  item,
  questions,
  onDone,
}: {
  questionId: string;
  item: ChatbotOption | null;
  questions: ChatbotQuestionWithOptions[];
  onDone: () => void;
}) {
  const [outcome, setOutcome] = useState<Outcome>(currentOutcome(item));
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const result = await saveOption(prev, fd);
    if (!result) onDone();
    return result;
  }, null);

  const otherQuestions = questions.filter((q) => q.id !== questionId);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-2 rounded border border-studio-line p-3"
    >
      <input type="hidden" name="question_id" value={questionId} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <TextField
        label="Libellé du choix"
        name="label"
        defaultValue={item?.label ?? ""}
        required
        className="w-56"
      />
      <TextField
        label="Ordre"
        name="sort_order"
        type="number"
        defaultValue={item?.sort_order ?? 0}
        className="w-20"
      />
      <SelectField
        label="Résultat"
        name="outcome"
        value={outcome}
        onChange={(e) => setOutcome(e.target.value as Outcome)}
        className="w-56"
      >
        <option value="next_question">Affiner (question suivante)</option>
        <option value="solution">Conclure (texte de solution)</option>
        <option value="escalation">Escalader (webhook n8n)</option>
      </SelectField>

      {outcome === "next_question" && (
        <SelectField
          label="Question suivante"
          name="next_question_id"
          defaultValue={item?.next_question_id ?? ""}
          className="w-72"
        >
          <option value="">— Choisir —</option>
          {otherQuestions.map((q) => (
            <option key={q.id} value={q.id}>
              {q.prompt.slice(0, 70)}
            </option>
          ))}
        </SelectField>
      )}
      {outcome === "solution" && (
        <TextAreaField
          label="Texte de la solution"
          name="solution_text"
          defaultValue={item?.solution_text ?? ""}
          rows={2}
          className="w-80"
        />
      )}
      {outcome === "escalation" && (
        <p className="w-72 text-xs text-studio-muted">
          Ce choix appellera le webhook n8n configuré (variable d&apos;environnement
          N8N_CHATBOT_WEBHOOK_URL) au lieu d&apos;afficher une réponse.
        </p>
      )}

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "..." : "Enregistrer"}
      </Button>
      <Button type="button" variant="ghost" onClick={onDone}>
        Annuler
      </Button>
      {error && <p className="w-full text-xs text-studio-red">{error}</p>}
    </form>
  );
}
