import Link from "next/link";

export type FamilyVariant = "ta" | "tb" | "tc";

// LBP-CLIENT-01 (finitions design, 01/10/2026) : 3 cartes famille en
// couleurs contrastées, portées 1:1 depuis le vrai prototype
// (LBP_V9.9_Studio.html, "COUCHE CHARTE G2S", .fam-card.ta/tb/tc) -- jamais
// les mêmes teintes que les cartes KPI (ChiffreCard.tsx) malgré la
// coïncidence apparente ("ta" et "kd" partagent le même fond cream-3, mais
// pas la même couleur de texte : framboise-dark ici, carbone pour kd).
const VARIANT_BG: Record<FamilyVariant, string> = {
  ta: "bg-[#efe7e1]",
  tb: "bg-primary-soft",
  tc: "bg-[#f5e6eb]",
};

const VARIANT_TITLE: Record<FamilyVariant, string> = {
  ta: "text-primary-hover",
  tb: "text-[#364054]", // --carbone-dark, vrai CSS (.fam-card.tb .fam-n)
  tc: "text-primary",
};

const VARIANT_TEXT: Record<FamilyVariant, string> = {
  ta: "text-[#8c2447]",
  tb: "text-ink",
  tc: "text-primary",
};

export default function FamilyCard({
  href,
  icon,
  name,
  example,
  themeCount,
  variant,
}: {
  href: string;
  icon: string;
  name: string;
  example?: string;
  themeCount: number;
  variant: FamilyVariant;
}) {
  return (
    <Link href={href}>
      <div
        className={`flex h-full min-h-[150px] flex-col rounded-2xl p-5 transition-transform hover:-translate-y-0.5 ${VARIANT_BG[variant]}`}
      >
        <p className={`text-[17px] font-extrabold ${VARIANT_TITLE[variant]}`}>
          {icon} {name}
        </p>
        {example && (
          <p className={`mt-1.5 flex-1 text-xs leading-relaxed ${VARIANT_TEXT[variant]}`}>
            {example}
          </p>
        )}
        <p className={`mt-2.5 text-xs font-bold ${VARIANT_TITLE[variant]}`}>
          {themeCount} thématiques →
        </p>
      </div>
    </Link>
  );
}
