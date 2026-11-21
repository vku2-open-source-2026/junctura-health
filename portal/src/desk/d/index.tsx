// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from "react";
import { dataStrings as d } from "./strings";
import { DataExchangePage } from "./exchange";
import { DataMapPage } from "./data-map";
import { DataOverviewPage } from "./overview";
import { CatalogRedirect, DataSharingPage } from "./sharing";

export { DATA_ROUTES, type DataRoute } from "./routes";

/** Small not-found page for unknown `/dieu-hanh/…` routes. */
function DataNotFound() {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-dashed border-line bg-surface px-6 py-10 text-center">
      <h2 className="text-lg font-semibold">{d.notFound.title}</h2>
      <p className="mt-2">
        <a href="#/dieu-hanh" className="text-sm font-medium text-brand hover:underline">{d.notFound.action}</a>
      </p>
    </div>
  );
}

/** The D page for a hash route, or null when the route is not part of space D. */
export function dataPageFor(route: string): ReactNode | null {
  if (route !== "/dieu-hanh" && !route.startsWith("/dieu-hanh/")) return null;
  switch (route) {
    case "/dieu-hanh": return <DataOverviewPage />;
    case "/dieu-hanh/trao-doi": return <DataExchangePage />;
    case "/dieu-hanh/du-lieu": return <DataMapPage />;
    case "/dieu-hanh/chia-se": return <DataSharingPage />;
    case "/dieu-hanh/danh-muc": return <CatalogRedirect />;
    default: return <DataNotFound />;
  }
}
