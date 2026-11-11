// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { CircleAlert, Info, OctagonAlert, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { formatDate, isStale } from "../lib/format";
import { Badge, TONE_BOX, type Tone } from "./Badge";

export type AlertLevel = "critical" | "warning" | "notice" | "info";

const LEVEL: Record<AlertLevel, { label: string; tone: Tone; Icon: typeof Info; role: "alert" | "status" }> = {
  critical: { label: "Nghiêm trọng", tone: "danger", Icon: OctagonAlert, role: "alert" },
  warning: { label: "Cảnh báo", tone: "warn", Icon: TriangleAlert, role: "alert" },
  notice: { label: "Lưu ý", tone: "brand", Icon: CircleAlert, role: "status" },
  info: { label: "Thông tin", tone: "neutral", Icon: Info, role: "status" },
};

export const alertLevelLabel = (level: AlertLevel) => LEVEL[level].label;

/** Four fixed levels. Level is always conveyed by icon + text + colour, never colour alone. */
export function AlertBanner({ level, title, children, action, className }: { level: AlertLevel; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  const { label, tone, Icon, role } = LEVEL[level];
  return (
    <div role={role} className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", TONE_BOX[tone], className)}>
      <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
        <p className="font-semibold text-ink">{title}</p>
        {children && <div className="mt-0.5 text-sm text-ink">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export type AllergyState = "recorded" | "none-known" | "not-recorded" | "unavailable";

const ALLERGY: Record<AllergyState, { label: string; tone: Tone }> = {
  recorded: { label: "Có dị ứng đã ghi nhận", tone: "danger" },
  "none-known": { label: "Không có dị ứng đã biết", tone: "ok" },
  "not-recorded": { label: "Chưa ghi nhận dị ứng", tone: "warn" },
  unavailable: { label: "Không xem được dị ứng", tone: "neutral" },
};

/** "Not recorded" and "no known allergy" are different facts and must never share a label. */
export function AllergyStatus({ state, items = [], reason }: { state: AllergyState; items?: string[]; reason?: string }) {
  const { label, tone } = ALLERGY[state];
  return (
    <div className={cn("rounded-lg border px-3 py-2", TONE_BOX[tone])}>
      <p className="text-sm font-semibold">{label}</p>
      {state === "recorded" && items.length > 0 && <p className="text-sm text-ink">{items.join(", ")}</p>}
      {state === "unavailable" && reason && <p className="text-sm text-ink-2">{reason}</p>}
    </div>
  );
}

/** Where the data came from: system and issuing unit. */
export function SourceBadge({ source, unit }: { source: string; unit?: string }) {
  return <Badge tone="neutral">Nguồn: {source}{unit ? ` · ${unit}` : ""}</Badge>;
}

/** Shows the data date; warns in text when older than the threshold. */
export function StaleNotice({ updatedAt, maxAgeDays = 365, now }: { updatedAt: string | null | undefined; maxAgeDays?: number; now?: Date }) {
  const stale = isStale(updatedAt, maxAgeDays, now);
  return (
    <Badge tone={stale ? "warn" : "neutral"} icon={stale ? <TriangleAlert aria-hidden className="size-3" /> : undefined}>
      {updatedAt ? `Cập nhật ${formatDate(updatedAt)}` : "Chưa rõ ngày cập nhật"}{stale && updatedAt ? " · có thể đã cũ" : ""}
    </Badge>
  );
}

export type ConsentState = "granted" | "denied" | "expired" | "unknown";
const CONSENT: Record<ConsentState, { label: string; tone: Tone }> = {
  granted: { label: "Đã đồng ý chia sẻ", tone: "ok" },
  denied: { label: "Không đồng ý chia sẻ", tone: "danger" },
  expired: { label: "Đồng ý đã hết hạn", tone: "warn" },
  unknown: { label: "Chưa rõ đồng ý", tone: "neutral" },
};
export function ConsentBadge({ state }: { state: ConsentState }) {
  const { label, tone } = CONSENT[state];
  return <Badge tone={tone}>{label}</Badge>;
}
