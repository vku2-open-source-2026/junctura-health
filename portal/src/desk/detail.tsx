// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, ConfirmDialog, type Tone } from "@junctura/health-ui";
import { useDesk } from "./context";
import {
  waitsForFacility,
  workflowFor,
  type ExecutionDetail,
  type ExecutionItem,
  type ExecutionList,
} from "./data";
import { DeskPage } from "./layout";
import { DeskError, DeskLoading } from "./states";
import { deskStrings as s, facilityLabel, statusLabel, type ExecutionStatus } from "./strings";

const STATUS_TONES: Readonly<Record<ExecutionStatus, Tone>> = {
  running: "brand",
  completed: "ok",
  cancelled: "neutral",
};

/** Case detail: the workflow steps with progress, and the complete action for the staff's facility. */
export function CaseDetailPage({ id }: { id: string }) {
  const { api, staff } = useDesk();
  const [detail, setDetail] = useState<ExecutionDetail | null>(null);
  const [item, setItem] = useState<ExecutionItem | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [confirming, setConfirming] = useState(false);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    return Promise.all([
      api.getJson<ExecutionDetail>(`/v1/workflows/executions/${id}`),
      api.getJson<ExecutionList>("/v1/workflows/executions?limit=100"),
    ])
      .then(([detailResult, listResult]) => {
        setDetail(detailResult);
        setItem(listResult.items.find(candidate => candidate.id === id) ?? null);
      })
      .catch(setError);
  }, [api, id]);

  useEffect(() => { void load(); }, [load]);

  const complete = async () => {
    setCompleting(true);
    try {
      await api.postJson(`/v1/workflows/executions/${id}/complete`, {});
      await load();
    } catch (completeError) {
      setError(completeError);
      setItem(null);
      setDetail(null);
    } finally {
      setCompleting(false);
      setConfirming(false);
    }
  };

  if (error) {
    return (
      <DeskPage title={s.detail.title} current={`/dieu-phoi/ho-so/${id}`}>
        <DeskError error={error} onRetry={() => void load()} />
      </DeskPage>
    );
  }
  if (!detail) {
    return (
      <DeskPage title={s.detail.title} current={`/dieu-phoi/ho-so/${id}`}>
        <DeskLoading />
      </DeskPage>
    );
  }

  const workflow = workflowFor(item?.definition.key ?? "");
  const currentName = item?.currentStep?.name ?? null;
  const currentIndex = currentName === null || !workflow ? -1 : workflow.steps.findIndex(step => step.name === currentName);
  const canComplete = item != null && waitsForFacility(item, staff.facility);
  const openedBy = typeof detail.input?.openedBy === "string" ? detail.input.openedBy : null;
  const reference = typeof detail.input?.reference === "string" ? detail.input.reference : null;

  return (
    <DeskPage title={s.detail.title} current={`/dieu-phoi/ho-so/${id}`}>
      <p><a href="#/dieu-phoi/ho-so" className="text-sm font-medium text-brand hover:underline">← {s.detail.backToList}</a></p>

      <div className="mt-6 rounded-lg border border-line bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{item?.title ?? reference ?? detail.id}</h2>
          <Badge tone={STATUS_TONES[detail.status]}>{statusLabel[detail.status]}</Badge>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">{s.detail.reference}</dt>
            <dd className="mt-0.5 font-mono text-sm">{reference ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">{s.detail.openedBy}</dt>
            <dd className="mt-0.5 text-sm">{openedBy ? facilityLabel(openedBy) : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">{s.detail.workflow}</dt>
            <dd className="mt-0.5 text-sm">{item?.definition.name ?? detail.definitionId}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">{s.detail.updated}</dt>
            <dd className="mt-0.5 text-sm">{item?.updatedAt ?? "—"}</dd>
          </div>
        </dl>
        {item?.currentStep && (
          <p className="mt-4 text-sm text-ink-2">
            <span className="font-medium">{s.detail.currentStep}: </span>
            {item.currentStep.name}
            {item.currentStep.assignee ? ` (${item.currentStep.assignee})` : ""}
          </p>
        )}
        {staff.facility === "so-y-te" && <p className="mt-4 text-sm text-muted">{s.detail.readonly}</p>}
        {canComplete && (
          <div className="mt-5">
            <Button onClick={() => setConfirming(true)} loading={completing}>
              {s.detail.completeStep} {currentName}
            </Button>
          </div>
        )}
      </div>

      {workflow && (
        <div className="mt-6 rounded-lg border border-line bg-surface p-5 shadow-card">
          <h3 className="text-base font-semibold">{s.detail.steps}</h3>
          <ol className="mt-4 space-y-3">
            {workflow.steps.map((step, index) => {
              const done = detail.status === "completed" || (currentIndex >= 0 && index < currentIndex);
              const current = detail.status === "running" && index === currentIndex;
              return (
                <li key={step.id} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={
                      done
                        ? "grid size-7 shrink-0 place-items-center rounded-full bg-ok-soft text-sm font-semibold text-ok"
                        : current
                          ? "grid size-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-on-brand"
                          : "grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-semibold text-muted"
                    }
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {step.name || step.id}
                      {done && <span className="ml-2 text-xs font-normal text-ok">{s.detail.stepDone}</span>}
                      {current && <span className="ml-2 text-xs font-normal text-brand">{s.detail.stepCurrent}</span>}
                      {!done && !current && <span className="ml-2 text-xs font-normal text-muted">{s.detail.stepFuture}</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      <span className="sr-only">{s.detail.currentStep}: </span>
                      {step.groups.length > 0 ? step.groups.map(facilityLabel).join(", ") : s.detail.stepNoGroups}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title={s.detail.confirmTitle}
        description={s.detail.confirmDescription}
        confirmLabel={s.detail.confirmLabel}
        loading={completing}
        onConfirm={() => void complete()}
        onCancel={() => setConfirming(false)}
      />
    </DeskPage>
  );
}
