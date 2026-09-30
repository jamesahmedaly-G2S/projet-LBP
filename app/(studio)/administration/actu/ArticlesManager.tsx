"use client";

import { useActionState, useState } from "react";
import { saveArticle, deleteArticle } from "./actions";
import { TextField, TextAreaField, SelectField, CheckboxField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";
import { Badge } from "@/ui-kit/Badge";

export interface ArticleAdmin {
  id: string;
  type: "article" | "pdf";
  title: string;
  category: string | null;
  subcategories: string[] | null;
  author: string | null;
  published_at: string;
  reading_time: string | null;
  image_url: string | null;
  pdf_url: string | null;
  content: string | null;
  published: boolean;
}

export default function ArticlesManager({ articles }: { articles: ArticleAdmin[] }) {
  const [editing, setEditing] = useState<ArticleAdmin | "new" | null>(null);

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-studio-line text-left text-xs text-studio-muted">
            <th className="py-1.5 pr-2">Titre</th>
            <th className="px-2 py-1.5">Type</th>
            <th className="px-2 py-1.5">Catégorie</th>
            <th className="px-2 py-1.5">Date</th>
            <th className="px-2 py-1.5">Statut</th>
            <th className="px-2 py-1.5"></th>
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.id} className="border-b border-studio-line">
              <td className="py-1.5 pr-2 text-studio-navy">{a.title}</td>
              <td className="px-2 py-1.5 text-studio-muted">
                {a.type === "pdf" ? "Dossier PDF" : "Article"}
              </td>
              <td className="px-2 py-1.5 text-studio-muted">{a.category ?? "—"}</td>
              <td className="px-2 py-1.5 text-studio-muted">
                {new Date(a.published_at).toLocaleDateString("fr-FR")}
              </td>
              <td className="px-2 py-1.5">
                <Badge tone={a.published ? "green" : "amber"}>
                  {a.published ? "Publié" : "Brouillon"}
                </Badge>
              </td>
              <td className="px-2 py-1.5 text-right">
                <button
                  type="button"
                  className="text-xs text-studio-blue hover:underline"
                  onClick={() => setEditing(a)}
                >
                  Modifier
                </button>
                <DeleteButton id={a.id} title={a.title} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing ? (
        <ArticleForm article={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={() => setEditing("new")}
        >
          + Nouvel article
        </Button>
      )}
    </div>
  );
}

function DeleteButton({ id, title }: { id: string; title: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className="ml-2 text-xs text-studio-red hover:underline"
      disabled={pending}
      onClick={async () => {
        if (!confirm(`Supprimer « ${title} » ?`)) return;
        setPending(true);
        await deleteArticle(id);
        setPending(false);
      }}
    >
      Supprimer
    </button>
  );
}

function ArticleForm({ article, onDone }: { article: ArticleAdmin | null; onDone: () => void }) {
  const [type, setType] = useState<"article" | "pdf">(article?.type ?? "article");
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const result = await saveArticle(prev, fd);
    if (!result) onDone();
    return result;
  }, null);

  return (
    <form
      action={formAction}
      className="mt-3 flex flex-col gap-2 rounded-md border border-studio-line p-3"
    >
      {article && <input type="hidden" name="id" value={article.id} />}

      <div className="flex flex-wrap gap-2">
        <TextField
          label="Titre"
          name="title"
          defaultValue={article?.title ?? ""}
          required
          className="flex-1"
        />
        <SelectField
          label="Type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "article" | "pdf")}
          className="w-40"
        >
          <option value="article">Article</option>
          <option value="pdf">Dossier PDF</option>
        </SelectField>
      </div>

      <div className="flex flex-wrap gap-2">
        <TextField
          label="Catégorie"
          name="category"
          defaultValue={article?.category ?? ""}
          className="w-48"
        />
        <TextField
          label="Sous-thèmes (séparés par des virgules)"
          name="subcategories"
          defaultValue={(article?.subcategories ?? []).join(", ")}
          className="flex-1"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <TextField
          label="Auteur"
          name="author"
          defaultValue={article?.author ?? ""}
          className="w-48"
        />
        {type === "article" && (
          <TextField
            label="Temps de lecture"
            name="reading_time"
            defaultValue={article?.reading_time ?? ""}
            placeholder="5 min"
            className="w-40"
          />
        )}
      </div>

      <TextField
        label="Image (URL, optionnel)"
        name="image_url"
        defaultValue={article?.image_url ?? ""}
      />
      {type === "pdf" && (
        <TextField label="PDF (URL)" name="pdf_url" defaultValue={article?.pdf_url ?? ""} />
      )}

      <TextAreaField
        label="Contenu"
        name="content"
        defaultValue={article?.content ?? ""}
        rows={8}
        required
      />

      <CheckboxField
        label="Publié (visible côté client) — sinon, brouillon visible uniquement ici"
        name="published"
        defaultChecked={article?.published ?? false}
      />

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "..." : "Enregistrer"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
      {error && <p className="text-xs text-studio-red">{error}</p>}
    </form>
  );
}
