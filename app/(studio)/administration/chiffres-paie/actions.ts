"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const PATH = "/administration/chiffres-paie";

export async function saveSettings(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("payroll_reference_settings")
    .update({
      title: str(formData.get("title")) ?? "Les chiffres de la paie",
      intro: str(formData.get("intro")) ?? "",
      plafond_title: str(formData.get("plafond_title")) ?? "Plafond Sécurité sociale",
      cot_title: str(formData.get("cot_title")) ?? "Taux de cotisations",
      source: str(formData.get("source")) ?? "",
    })
    .eq("id", 1);

  if (error) return `Erreur : ${error.message}`;
  revalidatePath(PATH);
  revalidatePath("/chiffres-paie");
  return "Enregistré.";
}

export async function addGroup(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();
  const title = formData.get("title");
  if (typeof title !== "string" || !title.trim()) return "Le nom du groupe est obligatoire.";

  const supabase = await createClient();
  const code = title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const { error } = await supabase.from("key_figure_groups").insert({
    code: `${code}-${Date.now()}`,
    title: title.trim(),
    sub: str(formData.get("sub")),
    display_order: Number(formData.get("display_order")) || 0,
  });
  if (error) return `Erreur : ${error.message}`;
  revalidatePath(PATH);
  revalidatePath("/chiffres-paie");
  return null;
}

export async function deleteGroup(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase
    .from("key_figures")
    .update({ group_id: null, show_as_card: false })
    .eq("group_id", id);
  await supabase.from("key_figure_groups").delete().eq("id", id);
  revalidatePath(PATH);
  revalidatePath("/chiffres-paie");
}

export async function saveKeyFigure(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();
  const id = formData.get("id");
  const key = formData.get("key");
  const year = Number(formData.get("year"));
  const value = Number(formData.get("value"));

  if (typeof key !== "string" || !key.trim()) return "La clé technique est obligatoire.";
  if (!year) return "L'année est obligatoire.";
  if (Number.isNaN(value)) return "La valeur doit être un nombre.";

  const groupId = formData.get("group_id");
  const data = {
    key: key.trim(),
    year,
    value,
    unit: str(formData.get("unit")) ?? "€",
    note: str(formData.get("note")),
    label: str(formData.get("label")),
    group_id: typeof groupId === "string" && groupId ? groupId : null,
    show_as_card: formData.get("show_as_card") === "on",
    show_in_ceiling_table: formData.get("show_in_ceiling_table") === "on",
  };

  const supabase = await createClient();
  const { error } =
    typeof id === "string" && id
      ? await supabase.from("key_figures").update(data).eq("id", id)
      : await supabase.from("key_figures").insert(data);

  if (error) return `Erreur : ${error.message}`;
  revalidatePath(PATH);
  revalidatePath("/chiffres-paie");
  revalidatePath("/accueil");
  return null;
}

export async function deleteKeyFigure(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("key_figures").delete().eq("id", id);
  revalidatePath(PATH);
  revalidatePath("/chiffres-paie");
  revalidatePath("/accueil");
}

export async function saveContributionRate(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();
  const id = formData.get("id");
  const label = formData.get("label");
  if (typeof label !== "string" || !label.trim()) return "Le libellé est obligatoire.";

  const data = {
    label: label.trim(),
    category: str(formData.get("category")),
    base: str(formData.get("base")),
    employee_rate: str(formData.get("employee_rate")),
    employer_rate: str(formData.get("employer_rate")),
    is_header: formData.get("is_header") === "on",
    display_order: Number(formData.get("display_order")) || 0,
  };

  const supabase = await createClient();
  const { error } =
    typeof id === "string" && id
      ? await supabase.from("contribution_rates").update(data).eq("id", id)
      : await supabase.from("contribution_rates").insert(data);

  if (error) return `Erreur : ${error.message}`;
  revalidatePath(PATH);
  revalidatePath("/chiffres-paie");
  return null;
}

export async function deleteContributionRate(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("contribution_rates").delete().eq("id", id);
  revalidatePath(PATH);
  revalidatePath("/chiffres-paie");
}

function str(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
