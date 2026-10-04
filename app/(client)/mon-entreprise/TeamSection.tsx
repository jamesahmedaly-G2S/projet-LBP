"use client";

import { useActionState, useState, useTransition, type ReactNode } from "react";
import { saveTeamMember, deleteTeamMember } from "./actions";
import { TextField, SelectField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

export interface TeamMember {
  id: string;
  name: string;
  job_title: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  manager_id: string | null;
}

// LBP-CLIENT-02 : organigramme réel, sans le sélecteur à 124 avatars
// décoratifs du prototype (aucune source réelle de 124 images) — un
// simple cercle avec l'initiale du nom à la place.
//
// Correctif fidélité (04/10/2026), suite à un retour de l'utilisateur
// ("compare mot pour mot") : libellés et placeholders réels du modal
// `personEditor` (`LBP_V9.9_Studio.html` ~L12249-12258) -- "Nom &
// prénom" (pas "Nom"), "Service / équipe" (pas "Service"), "E-mail" (pas
// "Email"), "Rattaché(e) à (responsable)" (pas "Rattaché à"), plus les
// placeholders d'exemple ("Ex. Camille Moreau", etc.), jamais portés.
// État vide complété avec sa deuxième phrase ("Cliquez sur « + Ajouter
// une personne ».") -- tronquée avant ce correctif.
export default function TeamSection({ members }: { members: TeamMember[] }) {
  const [editing, setEditing] = useState<TeamMember | "new" | null>(null);
  const [, startTransition] = useTransition();

  const roots = members.filter((m) => !m.manager_id);

  function renderNode(member: TeamMember): ReactNode {
    const children = members.filter((m) => m.manager_id === member.id);
    return (
      <li key={member.id} className="mt-2">
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
            {member.name.charAt(0).toUpperCase()}
          </span>
          <span className="flex-1 text-sm">
            <span className="font-medium text-ink">{member.name}</span>
            {member.job_title && <span className="ml-2 text-muted">{member.job_title}</span>}
            {(member.department || member.email || member.phone) && (
              <span className="block text-xs text-muted">
                {[member.department, member.email, member.phone].filter(Boolean).join(" · ")}
              </span>
            )}
          </span>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setEditing(member)}
          >
            Modifier
          </button>
          <button
            type="button"
            className="text-xs text-danger hover:underline"
            onClick={() => startTransition(() => deleteTeamMember(member.id))}
          >
            Supprimer
          </button>
        </div>
        {children.length > 0 && (
          <ul className="ml-6 border-l-2 border-border pl-3">{children.map(renderNode)}</ul>
        )}
      </li>
    );
  }

  return (
    <div>
      {roots.length === 0 ? (
        <p className="text-sm text-muted">
          Aucune personne pour le moment. Cliquez sur « + Ajouter une personne ».
        </p>
      ) : (
        <ul>{roots.map(renderNode)}</ul>
      )}

      {editing ? (
        <MemberForm
          member={editing === "new" ? null : editing}
          members={members}
          onDone={() => setEditing(null)}
        />
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={() => setEditing("new")}
        >
          + Ajouter une personne
        </Button>
      )}
    </div>
  );
}

function MemberForm({
  member,
  members,
  onDone,
}: {
  member: TeamMember | null;
  members: TeamMember[];
  onDone: () => void;
}) {
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const result = await saveTeamMember(prev, fd);
    if (!result) onDone();
    return result;
  }, null);

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2 rounded-md border border-border p-3"
    >
      {member && <input type="hidden" name="id" value={member.id} />}
      <div className="flex flex-wrap gap-2">
        <TextField
          label="Nom & prénom"
          name="name"
          defaultValue={member?.name}
          placeholder="Ex. Camille Moreau"
          required
          className="w-40"
        />
        <TextField
          label="Poste"
          name="job_title"
          defaultValue={member?.job_title ?? ""}
          placeholder="Ex. Directrice RH"
          className="w-40"
        />
        <TextField
          label="Service / équipe"
          name="department"
          defaultValue={member?.department ?? ""}
          placeholder="Ex. Direction"
          className="w-32"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <TextField
          label="E-mail"
          name="email"
          type="email"
          defaultValue={member?.email ?? ""}
          placeholder="prenom.nom@…"
          className="w-48"
        />
        <TextField
          label="Téléphone"
          name="phone"
          defaultValue={member?.phone ?? ""}
          placeholder="01 …"
          className="w-32"
        />
        <SelectField
          label="Rattaché(e) à (responsable)"
          name="manager_id"
          defaultValue={member?.manager_id ?? ""}
          className="w-40"
        >
          <option value="">— Aucun (haut de l&apos;organigramme)</option>
          {members
            .filter((m) => m.id !== member?.id)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </SelectField>
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "..." : "Enregistrer"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
