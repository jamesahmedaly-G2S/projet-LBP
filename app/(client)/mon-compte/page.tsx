import { requireClient } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow } from "../_components/Eyebrow";
import { SectionTitle } from "../_components/SectionTitle";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";
import NotificationPreferencesForm from "./NotificationPreferencesForm";
import type { NotificationChannel } from "@/lib/client/notification-kinds";

// LBP-CLIENT-10 : "Mon compte" [§1.11, p.12-13] — infos perso, identifiants,
// préférences de notification. Réalisé : infos perso (profiles, déjà en
// base) + identifiants/sécurité (email en lecture seule, mot de passe via
// l'API Supabase Auth réelle).
//
// Finitions (30/09/2026) : "Mes notifications" -- voir
// lib/client/notification-kinds.ts pour le détail du vocabulaire porté et
// des types réellement déclenchés aujourd'hui.
//
// Correctif fidélité (03/10/2026), suite à un retour de l'utilisateur
// ("compare bien mot pour mot et taille pour taille") : revérifié contre
// `renderAccount()` (LBP_V9.9_Studio.html ~L12114-12130) et `.ov-panel h3`
// (~L141) -- les en-têtes réels sont en MAJUSCULES, 13px, 800, avec
// l'emoji intégré au texte ("👤 Mes informations", "🔐 Identifiants &
// sécurité", "🔔 Mes notifications") -- pas un `text-lg font-semibold`
// générique sans emoji. Panneau recalé sur `.ov-panel` (padding 18px,
// radius 18px, `--shadow-sm`) au lieu de la carte générique.
//
// Non porté, écart assumé : la ligne d'accès "🔐 Administrateur — accès
// complet…"/"🔐 Collaborateur — accès à la consultation…" (`.acc-access`)
// distingue deux niveaux au sein même du rôle client (`p.dir` dans le
// prototype) -- notre schéma réel (`profiles.role`) n'a que
// admin/client, aucun champ ne distingue un "administrateur de la
// société cliente" d'un simple collaborateur. Ajouter cette ligne
// demanderait une vraie nouvelle colonne/notion de rôle, pas un
// ajustement de texte ou de taille -- hors périmètre de ce correctif.
export default async function MonComptePage() {
  const session = await requireClient();
  const supabase = await createClient();

  const [{ data: profile }, { data: userData }, { data: prefs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, job_title, department, phone")
      .eq("id", session.userId)
      .single(),
    supabase.auth.getUser(),
    supabase
      .from("notification_preferences")
      .select("kind, channel")
      .eq("profile_id", session.userId),
  ]);

  const email = userData.user?.email ?? "—";
  const channelByKind: Record<string, NotificationChannel> = Object.fromEntries(
    (prefs ?? []).map((p) => [p.kind, p.channel as NotificationChannel]),
  );

  return (
    <main className="mx-auto max-w-[1240px] px-[30px] pt-6 pb-[90px]">
      <Eyebrow>Espace personnel</Eyebrow>
      <SectionTitle>Le compte de {profile?.full_name ?? "—"}</SectionTitle>

      <div className="mt-6 rounded-[18px] border border-border bg-surface p-[18px] shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]">
        <h2 className="mb-[13px] flex items-center gap-2 text-[13px] font-extrabold tracking-[0.03em] text-ink uppercase">
          👤 Mes informations
        </h2>
        <div>
          <ProfileForm
            jobTitle={profile?.job_title ?? null}
            department={profile?.department ?? null}
            phone={profile?.phone ?? null}
          />
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-border bg-surface p-[18px] shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]">
        <h2 className="mb-[13px] flex items-center gap-2 text-[13px] font-extrabold tracking-[0.03em] text-ink uppercase">
          🔐 Identifiants &amp; sécurité
        </h2>
        <dl className="text-sm">
          <dt className="text-muted">Adresse e-mail (identifiant de connexion)</dt>
          <dd className="text-ink">{email}</dd>
        </dl>
        <div className="mt-4">
          <PasswordForm />
        </div>
      </div>

      <div className="mt-4 rounded-[18px] border border-border bg-surface p-[18px] shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]">
        <h2 className="mb-[13px] flex items-center gap-2 text-[13px] font-extrabold tracking-[0.03em] text-ink uppercase">
          🔔 Mes notifications
        </h2>
        <p className="text-[12.5px] text-muted">
          Pour chaque type, choisissez si — et comment — vous souhaitez être prévenu(e).
        </p>
        <div className="mt-4">
          <NotificationPreferencesForm channelByKind={channelByKind} />
        </div>
      </div>
    </main>
  );
}
