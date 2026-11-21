// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from "react";
import { cn, JuncturaMark } from "@junctura/health-ui";
import { SPACE_ROUTES } from "./routes";
import { spaceStrings as s } from "./strings";

/** Frame shared by the capability-space pages: mark, nav between the three routes, footer. */
export function SpacePage({ title, lead, current, children }: { title: string; lead?: string; current?: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-app text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
          <a href="#/" aria-label={s.product} className="rounded-md"><JuncturaMark product={s.product} size={30} /></a>
          <nav aria-label={s.nav.space} className="ml-auto flex gap-1">
            {SPACE_ROUTES.map(route => (
              <a
                key={route.path}
                href={`#${route.path}`}
                aria-current={route.path === current ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium",
                  route.path === current ? "bg-brand-soft text-brand" : "text-ink-2 hover:text-ink",
                )}
              >
                {route.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-lg text-ink-2">{lead}</p>}
        <div className="mt-8">{children}</div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-6 text-sm text-muted">© 2026 Junctura Contributors · Apache-2.0</div>
      </footer>
    </div>
  );
}
