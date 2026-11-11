// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { Bell, Building2, ChevronRight, ChevronsUpDown, Ellipsis, LogOut, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Badge, type Tone } from "./Badge";
import { Button } from "./Button";
import { CommandSearch, type CommandSearchProps } from "./CommandSearch";
import { Dialog } from "./Dialog";
import { TextSizeSelector, ThemeToggle } from "./DisplayPrefs";
import { JuncturaMark } from "./JuncturaMark";
import { Popover } from "./Popover";

export interface NavItem { id: string; label: string; icon?: ReactNode; count?: number }
export interface NavGroup { label?: string; items: NavItem[] }
export interface Station { id: string; name: string; detail?: string }
export interface ShellNotification { id: string; title: string; detail?: string; time?: string; tone?: Tone; onClick?: () => void }

export interface AppShellProps {
  product: string;
  /** Flat list (0.1) or groups with headings. */
  nav: NavItem[] | NavGroup[];
  current: string;
  onNavigate: (id: string) => void;
  /** Organisation and working stations; the switcher is shown when there is more than one station. */
  unit?: { name: string; stations?: Station[]; currentStationId?: string; onStationChange?: (id: string) => void };
  user?: { name: string; role?: string; unit?: string };
  onSignOut?: () => void;
  /** Quick find (opens with "/" or Ctrl+K). */
  search?: Pick<CommandSearchProps, "onSearch" | "onSelect" | "placeholder" | "hint">;
  notifications?: ShellNotification[];
  /** Persistent strip above everything, e.g. EmergencyBar. */
  banner?: ReactNode;
  /** Extra breadcrumb levels after the current section, e.g. the name of the open record. */
  breadcrumbs?: string[];
  /** Status pills at the right of the top bar (unit, mode, connection). */
  status?: ReactNode;
  children: ReactNode;
}

const isGroups = (nav: NavItem[] | NavGroup[]): nav is NavGroup[] => nav.length > 0 && "items" in nav[0];
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(-2).map(part => part[0]).join("").toUpperCase();

function NavButton({ item, active, collapsed, onClick }: { item: NavItem; active: boolean; collapsed: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-current={active ? "page" : undefined} onClick={onClick} title={collapsed ? item.label : undefined}
      className={cn("relative flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium", collapsed && "justify-center px-0",
        active ? "bg-brand-soft font-semibold text-brand before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-brand before:content-['']" : "text-ink-2 hover:bg-brand-soft/60")}>
      {item.icon && <span aria-hidden className="shrink-0">{item.icon}</span>}
      <span className={cn("min-w-0 flex-1 truncate", collapsed && "sr-only")}>{item.label}</span>
      {item.count !== undefined && item.count > 0 && <span className={cn("rounded-full bg-surface-2 px-1.5 text-xs tabular-nums", collapsed && "sr-only")}>{item.count}</span>}
    </button>
  );
}

function StationSwitcher({ unit, collapsed }: { unit: NonNullable<AppShellProps["unit"]>; collapsed: boolean }) {
  const stations = unit.stations ?? [];
  const current = stations.find(station => station.id === unit.currentStationId) ?? stations[0];
  const body = (
    <>
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-on-brand"><Building2 className="size-4" /></span>
      <span className={cn("min-w-0 flex-1 text-left", collapsed && "sr-only")}>
        <span className="block truncate text-sm font-semibold text-ink">{current?.name ?? unit.name}</span>
        <span className="block truncate text-xs text-muted">{current ? unit.name : "Đơn vị"}</span>
      </span>
    </>
  );
  if (stations.length <= 1) return <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">{body}</div>;
  return (
    <Popover label="Chọn trạm làm việc" triggerLabel={`Trạm đang làm việc: ${current?.name}. Đổi trạm`} panelClassName="w-64"
      triggerClassName="flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface px-2 py-1.5 hover:bg-surface-2"
      trigger={<>{body}<ChevronsUpDown aria-hidden className={cn("size-4 shrink-0 text-muted", collapsed && "hidden")} /></>}>
      {close => (
        <ul className="space-y-0.5">
          {stations.map(station => (
            <li key={station.id}>
              <button type="button" aria-current={station.id === current?.id ? "true" : undefined} onClick={() => { unit.onStationChange?.(station.id); close(); }}
                className={cn("w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2", station.id === current?.id && "bg-brand-soft")}>
                <span className="block font-medium text-ink">{station.name}</span>
                {station.detail && <span className="block text-xs text-muted">{station.detail}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}

function UserMenu({ user, onSignOut, collapsed, side }: { user: NonNullable<AppShellProps["user"]>; onSignOut?: () => void; collapsed?: boolean; side: "top" | "bottom" }) {
  return (
    <Popover label="Tài khoản và hiển thị" side={side} align={side === "top" ? "start" : "end"} panelClassName="w-72" triggerLabel={`Tài khoản ${user.name}`}
      triggerClassName="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-surface-2"
      trigger={<>
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-ink-2">{initials(user.name)}</span>
        <span className={cn("min-w-0 flex-1", collapsed && "sr-only")}>
          <span className="block truncate text-sm font-medium text-ink">{user.name}</span>
          <span className="block truncate text-xs text-muted">{[user.role, user.unit].filter(Boolean).join(" · ")}</span>
        </span>
      </>}>
      {() => (
        <div className="space-y-3 p-2">
          <div><p className="font-semibold text-ink">{user.name}</p><p className="text-sm text-muted">{[user.role, user.unit].filter(Boolean).join(" · ")}</p></div>
          <div className="flex items-center justify-between gap-3"><span className="text-sm text-ink-2">Cỡ chữ</span><TextSizeSelector /></div>
          <div className="flex items-center justify-between gap-3"><span className="text-sm text-ink-2">Giao diện tối</span><ThemeToggle /></div>
          {onSignOut && <Button variant="secondary" className="w-full" icon={<LogOut aria-hidden className="size-4" />} onClick={onSignOut}>Đăng xuất</Button>}
        </div>
      )}
    </Popover>
  );
}

function Notifications({ items }: { items: ShellNotification[] }) {
  return (
    <Popover label="Thông báo" align="end" panelClassName="w-80" triggerLabel={`Thông báo, ${items.length} mục`}
      triggerClassName="relative grid size-9 place-items-center rounded-full border border-line bg-surface hover:border-brand"
      trigger={<><Bell aria-hidden className="size-4" />{items.length > 0 && <span aria-hidden className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-on-danger">{items.length}</span>}</>}>
      {close => items.length === 0 ? <p className="p-3 text-sm text-muted">Không có thông báo mới.</p> : (
        <ul className="max-h-80 divide-y divide-line overflow-y-auto">
          {items.map(item => (
            <li key={item.id}>
              <button type="button" onClick={() => { item.onClick?.(); close(); }} className="w-full px-3 py-2 text-left hover:bg-surface-2">
                <span className="flex items-center gap-2 text-sm font-medium text-ink">{item.tone && item.tone !== "neutral" && <Badge tone={item.tone}>{item.tone === "danger" ? "Quan trọng" : "Lưu ý"}</Badge>}{item.title}</span>
                {item.detail && <span className="block text-sm text-muted">{item.detail}</span>}
                {item.time && <span className="block text-xs text-muted">{item.time}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}

/**
 * Application frame. Wide screens: side navigation (groups, station switcher, account) and a top bar with quick find and notifications.
 * Narrow screens: bottom navigation. Content scrolls under a sticky top bar; the patient banner sticks just below it.
 */
export function AppShell({ product, nav, current, onNavigate, unit, user, onSignOut, search, notifications, banner, breadcrumbs, status, children }: AppShellProps) {
  const groups: NavGroup[] = isGroups(nav) ? nav : [{ items: nav }];
  const flat = groups.flatMap(group => group.items);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!search) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable);
      if ((event.key === "/" && !typing) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k")) { event.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [search]);

  const mobile = flat.length > 5 ? flat.slice(0, 4) : flat;
  const rest = flat.length > 5 ? flat.slice(4) : [];
  const go = (id: string) => { setMoreOpen(false); onNavigate(id); };

  const section = groups.find(group => group.items.some(item => item.id === current));
  const currentItem = flat.find(item => item.id === current);
  const trail = [section?.label, currentItem?.label, ...(breadcrumbs ?? [])].filter((part, index, all): part is string => Boolean(part) && part !== all[index - 1]);
  const pill = "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface px-3 text-sm text-ink hover:border-brand";

  return (
    <div className="min-h-dvh bg-app text-ink" style={{ "--jh-topbar": "3.5rem" } as React.CSSProperties}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-on-brand">Bỏ qua điều hướng</a>
      {banner}
      <div className="hidden md:block">
        <aside aria-label="Điều hướng" className={cn("fixed inset-y-3 left-3 z-40 flex select-none flex-col rounded-lg border border-line bg-surface shadow-pop transition-[width] duration-300", collapsed ? "w-[4.5rem]" : "w-64")}>
          <div className={cn("flex items-center border-b border-line p-3", collapsed ? "justify-center" : "justify-between")}>
            <JuncturaMark product={product} size={30} showText={!collapsed} />
          </div>
          <nav aria-label="Chức năng chính" className="flex-1 space-y-4 overflow-y-auto p-2">
            {unit && <StationSwitcher unit={unit} collapsed={collapsed} />}
            {groups.map((group, index) => (
              <div key={group.label ?? index} className="space-y-0.5">
                {group.label && !collapsed && <p className="px-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wider text-muted">{group.label}</p>}
                {group.items.map(item => <NavButton key={item.id} item={item} active={item.id === current} collapsed={collapsed} onClick={() => onNavigate(item.id)} />)}
              </div>
            ))}
          </nav>
          <div className="space-y-1 border-t border-line p-2">
            {user && <UserMenu user={user} onSignOut={onSignOut} collapsed={collapsed} side="top" />}
            <button type="button" onClick={() => setCollapsed(value => !value)} aria-pressed={collapsed} title={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
              className="flex min-h-9 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted hover:bg-surface-2">
              {collapsed ? <PanelLeftOpen aria-hidden className="mx-auto size-4" /> : <><PanelLeftClose aria-hidden className="size-4" /><span>Thu gọn</span></>}
              <span className="sr-only">{collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}</span>
            </button>
          </div>
        </aside>
      </div>

      <div className={cn("min-w-0 transition-[padding] duration-300", collapsed ? "md:pl-[5.5rem]" : "md:pl-[17.5rem]")}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-app/90 px-4 backdrop-blur-sm md:px-8">
          <span className="md:hidden"><JuncturaMark size={28} showText={false} product={product} /></span>
          <nav aria-label="Vị trí hiện tại" className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-sm text-muted md:flex">
            <span className="truncate">{product}</span>
            {trail.map((part, index) => (
              <span key={`${part}-${index}`} className="flex min-w-0 items-center gap-1.5">
                <ChevronRight aria-hidden className="size-3.5 shrink-0" />
                <span aria-current={index === trail.length - 1 ? "page" : undefined} className={cn("truncate", index === trail.length - 1 && "font-semibold text-ink")}>{part}</span>
              </span>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {status && <div className="hidden items-center gap-2 lg:flex">{status}</div>}
            {search && (
              <button type="button" onClick={() => setSearchOpen(true)} aria-label="Tìm nhanh (phím /)" className={cn(pill, "text-muted md:w-60 md:justify-start")}>
                <Search aria-hidden className="size-4 shrink-0" />
                <span className="hidden flex-1 truncate text-left md:inline">{search.placeholder ?? "Tìm người bệnh, mã hồ sơ"}</span>
                <kbd aria-hidden className="hidden rounded border border-line bg-surface-2 px-1.5 font-mono text-xs md:inline">/</kbd>
              </button>
            )}
            {notifications && <Notifications items={notifications} />}
            <div className="hidden md:block"><ThemeToggle /></div>
            {user && <div className="md:hidden"><UserMenu user={user} onSignOut={onSignOut} collapsed side="bottom" /></div>}
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl px-4 pb-24 pt-3 md:px-8 md:pb-10 md:pt-4">{children}</main>
      </div>

      <nav aria-label="Chức năng chính (điện thoại)" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface md:hidden">
        {mobile.map(item => (
          <button key={item.id} type="button" aria-current={item.id === current ? "page" : undefined} onClick={() => go(item.id)}
            className={cn("flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium", item.id === current ? "text-brand" : "text-ink-2")}>
            {item.icon && <span aria-hidden>{item.icon}</span>}<span className="truncate">{item.label}</span>
          </button>
        ))}
        {rest.length > 0 && (
          <button type="button" onClick={() => setMoreOpen(true)} className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium text-ink-2">
            <Ellipsis aria-hidden className="size-5" /><span>Thêm</span>
          </button>
        )}
      </nav>
      <Dialog open={moreOpen} title="Thêm chức năng" onClose={() => setMoreOpen(false)}>
        <ul className="space-y-1">{rest.map(item => <li key={item.id}><NavButton item={item} active={item.id === current} collapsed={false} onClick={() => go(item.id)} /></li>)}</ul>
      </Dialog>
      {search && searchOpen && <CommandSearch open onClose={() => setSearchOpen(false)} {...search} />}
    </div>
  );
}
