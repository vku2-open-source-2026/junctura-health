// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Button } from "./Button";
import { TextSizeSelector, ThemeToggle } from "./DisplayPrefs";
import { JuncturaMark } from "./JuncturaMark";

export interface NavItem { id: string; label: string; icon?: ReactNode; count?: number }

export interface AppShellProps {
  product: string;
  nav: NavItem[];
  current: string;
  onNavigate: (id: string) => void;
  user?: { name: string; role?: string; unit?: string };
  onSignOut?: () => void;
  banner?: ReactNode;
  children: ReactNode;
}

/** Skip link, header with user and display controls, side navigation on wide screens, bottom bar on narrow ones. */
export function AppShell({ product, nav, current, onNavigate, user, onSignOut, banner, children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-app text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-on-brand">Bỏ qua điều hướng</a>
      {banner}
      <header className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-5 py-2.5">
        <JuncturaMark product={product} />
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <TextSizeSelector />
          <ThemeToggle />
          {user && (
            <div className="text-right text-sm leading-tight">
              <p className="font-medium">{user.name}</p>
              {(user.role || user.unit) && <p className="text-muted">{[user.role, user.unit].filter(Boolean).join(" · ")}</p>}
            </div>
          )}
          {onSignOut && <Button variant="secondary" icon={<LogOut aria-hidden className="size-4" />} onClick={onSignOut}>Đăng xuất</Button>}
        </div>
      </header>
      <div className="md:grid md:grid-cols-[13.5rem_1fr]">
        <nav aria-label="Chức năng chính" className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line bg-surface md:sticky md:top-0 md:h-[calc(100dvh-3.5rem)] md:flex-col md:justify-start md:gap-1 md:border-r md:border-t-0 md:p-3">
          {nav.map(item => {
            const active = item.id === current;
            return (
              <button key={item.id} type="button" aria-current={active ? "page" : undefined} onClick={() => onNavigate(item.id)}
                className={cn("flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 px-2 text-xs font-medium md:flex-none md:flex-row md:justify-start md:gap-2.5 md:rounded-lg md:px-3 md:text-sm",
                  active ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2")}>
                {item.icon && <span aria-hidden>{item.icon}</span>}
                <span>{item.label}</span>
                {item.count !== undefined && <span className="rounded-full bg-surface-2 px-1.5 text-xs md:ml-auto">{item.count}</span>}
              </button>
            );
          })}
        </nav>
        <main id="main" tabIndex={-1} className="min-w-0 pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
