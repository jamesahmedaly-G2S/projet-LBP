import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/ui-kit/Card";
import SettingsForm from "./SettingsForm";
import GroupsManager from "./GroupsManager";
import KeyFiguresManager, { type KeyFigureAdmin } from "./KeyFiguresManager";
import ContributionRatesManager, { type ContributionRateAdmin } from "./ContributionRatesManager";

// LBP-CLIENT-05 (admin) : écran G2S manquant, signalé par l'utilisateur
// ("tout doit se faire depuis l'espace G2S, Pauline ne touche jamais au
// code ni à une ligne de commande"). Gère toutes les données réelles
// affichées sur /chiffres-paie (client) ET les 4 chiffres clés de
// /accueil, qui partagent la même table key_figures.
export default async function AdminChiffresPaiePage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: settings }, { data: groups }, { data: figures }, { data: contributions }] =
    await Promise.all([
      supabase.from("payroll_reference_settings").select("*").eq("id", 1).single(),
      supabase.from("key_figure_groups").select("id, title, sub").order("display_order"),
      supabase
        .from("key_figures")
        .select(
          "id, key, year, value, unit, note, label, group_id, show_as_card, show_in_ceiling_table",
        )
        .order("key")
        .order("year", { ascending: false })
        .returns<KeyFigureAdmin[]>(),
      supabase
        .from("contribution_rates")
        .select("*")
        .order("display_order")
        .returns<ContributionRateAdmin[]>(),
    ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/administration" className="text-sm text-studio-blue hover:underline">
        ← Administration
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-studio-navy">Chiffres Paie</h1>
      <p className="mt-1 text-sm text-studio-muted">
        Données affichées sur l&apos;Accueil et la page Chiffres Paie du LBP Client.
      </p>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-studio-navy">Réglages de la page</h2>
        <SettingsForm settings={settings!} />
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-studio-navy">Groupes de repères</h2>
        <GroupsManager groups={groups ?? []} />
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-studio-navy">Repères (SMIC, plafonds…)</h2>
        <p className="mb-3 text-xs text-studio-muted">
          Une ligne par clé et par année. Cochez « Afficher en carte » pour la comparaison annuelle,
          « Afficher dans le tableau des périodicités » pour le tableau plafond.
        </p>
        <KeyFiguresManager figures={figures ?? []} groups={groups ?? []} />
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-studio-navy">Taux de cotisations</h2>
        <ContributionRatesManager rows={contributions ?? []} />
      </Card>
    </main>
  );
}
