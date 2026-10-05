/**
 * Port 1:1 de `norm()` (`LBP_V6_Studio.html`, prototype réel) —
 * `docs/ARCHITECTURE.md` §9 désigne ce fichier comme la fonction de
 * normalisation unique du projet, à ne jamais redéfinir ailleurs.
 */
export function normText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’`]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
