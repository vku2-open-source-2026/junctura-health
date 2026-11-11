// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import type { Tone } from "./Badge";

const VALUE: Record<Tone, string> = { neutral: "text-ink", brand: "text-brand", ok: "text-ok", warn: "text-warn", danger: "text-danger" };

/** One headline number with a label and an optional explanation. */
export function StatCard({ label, value, hint, tone = "neutral", icon }: { label: string; value: ReactNode; hint?: string; tone?: Tone; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2 text-sm text-muted">
        <span>{label}</span>
        {icon && <span aria-hidden>{icon}</span>}
      </div>
      <p className={cn("mt-1 text-3xl font-semibold tabular-nums", VALUE[tone])}>{value}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}
