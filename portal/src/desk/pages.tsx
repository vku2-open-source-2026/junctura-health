// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, type ReactNode } from "react";
import { dataPageFor } from "./d";
import { CaseDetailPage } from "./detail";
import { ExecutionsPage } from "./executions";
import { OpenCasePage } from "./open";
import { TodayPage } from "./today";
import { NoticesPage } from "./notices";
import { DirectoryPage } from "./directory";
import { DeskPage } from "./layout";
import { deskStrings as s } from "./strings";

const CASE_DETAIL = /^\/ho-so\/([0-9a-fA-F-]+)$/;

/** Every route prefix that belongs to the desk: the three spaces H, P, D and the old desk home. */
const DESK_PREFIXES: readonly string[] = ["/lam-viec", "/ho-so", "/dieu-hanh", "/dieu-phoi"];

/** True when the route needs a signed-in staff member (all of H, P, D and the old desk paths). */
export const isDeskRoute = (route: string): boolean =>
  DESK_PREFIXES.some(prefix => route === prefix || route.startsWith(`${prefix}/`));

/** Sends the browser to a hash route; used to keep the old desk links alive. */
export function DeskRedirect({ to }: { to: string }) {
  useEffect(() => { window.location.hash = `#${to}`; }, [to]);
  return null;
}

/** The not-found page of the spaces, pointing back to H (Hôm nay). */
export function DeskNotFound() {
  return (
    <DeskPage title={s.errors.notFoundPage}>
      <p className="text-sm text-ink-2">
        <a href="#/lam-viec" className="font-medium text-brand hover:underline">{s.errors.notFoundPageAction}</a>
      </p>
    </DeskPage>
  );
}

/**
 * The desk page for a hash route, or null when the route is not a desk page at all.
 * Space D (`/dieu-hanh…`) comes from `./d`.
 */
export function deskPageFor(route: string): ReactNode | null {
  if (!isDeskRoute(route)) return null;
  if (route === "/dieu-hanh" || route.startsWith("/dieu-hanh/")) return dataPageFor(route);
  if (route === "/dieu-phoi" || route.startsWith("/dieu-phoi/")) return <DeskRedirect to="/lam-viec" />;
  if (route === "/lam-viec") return <TodayPage />;
  if (route === "/lam-viec/bang-tin") return <NoticesPage />;
  if (route === "/lam-viec/danh-ba") return <DirectoryPage />;
  if (route === "/ho-so") return <ExecutionsPage />;
  if (route === "/ho-so/mo") return <OpenCasePage />;
  const detail = CASE_DETAIL.exec(route);
  if (detail) return <CaseDetailPage id={detail[1].toLowerCase()} />;
  return <DeskNotFound />;
}
