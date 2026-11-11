// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/** Page title with optional description, meta line and actions. One per screen (the h1). */
export function PageHeader({ title, description, meta, actions, className }: { title: ReactNode; description?: ReactNode; meta?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-ink-2">{description}</p>}
        {meta && <div className="mt-1 text-sm text-muted">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Main column plus a side rail. The rail drops below the main column on narrow screens. */
export function WorkspaceLayout({ children, aside, asideLabel = "Thông tin bên cạnh" }: { children: ReactNode; aside?: ReactNode; asideLabel?: string }) {
  return (
    <div className={cn("grid gap-6", aside ? "xl:grid-cols-[minmax(0,1fr)_20rem]" : undefined)}>
      <div className="min-w-0 space-y-6">{children}</div>
      {aside && <aside aria-label={asideLabel} className="min-w-0 space-y-5 xl:sticky xl:top-24 xl:self-start">{aside}</aside>}
    </div>
  );
}

/** Lightweight section: a heading, optional count and actions, then content. No box around it. */
export function Section({ title, count, actions, children, className }: { title: string; count?: number; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{title}{count !== undefined && <span className="ml-2 font-normal text-muted">{count}</span>}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

/** Form block: title and help on the left, fields on the right (stacked on narrow screens). */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="grid gap-4 border-t border-line pt-5 first:border-t-0 first:pt-0 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <div>
        <h3 className="font-semibold text-ink">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** One line of headline numbers. For people who need to act, not admire a chart. */
export function StatStrip({ items }: { items: { label: string; value: ReactNode; tone?: "neutral" | "ok" | "warn" | "danger" }[] }) {
  const TONE = { neutral: "text-ink", ok: "text-ok", warn: "text-warn", danger: "text-danger" };
  return (
    <dl className="flex flex-wrap divide-x divide-line rounded-xl border border-line bg-surface">
      {items.map(item => (
        <div key={item.label} className="flex-1 basis-32 px-4 py-2.5">
          <dt className="text-sm text-muted">{item.label}</dt>
          <dd className={cn("text-2xl font-semibold tabular-nums", TONE[item.tone ?? "neutral"])}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Radio-style filter: exactly one option is selected. */
export function SegmentedControl<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (value: T) => void; options: { value: T; label: string; count?: number }[] }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-lg bg-surface-2 p-1">
      {options.map(option => {
        const selected = option.value === value;
        return (
          <button key={option.value} type="button" role="radio" aria-checked={selected} onClick={() => onChange(option.value)}
            className={cn("min-h-8 rounded-md px-3 text-sm font-medium", selected ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink")}>
            {option.label}{option.count !== undefined && <span className="ml-1.5 text-muted">{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
