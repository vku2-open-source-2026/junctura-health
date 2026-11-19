// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from "react";
import { CaseDetailPage } from "./detail";
import { ExecutionsPage } from "./executions";
import { OpenCasePage } from "./open";
import { OverviewPage } from "./overview";
import { DeskPage } from "./layout";
import { deskStrings as s } from "./strings";

const CASE_DETAIL = /^\/dieu-phoi\/ho-so\/([0-9a-fA-F-]+)$/;

const DESK_PREFIX = /^\/dieu-phoi(\/|$)/;

/** The desk page for a hash route, or null when the route is not a desk route at all. */
export function deskPageFor(route: string): ReactNode | null {
  if (!DESK_PREFIX.test(route)) return null;
  const detail = CASE_DETAIL.exec(route);
  if (detail) return <CaseDetailPage id={detail[1]} />;
  if (route === "/dieu-phoi") return <OverviewPage />;
  if (route === "/dieu-phoi/ho-so") return <ExecutionsPage />;
  if (route === "/dieu-phoi/mo-ho-so") return <OpenCasePage />;
  return (
    <DeskPage title={s.errors.notFoundPage}>
      <p className="text-sm text-ink-2">
        <a href="#/dieu-phoi" className="font-medium text-brand hover:underline">{s.errors.notFoundPageAction}</a>
      </p>
    </DeskPage>
  );
}
