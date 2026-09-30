import { requireClient } from "@/lib/auth/session";
import ArticleDetailContent from "./ArticleDetailContent";

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireClient();
  const { id } = await params;
  return <ArticleDetailContent id={id} />;
}
