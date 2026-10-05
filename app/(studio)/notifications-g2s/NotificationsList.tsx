"use client";

import { useTransition } from "react";
import { Card } from "@/ui-kit/Card";
import { Button } from "@/ui-kit/Button";
import { markAdminNotificationRead, markAllAdminNotificationsRead } from "./actions";
import { NOTIFICATION_KIND_LABEL } from "@/lib/client/notification-kinds";

export interface AdminNotificationRow {
  id: string;
  kind: string;
  title: string;
  detail: string | null;
  read: boolean;
  created_at: string;
}

export default function NotificationsList({
  notifications,
}: {
  notifications: AdminNotificationRow[];
}) {
  const [, startTransition] = useTransition();
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div>
      {hasUnread && (
        <div className="mb-3 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => startTransition(() => markAllAdminNotificationsRead())}
          >
            Tout marquer comme lu
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card>
          <p className="text-sm text-studio-muted">Aucune notification pour l&apos;instant.</p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <Card className={n.read ? "opacity-60" : "border-studio-blue/40"}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-studio-muted">
                      {NOTIFICATION_KIND_LABEL[n.kind] ?? n.kind}
                    </p>
                    <p
                      className={`text-sm ${n.read ? "text-studio-muted" : "font-semibold text-studio-navy"}`}
                    >
                      {n.title}
                    </p>
                    {n.detail && <p className="mt-1 text-xs text-studio-muted">{n.detail}</p>}
                    <p className="mt-1 text-xs text-studio-muted">
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
                      className="shrink-0 text-xs text-studio-blue hover:underline"
                      onClick={() => startTransition(() => markAdminNotificationRead(n.id))}
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
