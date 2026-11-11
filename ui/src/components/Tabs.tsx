// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface TabItem { id: string; label: string; count?: number }

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  /** Set the same value on each <TabPanel tabsId> so tabs and panels reference each other. */
  idBase?: string;
  className?: string;
}

/** Tab list with roving focus: arrow keys, Home and End move between tabs. */
export function Tabs({ items, value, onChange, label, idBase, className }: TabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const generated = useId();
  const base = idBase ?? generated;
  const move = (event: KeyboardEvent, index: number) => {
    const last = items.length - 1;
    const next = event.key === "ArrowRight" ? (index + 1) % items.length : event.key === "ArrowLeft" ? (index - 1 + items.length) % items.length
      : event.key === "Home" ? 0 : event.key === "End" ? last : -1;
    if (next < 0) return;
    event.preventDefault();
    refs.current[next]?.focus();
    onChange(items[next].id);
  };
  return (
    <div role="tablist" aria-label={label} className={cn("flex gap-1 overflow-x-auto border-b border-line", className)}>
      {items.map((item, index) => {
        const selected = item.id === value;
        return (
          <button key={item.id} ref={node => { refs.current[index] = node; }} role="tab" type="button" id={`${base}-${item.id}`} aria-selected={selected}
            aria-controls={idBase ? `${base}-${item.id}-panel` : undefined} tabIndex={selected ? 0 : -1} onClick={() => onChange(item.id)} onKeyDown={event => move(event, index)}
            className={cn("-mb-px min-h-10 shrink-0 border-b-2 px-3.5 text-sm font-medium transition-colors",
              selected ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink")}>
            {item.label}
            {item.count !== undefined && <span className="ml-1.5 rounded-full bg-surface-2 px-1.5 text-xs text-ink-2">{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ tabsId, id, hidden, children }: { tabsId?: string; id: string; hidden?: boolean; children: ReactNode }) {
  return <div role="tabpanel" id={tabsId ? `${tabsId}-${id}-panel` : undefined} hidden={hidden} tabIndex={0}>{children}</div>;
}
