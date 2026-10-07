"use client";

import { useActionState, useState, useTransition } from "react";
import { addTask, updateTask, setTaskStatus, deleteTask } from "./tasks-actions";
import { TextField, TextAreaField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

export type TaskStatus = "todo" | "doing" | "done";

export interface TaskRow {
  id: string;
  title: string;
  due_date: string | null;
  note: string | null;
  status: TaskStatus;
}

// Couleurs portées 1:1 depuis TASK_STATUS/.rem-task.st-*/.rem-chip.active.st-*
// (LBP_V9.9_Studio.html, lignes ~886-903) : todo=framboise, doing=#EAAE18
// (couleur dédiée, pas un token existant -- notre --color-warning est une
// teinte différente), done=carbone (--sage-deep du prototype vaut déjà
// #445068, identique à notre --color-ink, jamais redéfini par la couche
// charte finale).
const STATUS_META: Record<
  TaskStatus,
  { label: string; emoji: string; border: string; chipActive: string }
> = {
  todo: {
    label: "À faire",
    emoji: "🔴",
    border: "border-l-primary",
    chipActive: "bg-primary text-white border-primary",
  },
  doing: {
    label: "En cours",
    emoji: "🟠",
    border: "border-l-[#eaae18]",
    chipActive: "bg-[#eaae18] text-white border-[#eaae18]",
  },
  done: {
    label: "Finalisé",
    emoji: "✅",
    border: "border-l-ink",
    chipActive: "bg-ink text-white border-ink",
  },
};
const STATUS_ORDER: TaskStatus[] = ["todo", "doing", "done"];

function shortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
  });
}

export default function RemindersWidget({ tasks }: { tasks: TaskRow[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-[18px] shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]">
      <div className="mb-2.5 flex items-center justify-between gap-2.5">
        <h2 className="text-sm leading-[1.5] font-extrabold text-ink">
          ✅ Vos rappels de la semaine
        </h2>
        <button
          type="button"
          onClick={() => {
            setAdding((v) => !v);
            setEditingId(null);
          }}
          className="flex items-center gap-[7px] rounded-lg border border-primary bg-white px-[11px] py-[5px] text-xs font-bold text-primary hover:bg-primary hover:text-white"
        >
          + Ajouter
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.length === 0 && !adding && (
          <p className="py-1.5 text-[13px] text-muted italic">
            Aucun rappel cette semaine. Cliquez sur « + Ajouter ».
          </p>
        )}

        {tasks.map((t) =>
          editingId === t.id ? (
            <TaskForm key={t.id} task={t} onDone={() => setEditingId(null)} />
          ) : (
            <TaskRowView
              key={t.id}
              task={t}
              onEdit={() => {
                setEditingId(t.id);
                setAdding(false);
              }}
            />
          ),
        )}

        {adding && <TaskForm task={null} onDone={() => setAdding(false)} />}
      </div>
    </div>
  );
}

function TaskRowView({ task, onEdit }: { task: TaskRow; onEdit: () => void }) {
  const [, startTransition] = useTransition();
  const meta = STATUS_META[task.status];

  return (
    <div
      className={`rounded-[10px] border border-border border-l-4 bg-white px-3 py-2.5 ${meta.border}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm leading-[1.5]">{meta.emoji}</span>
        <span
          className={`flex-1 text-[13.5px] leading-[1.5] font-bold ${task.status === "done" ? "text-muted line-through" : "text-ink"}`}
        >
          {task.title}
        </span>
        {task.due_date && (
          <span className="text-[11px] leading-[1.5] text-muted capitalize">
            {shortDate(task.due_date)}
          </span>
        )}
        <button
          type="button"
          onClick={onEdit}
          aria-label="Modifier"
          className="text-xs leading-[1.5] text-ink opacity-60 hover:opacity-100"
        >
          ✎
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Supprimer « ${task.title} » ?`))
              startTransition(() => deleteTask(task.id));
          }}
          aria-label="Supprimer"
          className="text-xs leading-[1.5] text-ink opacity-60 hover:text-danger hover:opacity-100"
        >
          🗑
        </button>
      </div>
      {task.note && <p className="mt-1 ml-[22px] text-xs leading-[1.5] text-muted">{task.note}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => startTransition(() => setTaskStatus(task.id, s))}
            className={`rounded-[20px] border px-[9px] py-[3px] text-[10.5px] font-bold ${
              task.status === s
                ? STATUS_META[s].chipActive
                : "border-border bg-white text-muted hover:bg-page-bg"
            }`}
          >
            {STATUS_META[s].emoji} {STATUS_META[s].label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TaskForm({ task, onDone }: { task: TaskRow | null; onDone: () => void }) {
  const action = task ? updateTask : addTask;
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const result = await action(prev, fd);
    if (!result) onDone();
    return result;
  }, null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-[10px] border border-border p-2.5"
    >
      {task && <input type="hidden" name="id" value={task.id} />}
      <TextField
        label="Intitulé"
        name="title"
        defaultValue={task?.title ?? ""}
        required
        className="text-sm"
      />
      <div className="flex gap-2">
        <TextField
          label="Date"
          name="due_date"
          type="date"
          defaultValue={task?.due_date ?? ""}
          className="flex-1 text-sm"
        />
        <select
          name="status"
          defaultValue={task?.status ?? "todo"}
          className="mt-[22px] h-[38px] rounded-md border border-border px-2 text-sm text-ink"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
      </div>
      <TextAreaField
        label="Note (facultatif)"
        name="note"
        defaultValue={task?.note ?? ""}
        rows={2}
        className="text-sm"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending} className="text-xs">
          {pending ? "..." : task ? "Enregistrer" : "Ajouter"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone} className="text-xs">
          Annuler
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
