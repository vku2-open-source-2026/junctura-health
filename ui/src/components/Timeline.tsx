// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatDateTime } from "../lib/format";
import type { Tone } from "./Badge";

export interface TimelineItem {
  id: string;
  time: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: Tone;
}

const DOT: Record<Tone, string> = {
  neutral: "bg-control", brand: "bg-brand", ok: "bg-ok", warn: "bg-warn", danger: "bg-danger",
};

/** Newest-first list of events (visits, access log). */
export function Timeline({ items, label }: { items: TimelineItem[]; label: string }) {
  return (
    <ol aria-label={label} className="relative space-y-5 border-l border-line pl-5">
      {items.map(item => (
        <li key={item.id} className="relative">
          <span aria-hidden className={cn("absolute -left-[1.62rem] top-1.5 size-2.5 rounded-full ring-4 ring-surface", DOT[item.tone ?? "neutral"])} />
          <p className="text-xs text-muted"><time dateTime={item.time}>{formatDateTime(item.time)}</time></p>
          <p className="font-medium text-ink">{item.title}</p>
          {item.description && <p className="text-sm text-ink-2">{item.description}</p>}
        </li>
      ))}
    </ol>
  );
}
