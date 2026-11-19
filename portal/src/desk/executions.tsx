// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from "react";
import { Badge, formatDateTime, type Tone } from "@junctura/health-ui";
import { useDesk } from "./context";
import { inputUrgency, isMedicalKey, type ExecutionItem, type ExecutionList } from "./data";
import { DeskPage } from "./layout";
import { DeskEmpty, DeskError, DeskLoading } from "./states";
import { deskStrings as s, facilityLabel, statusLabel, urgencyLabel, type ExecutionStatus } from "./strings";

const STATUS_FILTERS: readonly { value: ExecutionStatus | "all"; label: string }[] = [
  { value: "all", label: s.cases.statusAll },
  { value: "running", label: statusLabel.running },
  { value: "completed", label: statusLabel.completed },
  { value: "cancelled", label: statusLabel.cancelled },
];

const STATUS_TONES: Readonly<Record<ExecutionStatus, Tone>> = {
  running: "brand",
  completed: "ok",
  cancelled: "neutral",
};

/** Case list: the execution history filtered to the three shared medical workflows. */
export function ExecutionsPage() {
  const { api, staff } = useDesk();
  const [status, setStatus] = useState<ExecutionStatus | "all">("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [items, setItems] = useState<readonly ExecutionItem[] | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    setItems(null);
    const query = status === "all" ? "/v1/workflows/executions?limit=100" : `/v1/workflows/executions?limit=100&status=${status}`;
    return api.getJson<ExecutionList>(query)
      .then(list => setItems(list.items.filter(item => isMedicalKey(item.definition.key))))
      .catch(setError);
  }, [api, status]);

  useEffect(() => { void load(); }, [load]);

  const shown = (items ?? []).filter(item => !mineOnly || item.currentStep?.groups?.includes(staff.facility) === true);
  // The engine history list carries no input; the column appears only when it ever does.
  const withUrgency = (items ?? []).some(item => inputUrgency(item) !== null);

  return (
    <DeskPage title={s.cases.title} lead={s.cases.lead} current="/ho-so">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label={s.cases.status} className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={status === filter.value}
              onClick={() => setStatus(filter.value)}
              className={status === filter.value ? "rounded-md bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand" : "rounded-md px-3 py-1.5 text-sm font-medium text-ink-2 hover:text-ink"}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={mineOnly} onChange={event => setMineOnly(event.target.checked)} className="size-4 accent-[var(--color-brand)]" />
          {s.cases.mineOnly}
        </label>
        <a
          href="#/ho-so/mo"
          className="inline-flex items-center rounded-lg border border-control bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
        >
          {s.cases.openCase}
        </a>
      </div>

      {error ? (
        <div className="mt-8"><DeskError error={error} onRetry={() => void load()} /></div>
      ) : items === null ? (
        <div className="mt-8"><DeskLoading lines={6} /></div>
      ) : shown.length === 0 ? (
        <div className="mt-8"><DeskEmpty title={s.cases.none} /></div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-surface shadow-card">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{s.cases.code}</th>
                <th scope="col" className="px-4 py-3 font-medium">{s.cases.workflow}</th>
                <th scope="col" className="px-4 py-3 font-medium">{s.cases.status}</th>
                <th scope="col" className="px-4 py-3 font-medium">{s.cases.currentStep}</th>
                {withUrgency && <th scope="col" className="px-4 py-3 font-medium">{s.urgency.column}</th>}
                <th scope="col" className="px-4 py-3 font-medium">{s.cases.updated}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map(item => (
                <tr key={item.id} className="hover:bg-surface-2/60">
                  <td className="px-4 py-3">
                    <a href={`#/ho-so/${item.id}`} className="font-medium text-brand hover:underline">{item.title ?? item.id}</a>
                  </td>
                  <td className="px-4 py-3">{item.definition.name}</td>
                  <td className="px-4 py-3"><Badge tone={STATUS_TONES[item.status]}>{statusLabel[item.status]}</Badge></td>
                  <td className="px-4 py-3">
                    {item.currentStep ? (
                      <>
                        {item.currentStep.name}
                        <span className="block text-xs text-muted">
                          <span className="sr-only">{s.cases.currentStep}: </span>
                          {(item.currentStep.groups ?? []).map(facilityLabel).join(", ")}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted">{s.cases.noStep}</span>
                    )}
                  </td>
                  {withUrgency && (
                    <td className="px-4 py-3">
                      {(() => {
                        const urgency = inputUrgency(item);
                        return urgency
                          ? <Badge tone={urgency === "cap-cuu" ? "danger" : urgency === "khan" ? "warn" : "neutral"}>{urgencyLabel(urgency)}</Badge>
                          : <span className="text-muted">{s.cases.noStep}</span>;
                      })()}
                    </td>
                  )}
                  <td className="px-4 py-3 text-ink-2">{formatDateTime(item.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DeskPage>
  );
}
