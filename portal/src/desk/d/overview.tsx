// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, formatNumber, StatCard } from "@junctura/health-ui";
import { useDesk } from "../context";
import { isMedicalKey, workflowFor, type ExecutionItem, type ExecutionList, type WorkflowSummary } from "../data";
import { DeskPage } from "../layout";
import { DeskError, DeskLoading } from "../states";
import { deskStrings as s, facilityLabel } from "../strings";
import { dataStrings as d } from "./strings";
import {
  durationStatsByWorkflow,
  formatClock,
  formatDuration,
  waitingByFacility,
  type AppStats,
} from "./logic";

const REFRESH_MS = 30_000;

/** Bar of the waiting chart: plain CSS width with the number next to it, never colour alone. */
const WaitingBar = ({ total, share, overdue }: { total: number; share: number; overdue: number }) => (
  <div className="flex items-center gap-3">
    <div className="h-3 w-40 overflow-hidden rounded-full bg-surface-2 sm:w-56" aria-hidden>
      <div className="h-full rounded-full bg-brand-soft" style={{ width: `${Math.round(share * 100)}%` }} />
    </div>
    <span className="text-sm font-semibold tabular-nums">{formatNumber(total)}</span>
    {overdue > 0 && (
      <Badge tone="warn">
        {formatNumber(overdue)} {d.overview.overdue}
      </Badge>
    )}
  </div>
);

/**
 * D · Tổng quan điều hành: live headline counts from Layer 1, the waiting cases per
 * facility with the cases older than 24 hours, the processing time per medical
 * workflow and the per-workflow table. Refreshes on demand and every 30 seconds
 * while the tab is visible.
 */
export function DataOverviewPage() {
  const { api } = useDesk();
  const [summary, setSummary] = useState<WorkflowSummary | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [running, setRunning] = useState<readonly ExecutionItem[] | null>(null);
  const [completed, setCompleted] = useState<readonly ExecutionItem[] | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    return Promise.all([
      api.getJson<WorkflowSummary>("/v1/workflows/summary").then(setSummary),
      api.getJson<AppStats>("/v1/applications/stats").then(setStats),
      api.getJson<ExecutionList>("/v1/workflows/executions?limit=100&status=running").then(list => setRunning(list.items)),
      api.getJson<ExecutionList>("/v1/workflows/executions?limit=100&status=completed").then(list => setCompleted(list.items)),
    ])
      .then(() => setLoadedAt(new Date()))
      .catch(setError);
  }, [api]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (error) {
    return (
      <DeskPage title={d.overview.title} lead={d.overview.lead} current="/dieu-hanh">
        <DeskError error={error} onRetry={() => void load()} />
      </DeskPage>
    );
  }
  if (!summary || !stats || running === null || completed === null) {
    return (
      <DeskPage title={d.overview.title} lead={d.overview.lead} current="/dieu-hanh">
        <DeskLoading lines={6} />
      </DeskPage>
    );
  }

  const waiting = waitingByFacility(running);
  const busiest = Math.max(1, ...waiting.map(entry => entry.total));
  const durations = durationStatsByWorkflow(completed);
  const definitions = summary.definitions.filter(definition => isMedicalKey(definition.key));

  return (
    <DeskPage title={d.overview.title} lead={d.overview.lead} current="/dieu-hanh">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="md" onClick={() => void load()}>{d.overview.refresh}</Button>
        {loadedAt && (
          <p className="text-sm text-muted">
            {d.overview.updatedAt} <time dateTime={loadedAt.toISOString()}>{formatClock(loadedAt)}</time>
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={d.overview.running} value={formatNumber(summary.totals.running)} tone="brand" />
        <StatCard label={d.overview.completed} value={formatNumber(summary.totals.completed)} />
        <StatCard label={d.overview.cancelled} value={formatNumber(summary.totals.cancelled)} />
        <StatCard
          label={d.overview.activeApps}
          value={formatNumber(stats.totals.activeApplications)}
          hint={d.overview.activeAppsHint}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title={d.overview.waitingTitle}>
          <p className="text-xs text-muted">{d.overview.waitingHint}</p>
          {waiting.length === 0 ? (
            <p className="mt-3 text-sm text-ink-2">{d.overview.waitingNone}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {waiting.map(entry => (
                <li key={entry.facility} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <span className="text-sm font-medium">{facilityLabel(entry.facility)}</span>
                  <WaitingBar total={entry.total} share={entry.total / busiest} overdue={entry.overdue} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={d.overview.durationTitle}>
          <p className="text-xs text-muted">{d.overview.durationHint}</p>
          {durations.length === 0 ? (
            <p className="mt-3 text-sm text-ink-2">{d.overview.durationNone}</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {durations.map(entry => (
                <li key={entry.key} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                  <span className="font-medium">{workflowFor(entry.key)?.name ?? entry.key}</span>
                  <span className="text-sm text-ink-2">
                    {d.overview.median}: {formatDuration(entry.median ?? Number.NaN)}
                    {" · "}
                    {d.overview.max}: {formatDuration(entry.max ?? Number.NaN)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title={d.overview.perWorkflow} className="mt-4">
        {definitions.length === 0 ? (
          <p className="text-sm text-ink-2">{s.errors.generic}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">{d.overview.columnWorkflow}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{d.overview.columnRunning}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{d.overview.columnCompleted}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{d.overview.columnCancelled}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{d.overview.columnSteps}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{d.overview.columnFacilities}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {definitions.map(definition => (
                  <tr key={definition.key} className="hover:bg-surface-2/60">
                    <td className="px-4 py-3 font-medium">{definition.name}</td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(definition.counts.running)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(definition.counts.completed)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatNumber(definition.counts.cancelled)}</td>
                    <td className="px-4 py-3 text-ink-2">
                      {definition.steps.length === 0 ? (
                        <span className="text-muted">{d.overview.noStep}</span>
                      ) : (
                        <ol className="list-decimal space-y-0.5 pl-4">
                          {definition.steps.map((step, index) => (
                            <li key={`${definition.key}-${index}`}>
                              {step.name}
                              {step.owner && <span className="text-muted"> — {facilityLabel(step.owner)}</span>}
                            </li>
                          ))}
                        </ol>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-2">
                      {[...new Set(definition.steps.map(step => step.owner).filter((owner): owner is string => owner != null))]
                        .map(facilityLabel).join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DeskPage>
  );
}
