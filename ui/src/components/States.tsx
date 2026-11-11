// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { CircleAlert, Inbox, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Button } from "./Button";

function StateFrame({ icon, title, children, action, role }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode; role?: "alert" | "status" }) {
  return (
    <div role={role} className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-lg border border-dashed border-line bg-surface px-6 py-10 text-center">
      <span aria-hidden className="grid size-11 place-items-center rounded-full bg-surface-2 text-muted">{icon}</span>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {children && <p className="text-sm text-ink-2">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Nothing to show yet: say what the user can do next. */
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <StateFrame icon={<Inbox className="size-5" />} title={title} action={action}>{children}</StateFrame>;
}

/** What happened, why if known, and what to do next. Never shows technical detail. */
export function ErrorState({ title = "Có lỗi xảy ra", children, onRetry }: { title?: string; children?: ReactNode; onRetry?: () => void }) {
  return (
    <StateFrame role="alert" icon={<CircleAlert className="size-5 text-danger" />} title={title}
      action={onRetry && <Button variant="secondary" onClick={onRetry}>Thử lại</Button>}>
      {children}
    </StateFrame>
  );
}

/** The signed-in person lacks the role, consent or access. Say who can grant it. */
export function PermissionState({ title = "Bạn chưa có quyền xem nội dung này", children }: { title?: string; children?: ReactNode }) {
  return <StateFrame icon={<Lock className="size-5" />} title={title}>{children}</StateFrame>;
}

/** Placeholder blocks while data loads; announced once as "Đang tải". */
export function Skeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("space-y-3", className)}>
      <span className="sr-only">Đang tải</span>
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} aria-hidden className="h-4 animate-[jh-pulse_1.6s_ease-in-out_infinite] rounded bg-surface-2" style={{ width: `${100 - (index % 3) * 18}%` }} />
      ))}
    </div>
  );
}
