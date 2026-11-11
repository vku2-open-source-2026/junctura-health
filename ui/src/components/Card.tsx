// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { useId, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  count?: number;
  actions?: ReactNode;
}

/** Titled surface. With a title it is a labelled region for screen readers. */
export function Card({ title, count, actions, className, children, ...rest }: CardProps) {
  const id = useId();
  return (
    <section aria-labelledby={title ? id : undefined} className={cn("rounded-lg border border-line bg-surface shadow-card", className)} {...rest}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
          <h2 id={id} className="text-base font-semibold tracking-tight text-ink">
            {title}
            {count !== undefined && <span className="ml-2 font-normal text-muted">({count})</span>}
          </h2>
          {actions}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
