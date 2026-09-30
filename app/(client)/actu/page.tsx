import { requireClient } from "@/lib/auth/session";
import ActuContent from "./ActuContent";

export default async function ActuPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; categorie?: string; q?: string }>;
}) {
  await requireClient();
  const sp = await searchParams;
  return (
    <ActuContent
      page={sp.page ? Number(sp.page) : 1}
      category={sp.categorie ?? null}
      q={sp.q ?? null}
    />
  );
}
