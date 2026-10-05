// Port visuel de `.st-stepper`/`.st-step` (LBP_V6_Studio.html) : cercle
// numéroté rempli pour les étapes faites/en cours, connecteur bleu jusqu'à
// l'étape courante, libellé mis en avant sur l'étape courante uniquement.
export default function WizardStepper({
  steps,
  currentStep,
}: {
  steps: readonly string[];
  currentStep: number;
}) {
  return (
    <div className="flex items-start justify-between overflow-x-auto pb-1">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < currentStep;
        const current = n === currentStep;
        const filled = done || current;
        return (
          <div key={label} className="flex min-w-[92px] flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              <div
                className={`h-0.5 flex-1 ${i === 0 ? "invisible" : n - 1 <= currentStep ? "bg-studio-blue" : "bg-studio-line"}`}
              />
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-studio-blue font-bold ${
                  filled ? "bg-studio-blue text-white" : "bg-white text-studio-blue"
                }`}
              >
                {n}
              </div>
              <div
                className={`h-0.5 flex-1 ${i === steps.length - 1 ? "invisible" : n <= currentStep ? "bg-studio-blue" : "bg-studio-line"}`}
              />
            </div>
            <div
              className={`text-center text-xs ${current ? "font-bold text-studio-navy" : "text-studio-muted"}`}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
