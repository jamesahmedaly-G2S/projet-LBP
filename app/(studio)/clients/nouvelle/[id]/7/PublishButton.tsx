"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishToClient } from "../../actions";
import { Button } from "@/ui-kit/Button";

export default function PublishButton({ companyId }: { companyId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="primary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await publishToClient(companyId);
          router.refresh();
        })
      }
    >
      {pending ? "Publication..." : "Publier vers l'espace client"}
    </Button>
  );
}
