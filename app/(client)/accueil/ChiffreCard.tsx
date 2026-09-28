"use client";

import { useState } from "react";
import { Card } from "@/ui-kit/Card";

export interface KeyFigureHistory {
  year: number;
  note: string;
}

export default function ChiffreCard({
  label,
  currentNote,
  history,
}: {
  label: string;
  currentNote: string;
  history: KeyFigureHistory[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card padded={false} className="p-3">
      <button type="button" className="w-full text-left" onClick={() => setOpen((o) => !o)}>
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 font-mono text-lg font-semibold text-ink">{currentNote}</p>
        <p className="mt-1 text-xs text-primary">
          {open ? "Masquer l'historique" : "Historique →"}
        </p>
      </button>
      {open && (
        <table className="mt-2 w-full text-xs">
          <tbody>
            {history.map((h) => (
              <tr key={h.year} className="border-t border-border">
                <td className="py-1 text-muted">{h.year}</td>
                <td className="py-1 text-right font-mono text-ink">{h.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
