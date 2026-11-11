// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";

/** Identifier (CT-…, DT-…, HS-…) in a monospace chip with a copy button. */
export function IdChip({ value, label, className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable: the value stays selectable on screen */
    }
  };

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 py-0.5 pl-2 pr-0.5 font-mono text-xs text-ink-2", className)}>
      <span>{value}</span>
      <button type="button" onClick={copy} aria-label={`${copied ? "Đã sao chép" : "Sao chép"} ${label ?? value}`}
        className="grid size-6 place-items-center rounded text-muted hover:bg-brand-soft hover:text-brand">
        {copied ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
      </button>
      <span role="status" className="sr-only">{copied ? "Đã sao chép" : ""}</span>
    </span>
  );
}
