"use client";

import { useActionState } from "react";
import { saveNotificationPreferences } from "./actions";
import { Button } from "@/ui-kit/Button";
import { Badge } from "@/ui-kit/Badge";
import {
  NOTIFICATION_PREFERENCE_GROUPS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_LABEL,
  DEFAULT_NOTIFICATION_CHANNEL,
  type NotificationChannel,
} from "@/lib/client/notification-kinds";

export default function NotificationPreferencesForm({
  channelByKind,
}: {
  channelByKind: Record<string, NotificationChannel>;
}) {
  const [message, formAction, pending] = useActionState(saveNotificationPreferences, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {NOTIFICATION_PREFERENCE_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {group.title}
          </p>
          <div className="flex flex-col gap-2">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink">{item.label}</span>
                  {!item.wired && <Badge tone="neutral">Pas encore de déclencheur réel</Badge>}
                </div>
                <select
                  aria-label={`Canal pour « ${item.label} »`}
                  name={`channel_${item.key}`}
                  defaultValue={channelByKind[item.key] ?? DEFAULT_NOTIFICATION_CHANNEL}
                  className="w-44 rounded-md border border-border bg-white px-3 py-1.5 text-sm text-ink"
                >
                  {NOTIFICATION_CHANNELS.map((c) => (
                    <option key={c} value={c}>
                      {NOTIFICATION_CHANNEL_LABEL[c]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="text-xs text-muted">
        Le canal « e-mail » est enregistré mais pas encore utilisé pour envoyer un vrai message :
        cette connexion (fournisseur d&apos;e-mail, comme pour la veille réglementaire) reste une
        évolution technique à activer.
      </p>

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending} className="self-start">
          {pending ? "..." : "Enregistrer mes préférences"}
        </Button>
        {message && (
          <p
            className={`text-xs ${message === "Préférences enregistrées." ? "text-success" : "text-danger"}`}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
