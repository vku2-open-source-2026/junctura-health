// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from "react";
import { Badge, Card, StatCard } from "@junctura/health-ui";
import { useDesk } from "./context";
import { waitsForFacility, type ExecutionItem, type ExecutionList, type WorkflowSummary } from "./data";
import { DeskPage } from "./layout";
import { DeskError, DeskLoading } from "./states";
import { deskStrings as s, facilityLabel, statusLabel } from "./strings";

/** The four facilities that work steps, in desk order. */
const WORK_FACILITIES = ["tram-y-te", "benh-vien", "nha-thuoc", "bao-hiem"] as const;

/** Overview: workflow summary of the tenant plus the work waiting at the staff's facility. */
export function OverviewPage() {
  const { api, staff } = useDesk();
  const [summary, setSummary] = useState<WorkflowSummary | null>(null);
  const [running, setRunning] = useState<readonly ExecutionItem[]>([]);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    return Promise.all([
      api.getJson<WorkflowSummary>("/v1/workflows/summary"),
      api.getJson<ExecutionList>("/v1/workflows/executions?limit=100&status=running"),
    ])
      .then(([summaryResult, runningResult]) => {
        setSummary(summaryResult);
        setRunning(runningResult.items);
      })
      .catch(setError);
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  if (error) {
    return (
      <DeskPage title={s.overview.title} lead={s.overview.lead} current="/dieu-phoi">
        <DeskError error={error} onRetry={() => void load()} />
      </DeskPage>
    );
  }
  if (!summary) {
    return (
      <DeskPage title={s.overview.title} lead={s.overview.lead} current="/dieu-phoi">
        <DeskLoading />
      </DeskPage>
    );
  }

  const waiting = running.filter(item => waitsForFacility(item, staff.facility));
  const waitingByFacility = WORK_FACILITIES.map(facility => ({
    facility,
    items: running.filter(item => waitsForFacility(item, facility)),
  }));

  return (
    <DeskPage title={s.overview.title} lead={s.overview.lead} current="/dieu-phoi">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={s.overview.running} value={summary.totals.running} tone="brand" />
        <StatCard label={s.overview.completed} value={summary.totals.completed} tone="ok" />
        <StatCard label={s.overview.cancelled} value={summary.totals.cancelled} />
        <StatCard label={s.overview.caseCount} value={summary.totals.definitions} />
      </div>

      {staff.facility === "so-y-te" ? (
        <Card title={s.overview.waitingByFacility} className="mt-8">
          {waitingByFacility.every(({ items }) => items.length === 0) ? (
            <p className="text-sm text-ink-2">{s.overview.waitingNone}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {waitingByFacility.map(({ facility, items }) => (
                <li key={facility} className="flex items-baseline justify-between gap-3 rounded-lg border border-line bg-surface-2 px-4 py-3">
                  <span className="text-sm font-medium">{facilityLabel(facility)}</span>
                  <span className="text-sm tabular-nums text-ink-2">{items.length} {s.overview.caseCount}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <Card title={s.overview.waitingMine} className="mt-8">
          {waiting.length === 0 ? (
            <p className="text-sm text-ink-2">{s.overview.waitingNone}</p>
          ) : (
            <ul className="divide-y divide-line">
              {waiting.map(item => (
                <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                  <a href={`#/dieu-phoi/ho-so/${item.id}`} className="font-medium text-brand hover:underline">{item.title ?? item.id}</a>
                  <span className="text-sm text-ink-2">{item.definition.name}</span>
                  <span className="text-sm text-muted">
                    <span className="sr-only">{s.overview.waitingStep}: </span>
                    {item.currentStep?.name ?? s.cases.noStep}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4">
            <a href="#/dieu-phoi/mo-ho-so" className="text-sm font-medium text-brand hover:underline">{s.overview.openCase} →</a>
          </p>
        </Card>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight">{s.nav.desk}</h2>
        <ul className="mt-4 space-y-5">
          {summary.definitions.map(definition => (
            <li key={definition.key} className="rounded-lg border border-line bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold">{definition.name}</h3>
                <p className="text-sm text-muted">{s.overview.updatedAt}: {definition.updatedAt ?? "—"}</p>
              </div>
              <ol className="mt-4 space-y-3">
                {definition.steps.map(step => (
                  <li key={step.name} className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <span className="text-sm">{step.name}</span>
                    <span className="text-xs text-muted">
                      <span className="sr-only">{s.overview.owner}: </span>
                      {step.owner ? facilityLabel(step.owner) : s.detail.stepNoGroups}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="brand">{statusLabel.running}: {definition.counts.running}</Badge>
                <Badge tone="ok">{statusLabel.completed}: {definition.counts.completed}</Badge>
                <Badge tone="neutral">{statusLabel.cancelled}: {definition.counts.cancelled}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </div>

    </DeskPage>
  );
}
