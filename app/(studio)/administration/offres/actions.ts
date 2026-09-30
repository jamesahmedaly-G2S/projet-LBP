"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function linesToArray(v: FormDataEntryValue | null): string[] {
  return str(v)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseBlocs(v: FormDataEntryValue | null): [string, string][] | null {
  const lines = linesToArray(v);
  if (lines.length === 0) return null;
  return lines.map((line) => {
    const sep = line.indexOf("|");
    return sep === -1 ? [line, ""] : [line.slice(0, sep).trim(), line.slice(sep + 1).trim()];
  });
}

export async function saveOfferContent(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await requireAdmin();

  const tierLevel = Number(formData.get("tier_level"));
  if (!Number.isInteger(tierLevel)) return "Palier invalide.";

  const name = str(formData.get("name"));
  const sub = str(formData.get("sub"));
  const price = Number(formData.get("price"));
  const users = Number(formData.get("users"));
  const promesse = str(formData.get("promesse"));
  const description = str(formData.get("description"));
  const pourqui = str(formData.get("pourqui"));
  const foot = str(formData.get("foot"));
  const cta = str(formData.get("cta"));
  const cta2 = str(formData.get("cta2"));

  if (!name || !sub || !promesse || !description || !pourqui || !foot || !cta || !cta2) {
    return "Tous les champs texte obligatoires doivent être remplis.";
  }
  if (!Number.isFinite(price) || !Number.isFinite(users)) {
    return "Le prix et le nombre d'utilisateurs doivent être des nombres.";
  }

  const extraUserPriceRaw = str(formData.get("extra_user_price"));
  const extraUserPrice = extraUserPriceRaw === "" ? null : Number(extraUserPriceRaw);
  if (extraUserPrice !== null && !Number.isFinite(extraUserPrice)) {
    return "Le prix par utilisateur supplémentaire doit être un nombre (ou vide).";
  }

  const inc = linesToArray(formData.get("inc"));
  const why = linesToArray(formData.get("why"));
  if (inc.length === 0 || why.length === 0) {
    return "« Ce que vous obtenez » et « Pourquoi choisir cette offre » doivent avoir au moins une ligne.";
  }

  const formulaRaw = str(formData.get("formula"));
  const formula = formulaRaw
    ? formulaRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("studio_offer_content")
    .update({
      name,
      sub,
      price,
      users,
      extra_user_price: extraUserPrice,
      badge: str(formData.get("badge")),
      reco: formData.get("reco") === "on",
      promesse,
      sous_promesse: str(formData.get("sous_promesse")) || null,
      description,
      pourqui,
      inc,
      why,
      foot,
      cta,
      cta2,
      highlight: str(formData.get("highlight")) || null,
      formula,
      blocs: parseBlocs(formData.get("blocs")),
      note: str(formData.get("note")) || null,
    })
    .eq("tier_level", tierLevel);

  if (error) return `Erreur : ${error.message}`;

  revalidatePath("/administration/offres");
  revalidatePath("/offres");
  revalidatePath("/accueil");
  return null;
}
