import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getRecentActivity } from "@/lib/studio/activity";
import { STUDIO_SETTINGS } from "@/lib/studio/settings";
import { Card } from "@/ui-kit/Card";
import { Badge } from "@/ui-kit/Badge";

// STU-ADMIN-01 (§15) : "Gestion des utilisateurs Studio. Paramètres
// globaux [...]. Journal d'activité. Préparer la gestion future de droits
// sans l'imposer visuellement aujourd'hui." Le cahier de gouvernance
// confirme qu'en V1 tous les comptes Studio ont les mêmes droits (pas de
// RBAC tant que la matrice n'est pas tranchée, Note de cadrage p.13) —
// cet écran ne montre donc volontairement qu'un seul niveau "admin",
// jamais de rôle différencié fictif.
export default async function AdministrationPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, status")
    .eq("role", "admin")
    .order("full_name");

  const serviceRole = createServiceRoleClient();
  const adminsWithEmail = await Promise.all(
    (admins ?? []).map(async (a) => {
      const { data } = await serviceRole.auth.admin.getUserById(a.id);
      return { ...a, email: data.user?.email ?? "—" };
    }),
  );

  const activity = await getRecentActivity(supabase, 10);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-studio-navy">Administration</h1>
      <p className="mt-1 text-sm text-studio-muted">
        Comptes Studio, paramètres globaux et journal d&apos;activité.
      </p>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-studio-navy">Comptes G2S</h2>
        <p className="mb-3 text-xs text-studio-muted">
          Tous les comptes Studio ont aujourd&apos;hui le même niveau d&apos;accès (pas de gestion
          de droits différenciés pour cette version).
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          {adminsWithEmail.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3">
              <span>
                <span className="font-medium text-studio-navy">{a.full_name}</span>
                <span className="ml-2 text-studio-muted">{a.email}</span>
              </span>
              <Badge tone={a.status === "active" ? "green" : "neutral"}>{a.status}</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-studio-navy">Paramètres globaux</h2>
        <p className="mb-3 text-xs text-studio-muted">
          Valeurs réellement utilisées par le code (`lib/studio/settings.ts`), source unique — le
          suivi annuel, la liste clients et la vue globale des entretiens en dépendent tous les
          trois.
        </p>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Setting
            label="Seuil rouge (entretien)"
            value={`${STUDIO_SETTINGS.entretienSeuilRouge} j`}
          />
          <Setting
            label="Seuil jaune (entretien)"
            value={`${STUDIO_SETTINGS.entretienSeuilJaune} j`}
          />
          <Setting
            label="Périodicité entretien"
            value={`${STUDIO_SETTINGS.entretienPeriodeMois} mois`}
          />
          <Setting
            label="Délai de publication"
            value={`${STUDIO_SETTINGS.publicationDelaiJours} j`}
          />
        </dl>
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-studio-navy">Journal d&apos;activité</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-studio-muted">Aucune activité pour l&apos;instant.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span className="text-studio-navy">{a.label}</span>
                <span className="text-xs text-studio-muted">
                  {new Date(a.date).toLocaleDateString("fr-FR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-studio-line bg-white p-3">
      <dt className="text-xs text-studio-muted">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-studio-navy">{value}</dd>
    </div>
  );
}
