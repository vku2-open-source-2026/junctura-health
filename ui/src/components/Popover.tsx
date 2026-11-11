// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface PopoverProps {
  /** Accessible name of the opened panel. */
  label: string;
  trigger: ReactNode;
  /** The trigger button's accessible name when its content is only an icon. */
  triggerLabel?: string;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  /** Open above (for triggers at the bottom of the screen) or below the button. */
  side?: "top" | "bottom";
  triggerClassName?: string;
  panelClassName?: string;
}

/** Button plus floating panel. Esc and outside click close it and focus returns to the button. */
export function Popover({ label, trigger, triggerLabel, children, align = "start", side = "bottom", triggerClassName, panelClassName }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const close = () => { setOpen(false); button.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); setOpen(false); button.current?.focus(); } };
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    root.current?.querySelector<HTMLElement>("[data-panel] button, [data-panel] a, [data-panel] [tabindex]")?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button ref={button} type="button" aria-haspopup="true" aria-expanded={open} aria-controls={open ? panelId : undefined} aria-label={triggerLabel}
        onClick={() => setOpen(value => !value)} className={triggerClassName}>
        {trigger}
      </button>
      {open && (
        <div id={panelId} data-panel role="group" aria-label={label}
          className={cn(side === "top" ? "bottom-full mb-1.5" : "mt-1.5", "absolute z-40 min-w-60 rounded-lg border border-line bg-surface p-1.5 text-ink shadow-pop", align === "end" ? "right-0" : "left-0", panelClassName)}>
          {children(close)}
        </div>
      )}
    </div>
  );
}
