"use client";

import { useActionState, useState, useTransition } from "react";
import { saveDocument, deleteDocument } from "./actions";
import {
  DOCUMENT_CATEGORIES,
  type CompanyDocument,
  type DocumentCategory,
} from "@/lib/client/company-documents";
import { TextField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";

// LBP-CLIENT-02 : CRUD admin pour "Vos documents" (1.3.5) -- un bloc par
// catégorie (cc/acc/grille/charte), même pattern liste+formulaire inline
// que CcnManager.tsx/ArticlesManager.tsx. Le client (app/(client)/
// mon-entreprise/documents/[category]/page.tsx) n'a aucun accès en
// écriture -- RLS côté serveur, pas seulement l'absence de ce composant
// là-bas.
export default function DocumentsManager({
  companyId,
  documents,
}: {
  companyId: string;
  documents: CompanyDocument[];
}) {
  return (
    <div className="flex flex-col gap-6">
      {DOCUMENT_CATEGORIES.map((cat) => (
        <CategorySection
          key={cat.key}
          companyId={companyId}
          category={cat.key}
          label={cat.label}
          documents={documents.filter((d) => d.category === cat.key)}
        />
      ))}
    </div>
  );
}

function CategorySection({
  companyId,
  category,
  label,
  documents,
}: {
  companyId: string;
  category: DocumentCategory;
  label: string;
  documents: CompanyDocument[];
}) {
  const [editing, setEditing] = useState<CompanyDocument | "new" | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-studio-navy">{label}</h3>
      {documents.length === 0 ? (
        <p className="text-xs text-studio-muted">Aucun document dans cette catégorie.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-studio-line text-left text-xs text-studio-muted">
              <th className="py-1.5 pr-2">Nom</th>
              <th className="px-2 py-1.5">Détail</th>
              <th className="px-2 py-1.5">Date</th>
              <th className="px-2 py-1.5">Lien</th>
              <th className="px-2 py-1.5"></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-b border-studio-line">
                <td className="py-1.5 pr-2 text-studio-navy">{d.name}</td>
                <td className="px-2 py-1.5 text-studio-muted">{d.meta ?? "—"}</td>
                <td className="px-2 py-1.5 text-studio-muted">
                  {d.doc_date ? new Date(d.doc_date).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td className="px-2 py-1.5 text-studio-muted">
                  {d.url ? (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-studio-blue hover:underline"
                    >
                      Ouvrir ↗
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <button
                    type="button"
                    className="text-xs text-studio-blue hover:underline"
                    onClick={() => setEditing(d)}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="ml-2 text-xs text-studio-red hover:underline"
                    onClick={() => {
                      if (confirm(`Supprimer « ${d.name} » ?`)) {
                        startTransition(async () => {
                          await deleteDocument(d.id, companyId);
                          setDeleteError(null);
                        });
                      }
                    }}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {deleteError && <p className="mt-2 text-xs text-studio-red">{deleteError}</p>}

      {editing ? (
        <DocumentForm
          companyId={companyId}
          category={category}
          item={editing === "new" ? null : editing}
          onDone={() => setEditing(null)}
        />
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="mt-2"
          onClick={() => setEditing("new")}
        >
          + Ajouter un document
        </Button>
      )}
    </div>
  );
}

function DocumentForm({
  companyId,
  category,
  item,
  onDone,
}: {
  companyId: string;
  category: DocumentCategory;
  item: CompanyDocument | null;
  onDone: () => void;
}) {
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const result = await saveDocument(prev, fd);
    if (!result) onDone();
    return result;
  }, null);

  return (
    <form
      action={formAction}
      className="mt-2 flex flex-wrap items-end gap-2 rounded-md border border-studio-line p-3"
    >
      <input type="hidden" name="company_id" value={companyId} />
      <input type="hidden" name="category" value={category} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <TextField
        label="Nom"
        name="name"
        defaultValue={item?.name ?? ""}
        required
        className="w-48"
      />
      <TextField label="Détail" name="meta" defaultValue={item?.meta ?? ""} className="w-40" />
      <TextField
        label="Date"
        name="doc_date"
        type="date"
        defaultValue={item?.doc_date ?? ""}
        className="w-36"
      />
      <TextField
        label="Lien (Légifrance, PDF hébergé…)"
        name="url"
        defaultValue={item?.url ?? ""}
        placeholder="https://…"
        className="w-64"
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
