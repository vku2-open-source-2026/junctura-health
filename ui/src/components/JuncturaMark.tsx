// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { cn } from "../lib/cn";

/** The Junctura tile (same mark as Junctura Console) with the product name under the wordmark. The tile is decorative; the text names the product. */
export function JuncturaMark({ product, size = 32, showText = true, className }: { product?: string; size?: number; showText?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex select-none items-center gap-3", className)}>
      <svg aria-hidden width={size} height={size} viewBox="0 0 48 48" fill="none" className="shrink-0">
        <rect width="48" height="48" rx="10" fill="var(--jh-logo-tile)" />
        <path d="M17 12H34V17H31V27C31 32.5228 26.5228 37 21 37H15V32H21C23.7614 32 26 29.7614 26 27V17H17V12Z" fill="var(--jh-logo-blue)" />
        <circle cx="28.5" cy="22" r="3.2" fill="var(--jh-logo-green)" />
        <path d="M17 12H24V17H17V12Z" fill="var(--jh-logo-sand)" />
      </svg>
      {showText ? (
        <span className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight text-ink">Junctura</span>
          {product && <span className="text-xs font-medium uppercase tracking-wider text-muted">{product}</span>}
        </span>
      ) : <span className="sr-only">Junctura{product ? ` ${product}` : ""}</span>}
    </span>
  );
}
