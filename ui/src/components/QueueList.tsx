// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { Clock, PhoneCall } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Badge } from "./Badge";
import { Button } from "./Button";

export type QueuePriority = "urgent" | "child" | "elder";
const PRIORITY: Record<QueuePriority, { label: string; tone: "danger" | "warn" | "brand" }> = {
  urgent: { label: "Khẩn", tone: "danger" }, child: { label: "Trẻ nhỏ", tone: "warn" }, elder: { label: "Cao tuổi", tone: "brand" },
};

export interface QueueItem {
  id: string;
  ticket: string;
  name: string;
  meta?: string;
  priority?: QueuePriority;
  /** ISO time the person joined the queue; shows "Chờ n phút". */
  since?: string;
  /** Extra flags, e.g. an allergy badge. */
  flags?: ReactNode;
  note?: string;
}

export interface QueueListProps {
  items: QueueItem[];
  label: string;
  onCall?: (item: QueueItem) => void;
  onOpen?: (item: QueueItem) => void;
  callLabel?: string;
  openLabel?: string;
  /** Minutes after which waiting is flagged. */
  warnAfter?: number;
  now?: Date;
  empty?: ReactNode;
  /** Narrow layout for side rails: stacked, no wrapping name. */
  compact?: boolean;
}

export const minutesWaiting = (since: string | undefined, now: Date = new Date()): number | null => {
  if (!since) return null;
  const time = Date.parse(since);
  return Number.isNaN(time) ? null : Math.max(0, Math.round((now.getTime() - time) / 60000));
};

/** People in line as action rows, not a table: ticket, who, why they matter, how long, one button. */
export function QueueList({ items, label, onCall, onOpen, callLabel = "Gọi vào", openLabel = "Mở hồ sơ", warnAfter = 30, now, empty, compact = false }: QueueListProps) {
  if (items.length === 0) return <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-muted">{empty ?? "Không có ai trong hàng."}</p>;
  return (
    <ul aria-label={label} className="divide-y divide-line rounded-lg border border-line bg-surface">
      {items.map(item => {
        const waited = minutesWaiting(item.since, now);
        const slow = waited !== null && waited >= warnAfter;
        return (
          <li key={item.id} className={cn("px-4 py-3", compact ? "space-y-1.5" : "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4")}>
            <div className={cn("flex min-w-0 items-center gap-3", !compact && "flex-1")}>
              <span aria-label={`Số ${item.ticket}`} className={cn("grid shrink-0 place-items-center rounded-lg bg-brand-soft font-mono font-semibold text-brand", compact ? "size-9 text-base" : "size-11 text-lg")}>{item.ticket}</span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{item.name}</span>
                  {item.priority && <Badge tone={PRIORITY[item.priority].tone}>{PRIORITY[item.priority].label}</Badge>}
                  {item.flags}
                </p>
                <p className="text-sm text-muted">{[item.meta, item.note].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            {waited !== null && (
              <span className={cn("inline-flex items-center gap-1 text-sm", compact && "pl-12", slow ? "font-medium text-warn" : "text-muted")}>
                <Clock aria-hidden className="size-3.5" />Chờ {waited} phút{slow ? " (lâu)" : ""}
              </span>
            )}
            {(onCall || onOpen) && (
              <div className={cn("flex gap-2", compact && "pl-12")}>
                {onCall && <Button size="md" icon={<PhoneCall aria-hidden className="size-4" />} onClick={() => onCall(item)} aria-label={`${callLabel}: ${item.name}`}>{callLabel}</Button>}
                {onOpen && <Button size="md" variant="secondary" onClick={() => onOpen(item)} aria-label={`${openLabel}: ${item.name}`}>{openLabel}</Button>}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export interface ActionItem { id: string; tone: "danger" | "warn" | "brand" | "neutral"; title: string; detail?: string; actionLabel?: string; onAction?: () => void }

/** "Cần xử lý": what is waiting on this person, each with the action that clears it. */
export function ActionList({ items, label, empty = "Không có việc tồn đọng." }: { items: ActionItem[]; label: string; empty?: string }) {
  const BAR = { danger: "bg-danger", warn: "bg-warn", brand: "bg-brand", neutral: "bg-control" };
  if (items.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul aria-label={label} className="space-y-2">
      {items.map(item => (
        <li key={item.id} className="flex items-stretch gap-3 rounded-lg border border-line bg-surface">
          <span aria-hidden className={cn("w-1 shrink-0 rounded-l-lg", BAR[item.tone])} />
          <div className="min-w-0 flex-1 py-2">
            <p className="font-medium text-ink">{item.title}</p>
            {item.detail && <p className="text-sm text-muted">{item.detail}</p>}
          </div>
          {item.actionLabel && <button type="button" onClick={item.onAction} className="self-center px-3 text-sm font-medium text-brand underline underline-offset-2">{item.actionLabel}</button>}
        </li>
      ))}
    </ul>
  );
}
