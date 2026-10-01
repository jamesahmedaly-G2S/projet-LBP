// Calcul de grille mensuelle (semaines de 7 jours, lundi en premier),
// partagé entre la page complète du calendrier (/calendrier-rh,
// LBP-CLIENT-15) et le widget compact de l'Accueil (LBP-CLIENT-01) --
// jamais deux implémentations de ce calcul.
export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function monthWeeks(year: number, month: number): (number | null)[][] {
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7; // 0 = lundi
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
