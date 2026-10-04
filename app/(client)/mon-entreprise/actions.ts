"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// LBP-CLIENT-02 : "Mon équipe" [§1.3, p.9] — team_members/payroll_org/
// software_stack existent déjà dans le schéma réel de James
// (baseline_schema_reel.sql, §9.1/9.2) avec leur RLS `for all using
// (is_admin() or company_id = current_company_id())` — jamais consommées
// par aucun écran avant ce ticket, jamais modifiées ici.
// Renommé "Mon entreprise" (cahier des charges technique V9.4, §3.3, MAJ
// 29/09/2026) — route et libellé alignés, schéma/tables inchangés.

async function companyId(): Promise<string> {
  const session = await requireClient();
  if (!session.profile.company_id) throw new Error("Aucune société rattachée à ce compte.");
  return session.profile.company_id;
}

export async function addEstablishment(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const id = await companyId();
  const name = formData.get("name");
  const address = formData.get("address");
  if (typeof name !== "string" || !name.trim()) return "Le nom de l'établissement est obligatoire.";

  const supabase = await createClient();
  const { error } = await supabase.from("establishments").insert({
    company_id: id,
    name: name.trim(),
    address: typeof address === "string" && address.trim() ? address.trim() : null,
  });
  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/mon-entreprise");
  return null;
}

export async function deleteEstablishment(id: string): Promise<void> {
  await companyId();
  const supabase = await createClient();
  await supabase.from("establishments").delete().eq("id", id);
  revalidatePath("/mon-entreprise");
}

export async function saveTeamMember(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const id = await companyId();
  const memberId = formData.get("id");
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) return "Le nom est obligatoire.";

  const managerId = formData.get("manager_id");
  const avatarIndex = Number(formData.get("avatar_index"));
  const data = {
    company_id: id,
    name: name.trim(),
    job_title: str(formData.get("job_title")),
    department: str(formData.get("department")),
    email: str(formData.get("email")),
    phone: str(formData.get("phone")),
    manager_id: typeof managerId === "string" && managerId ? managerId : null,
    avatar_index: Number.isInteger(avatarIndex) && avatarIndex >= 0 ? avatarIndex : 0,
  };

  const supabase = await createClient();
  const { error } =
    typeof memberId === "string" && memberId
      ? await supabase.from("team_members").update(data).eq("id", memberId)
      : await supabase.from("team_members").insert(data);

  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/mon-entreprise");
  return null;
}

export async function deleteTeamMember(id: string): Promise<void> {
  await companyId();
  const supabase = await createClient();
  await supabase.from("team_members").update({ manager_id: null }).eq("manager_id", id);
  await supabase.from("team_members").delete().eq("id", id);
  revalidatePath("/mon-entreprise");
}

// Correctif (04/10/2026), suite au retour de l'utilisateur ("on corrige
// de notre côté") : le vrai prototype (openIdentEditor()) laisse le
// client éditer lui-même raison sociale/forme/effectif/SIRET/CCN/logo --
// notre RLS (companies_update_admin, admin uniquement) l'empêchait. Pas
// de `.from("companies").update(...)` direct ici : ça exigerait une
// policy RLS "id = current_company_id()" exposant tout companies à
// l'écriture client, y compris `offer_tier` (le palier tarifaire) --
// une faille d'escalade de privilèges. À la place, la fonction dédiée
// `update_company_identity` (migration 20261004140000, SECURITY DEFINER)
// ne touche que les colonnes d'identité, jamais une colonne sensible.
const MAX_LOGO_SIZE = 2_000_000; // 2 Mo -- le prototype n'a aucune limite
// (stockage base64 en mémoire côté navigateur, jamais persisté), mais une
// vraie base de données ne doit pas absorber des images arbitrairement
// grandes dans une colonne texte.

export async function saveCompanyIdentity(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  await companyId();
  const supabase = await createClient();

  const companyName = str(formData.get("company_name"));
  if (!companyName) return "La raison sociale est obligatoire.";

  const removeLogo = formData.get("remove_logo") === "on";
  const logoFile = formData.get("logo");
  let updateLogo = false;
  let logoDataUrl: string | null = null;

  if (logoFile instanceof File && logoFile.size > 0) {
    if (logoFile.size > MAX_LOGO_SIZE) return "Le logo ne doit pas dépasser 2 Mo.";
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    logoDataUrl = `data:${logoFile.type};base64,${buffer.toString("base64")}`;
    updateLogo = true;
  } else if (removeLogo) {
    updateLogo = true;
  }

  const { error } = await supabase.rpc("update_company_identity", {
    p_company_name: companyName,
    p_legal_form: str(formData.get("legal_form")),
    p_headcount: str(formData.get("headcount")),
    p_siret: str(formData.get("siret")),
    p_cba: str(formData.get("cba")),
    p_update_logo: updateLogo,
    p_logo_url: logoDataUrl,
  });
  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/mon-entreprise");
  return "Enregistré.";
}

export async function savePayrollOrg(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const id = await companyId();
  const supabase = await createClient();
  const { error } = await supabase.from("payroll_org").upsert({
    company_id: id,
    operating_mode: str(formData.get("operating_mode")),
    provider_name: str(formData.get("provider_name")),
  });
  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/mon-entreprise");
  return "Enregistré.";
}

export async function saveSoftwareStack(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const id = await companyId();
  const supabase = await createClient();
  const { error } = await supabase.from("software_stack").upsert({
    company_id: id,
    payroll_software: str(formData.get("payroll_software")),
    hris: str(formData.get("hris")),
    time_management: str(formData.get("time_management")),
    other_tools: str(formData.get("other_tools")),
    has_specifications: formData.get("has_specifications") === "oui",
  });
  if (error) return `Erreur : ${error.message}`;
  revalidatePath("/mon-entreprise");
  return "Enregistré.";
}

function str(v: FormDataEntryValue | null): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
