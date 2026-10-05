import { LinkButton } from "@/ui-kit/LinkButton";

// Port de `wzNav(back,next,label)` (LBP_V6_Studio.html) — navigation de bas
// d'étape, toujours avec un "Annuler" vers la liste des clients.
export default function WizardNav({
  backHref,
  nextHref,
  nextLabel = "Continuer",
}: {
  backHref?: string;
  nextHref?: string;
  nextLabel?: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {backHref && (
        <LinkButton href={backHref} variant="secondary">
          ← Précédent
        </LinkButton>
      )}
      {nextHref && (
        <LinkButton href={nextHref} variant="primary">
          {nextLabel}
        </LinkButton>
      )}
      <LinkButton href="/clients" variant="secondary">
        Annuler
      </LinkButton>
    </div>
  );
}
