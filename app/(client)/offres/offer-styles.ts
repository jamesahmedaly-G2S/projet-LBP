// Boutons des cartes d'offre, valeurs calculées mesurées sur la maquette
// (LBP_V9.9_Studio.html, `.off-cta .btn-primary` / `.btn-line` /
// `.btn-line.btn-xs`, getComputedStyle à 1240px, 06/10/2026) :
// - primaire : pilule framboise, 12.5px/700, padding 9px 18px (32px de haut) ;
// - ligne : pilule blanche, filet 1px framboise, mêmes dimensions ;
// - ligne xs : radius 8px (PAS une pilule), 12px/700, padding 5px 11px.
export const btnPrimaryClass =
  "flex w-full items-center justify-center gap-[7px] rounded-full bg-primary px-[18px] py-[9px] text-[12.5px] leading-[14px] font-bold whitespace-nowrap text-white transition hover:-translate-y-px hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export const btnLineClass =
  "flex w-full items-center justify-center gap-[7px] rounded-full border border-primary bg-white px-[18px] py-[9px] text-[12.5px] leading-[14px] font-bold whitespace-nowrap text-primary transition hover:bg-primary hover:text-white";

export const btnLineXsClass =
  "flex w-full items-center justify-center gap-[7px] rounded-lg border border-primary bg-white px-[11px] py-[5px] text-[12px] leading-[14px] font-bold whitespace-nowrap text-primary transition hover:bg-primary hover:text-white";
