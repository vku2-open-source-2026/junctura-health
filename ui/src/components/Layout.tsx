// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/** Page title with optional status badges, description, meta line and actions. One per screen (the h1). */
export function PageHeader({ title, description, meta, badges, actions, className }: { title: ReactNode; description?: ReactNode; meta?: ReactNode; badges?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-5", className)}>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
          {badges && <div className="flex flex-wrap items-center gap-1.5">{badges}</div>}
        </div>
        {description && <p className="max-w-3xl text-ink-2">{description}</p>}
        {meta && <div className="text-sm text-muted">{meta}</div>}
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
export function Section({ title, description, count, actions, children, className }: { title: string; description?: string; count?: number; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-ink">{title}{count !== undefined && <span className="ml-2 text-base font-normal text-muted">{count}</span>}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
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

/** Row of headline numbers as cards: for people who need to act, not admire a chart. */
export function StatStrip({ items }: { items: { label: string; value: ReactNode; tone?: "neutral" | "ok" | "warn" | "danger"; icon?: ReactNode; hint?: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map(item => (
        <div key={item.label} className="rounded-lg border border-line bg-surface p-4 shadow-card">
          <div className="flex items-start justify-between gap-2">
            <dt className="text-sm text-muted">{item.label}</dt>
            {item.icon && <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-2 text-ink-2">{item.icon}</span>}
          </div>
          <dd className={cn("mt-1 text-2xl font-bold tabular-nums tracking-tight", { neutral: "text-ink", ok: "text-ok", warn: "text-warn", danger: "text-danger" }[item.tone ?? "neutral"])}>{item.value}</dd>
          {item.hint && <p className="mt-0.5 text-xs text-muted">{item.hint}</p>}
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
