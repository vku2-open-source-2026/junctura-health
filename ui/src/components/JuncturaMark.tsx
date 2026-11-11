// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { cn } from "../lib/cn";

/** Wordmark with a simple junction glyph. Decorative glyph; the text names the product. */
export function JuncturaMark({ product, className }: { product?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold text-ink", className)}>
      <svg aria-hidden viewBox="0 0 24 24" className="size-6 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
        <path d="M12 9V3M9.4 13.5 4 17M14.6 13.5 20 17" />
      </svg>
      <span>Junctura{product && <span className="font-normal text-muted"> · {product}</span>}</span>
    </span>
  );
}
