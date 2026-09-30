import { requireClient } from "@/lib/auth/session";
import SearchResultsContent from "./SearchResultsContent";

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireClient();
  const sp = await searchParams;

  return <SearchResultsContent q={sp.q ?? ""} companyId={session.profile.company_id} />;
}
