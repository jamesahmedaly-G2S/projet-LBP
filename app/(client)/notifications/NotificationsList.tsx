"use client";

import { useTransition } from "react";
import { Card } from "@/ui-kit/Card";
import { Button } from "@/ui-kit/Button";
import { markNotificationRead, markAllNotificationsRead } from "./actions";

export interface NotificationRow {
  id: string;
  kind: string;
  title: string;
  detail: string | null;
  read: boolean;
  created_at: string;
}

const KIND_LABEL: Record<string, string> = {
  "chiffres-paie": "Chiffres Paie",
  dictionnaire: "Dictionnaire",
  offres: "Offres",
  actu: "Actu",
  "calendrier-rh": "Calendrier RH",
};

export default function NotificationsList({ notifications }: { notifications: NotificationRow[] }) {
  const [, startTransition] = useTransition();
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="mt-6">
      {hasUnread && (
        <div className="mb-3 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => startTransition(() => markAllNotificationsRead())}
          >
            Tout marquer comme lu
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Aucune notification pour l&apos;instant.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <Card className={n.read ? "opacity-60" : "border-primary/40"}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted">
                      {KIND_LABEL[n.kind] ?? n.kind}
                    </p>
                    <p className={`text-sm ${n.read ? "text-muted" : "font-semibold text-ink"}`}>
                      {n.title}
                    </p>
                    {n.detail && <p className="mt-1 text-xs text-muted">{n.detail}</p>}
                    <p className="mt-1 text-xs text-muted">
                      {new Date(n.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      className="shrink-0 text-xs text-primary hover:underline"
                      onClick={() => startTransition(() => markNotificationRead(n.id))}
                    >
                      Marquer comme lu
                    </button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
