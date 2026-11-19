// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from "react";
import { Button, cn, JuncturaMark } from "@junctura/health-ui";
import { DESK_ROUTES } from "./routes";
import { deskStrings as s, facilityLabel } from "./strings";
import { useDesk } from "./context";

/** Frame shared by the desk pages: mark, nav between the desk routes, staff and sign-out, footer. */
export function DeskPage({ title, lead, current, children }: { title: string; lead?: string; current?: string; children: ReactNode }) {
  const { staff, signOut } = useDesk();
  return (
    <div className="min-h-dvh bg-app text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
          <a href="#/" aria-label={s.product} className="rounded-md"><JuncturaMark product={s.product} size={30} /></a>
          <nav aria-label={s.nav.desk} className="flex gap-1">
            {DESK_ROUTES.map(route => (
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
          <div className="ml-auto flex items-center gap-3">
            <p className="text-sm text-ink-2">
              <span className="sr-only">{s.nav.signedInAs}: </span>
              <span className="font-medium text-ink">{staff.displayName}</span> · {facilityLabel(staff.facility)}
            </p>
            <Button variant="secondary" size="md" onClick={signOut}>{s.nav.signOut}</Button>
          </div>
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
