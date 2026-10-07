import { requireClient } from "@/lib/auth/session";
import ActuContent from "./ActuContent";

export default async function ActuPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    categorie?: string;
    rubrique?: string;
    q?: string;
    date?: string;
  }>;
}) {
  await requireClient();
  const sp = await searchParams;
  return (
    <ActuContent
      page={sp.page ? Number(sp.page) : 1}
      category={sp.categorie || null}
      tag={sp.rubrique || null}
      q={sp.q || null}
      date={sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : null}
    />
  );
}
