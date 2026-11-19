// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { Badge } from "@junctura/health-ui";
import { CONTRACT_VIEWS } from "./data";
import { SpacePage } from "./layout";
import { spaceStrings as s } from "./strings";

/** List of every capability contract; each card links to its detail route. */
export function ContractsPage() {
  return (
    <SpacePage title={s.contracts.title} lead={s.contracts.lead} current="/hop-dong">
      <ul className="grid gap-5 sm:grid-cols-2">
        {CONTRACT_VIEWS.map(view => (
          <li key={view.slug}>
            <a
              href={`#/hop-dong/${view.slug}`}
              className="block h-full rounded-lg border border-line bg-surface p-5 shadow-card transition hover:border-brand"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{view.title}</h2>
                <Badge tone="brand">{s.contract.version} {view.version}</Badge>
              </div>
              <p className="mt-2 text-sm text-ink-2">{view.description}</p>
              <p className="mt-3 text-sm">
                <span className="font-medium">{s.contract.provider}: </span>
                <span className="text-ink-2">{view.providerName}</span>
              </p>
              <p className="mt-2 text-sm font-medium text-brand">{s.contracts.openDetail} →</p>
            </a>
          </li>
        ))}
      </ul>
    </SpacePage>
  );
}
