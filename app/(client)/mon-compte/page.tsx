import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";

// LBP-CLIENT-10 : "Mon compte" [§1.11, p.12-13] — infos perso, identifiants,
// préférences de notification. Réalisé : infos perso (profiles, déjà en
// base) + identifiants/sécurité (email en lecture seule, mot de passe via
// l'API Supabase Auth réelle). Préférences de notification non tenté ici
// : dépend de LBP-CLIENT-11, aucun mécanisme de stockage des préférences
// n'existe (seule la table `notifications`, le flux lui-même, existe déjà
// côté schéma réel de James) — à construire ensemble plutôt que
// séparément.
export default async function MonComptePage() {
  const session = await requireClient();
  const supabase = await createClient();

  const [{ data: profile }, { data: userData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, job_title, department, phone")
      .eq("id", session.userId)
      .single(),
    supabase.auth.getUser(),
  ]);

  const email = userData.user?.email ?? "—";

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Eyebrow>Espace personnel</Eyebrow>
      <SectionTitle>Le compte de {profile?.full_name ?? "—"}</SectionTitle>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-ink">Mes informations</h2>
        <div className="mt-3">
          <ProfileForm
            jobTitle={profile?.job_title ?? null}
            department={profile?.department ?? null}
            phone={profile?.phone ?? null}
          />
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-lg font-semibold text-ink">Identifiants &amp; sécurité</h2>
        <dl className="mt-3 text-sm">
          <dt className="text-muted">Adresse e-mail (identifiant de connexion)</dt>
          <dd className="text-ink">{email}</dd>
        </dl>
        <div className="mt-4">
          <PasswordForm />
        </div>
      </Card>
    </main>
  );
}
