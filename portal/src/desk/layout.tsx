// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from "react";
import { AppShell, type NavGroup } from "@junctura/health-ui";
import {
  ArrowLeftRight, BookUser, ClipboardList, Database, FilePlus2, LayoutDashboard, Megaphone, Network, Sun,
} from "lucide-react";
import { DESK_ROUTES } from "./routes";
import { deskStrings as s, facilityLabel } from "./strings";
import { useDesk } from "./context";

const ICONS: Record<string, ReactNode> = {
  "/lam-viec": <Sun className="size-4" />,
  "/lam-viec/bang-tin": <Megaphone className="size-4" />,
  "/lam-viec/danh-ba": <BookUser className="size-4" />,
  "/ho-so": <ClipboardList className="size-4" />,
  "/ho-so/mo": <FilePlus2 className="size-4" />,
  "/dieu-hanh": <LayoutDashboard className="size-4" />,
  "/dieu-hanh/trao-doi": <ArrowLeftRight className="size-4" />,
  "/dieu-hanh/du-lieu": <Database className="size-4" />,
  "/dieu-hanh/chia-se": <Network className="size-4" />,
};

const NAV: NavGroup[] = DESK_ROUTES.map(group => ({
  label: group.label,
  items: group.children.map(child => ({ id: child.path, label: child.label, icon: ICONS[child.path] })),
}));
const ITEM_IDS = NAV.flatMap(group => group.items.map(item => item.id));

/** The menu item a page belongs to: its own path, or the closest parent (a case detail sits under the case list). */
function menuItemFor(current: string | undefined): string {
  if (!current) return ITEM_IDS[0];
  if (ITEM_IDS.includes(current)) return current;
  return [...ITEM_IDS].sort((a, b) => b.length - a.length).find(id => current.startsWith(`${id}/`)) ?? ITEM_IDS[0];
}

/**
 * Frame of every signed-in page: the shared app shell (side menu in three groups, breadcrumbs,
 * account menu with text size and theme, bottom bar on phones), then the page title and content.
 */
export function DeskPage({ title, lead, current, children }: { title: string; lead?: string; current?: string; children: ReactNode }) {
  const { staff, signOut } = useDesk();
  const item = menuItemFor(current);
  const extra = current && current !== item ? [title] : undefined;
  return (
    <AppShell
      product={s.product}
      nav={NAV}
      current={item}
      onNavigate={id => { window.location.hash = `#${id}`; }}
      user={{ name: staff.displayName, unit: facilityLabel(staff.facility) }}
      onSignOut={signOut}
      breadcrumbs={extra}
    >
      <div className="py-4 sm:py-6">
        <h1 className="max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {lead && <p className="mt-2 max-w-3xl text-ink-2">{lead}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </AppShell>
  );
}
