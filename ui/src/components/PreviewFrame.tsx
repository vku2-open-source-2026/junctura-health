// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/** Window-like frame for a small picture of an app on a landing page. Not interactive: screen readers get `label` instead of the contents. */
export function PreviewFrame({ label, title, children, className }: { label: string; title?: string; children: ReactNode; className?: string }) {
  return (
    <figure role="img" aria-label={label} className={cn("overflow-hidden rounded-lg border border-line bg-surface shadow-pop", className)}>
      <div aria-hidden className="flex items-center gap-1.5 border-b border-line bg-surface-2 px-3 py-2">
        <span className="size-2.5 rounded-full bg-danger/60" /><span className="size-2.5 rounded-full bg-warn/60" /><span className="size-2.5 rounded-full bg-ok/60" />
        {title && <span className="ml-2 truncate text-xs text-muted">{title}</span>}
      </div>
      <div aria-hidden inert className="pointer-events-none select-none p-4">{children}</div>
    </figure>
  );
}
