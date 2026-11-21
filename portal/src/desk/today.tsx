// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from "react";
import { Card, formatDateTime } from "@junctura/health-ui";
import { useDesk } from "./context";
import {
  OPENERS,
  inputUrgency,
  latestDefinitionBy,
  openableKeysFor,
  waitsForFacility,
  type DefinitionItem,
  type ExecutionDetail,
  type ExecutionItem,
  type ExecutionList,
  type Notice,
  type NoticeList,
} from "./data";
import { DeskPage } from "./layout";
import { DeskError, DeskLoading } from "./states";
import { deskStrings as s, facilityLabel, urgencyLabel } from "./strings";

/**
 * H · Hôm nay: greeting, the work waiting at the staff facility, the running cases the
 * facility itself opened (read from each case's input), the three latest notices and,
 * when the facility may open some workflow, the shortcut to the open-case form.
 */
export function TodayPage() {
  const { api, staff } = useDesk();
  const [running, setRunning] = useState<readonly ExecutionItem[] | null>(null);
  const [inputs, setInputs] = useState<ReadonlyMap<string, string | null>>(new Map());
  const [definitions, setDefinitions] = useState<Readonly<Record<string, DefinitionItem>> | null>(null);
  const [notices, setNotices] = useState<readonly Notice[]>([]);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    setRunning(null);
    const engineList = api.getJson<ExecutionList>("/v1/workflows/executions?limit=100&status=running");
    // The engine list does not carry the input; read each case's openedBy from its own record.
    const engineInputs = engineList.then(list => {
      setRunning(list.items);
      return Promise.all(
        list.items.map(item => api.getJson<ExecutionDetail>(`/v1/workflows/executions/${item.id}`)
          .then(detail => [item.id, typeof detail.input?.openedBy === "string" ? detail.input.openedBy : null] as const)
          .catch(() => [item.id, null] as const)),
      ).then(entries => setInputs(new Map(entries)));
    });
    const definitionsList = api.getJson<{ items: readonly DefinitionItem[] }>("/v1/workflows/definitions")
      .then(list => setDefinitions(latestDefinitionBy(list.items.filter(item => item.key in OPENERS))))
      .catch(() => setDefinitions({}));
    const noticeList = api.getJson<NoticeList>("/api/bang-tin")
      .then(list => setNotices(list.items))
      .catch(() => setNotices([]));
    return Promise.all([engineList, engineInputs, definitionsList, noticeList]).then(() => undefined).catch(error => {
      // The section feeds other than the running list degrade quietly; only its failure is fatal.
      setError(error);
      throw error;
    });
  }, [api]);

  useEffect(() => { void load().catch(() => undefined); }, [load]);

  if (error) {
    return (
      <DeskPage title={s.today.title} lead={s.today.lead} current="/lam-viec">
        <DeskError error={error} onRetry={() => void load().catch(() => undefined)} />
      </DeskPage>
    );
  }
  if (!running) {
    return (
      <DeskPage title={s.today.title} lead={s.today.lead} current="/lam-viec">
        <DeskLoading lines={5} />
      </DeskPage>
    );
  }

  const waiting = running.filter(item => waitsForFacility(item, staff.facility));
  const openedByYou = running.filter(item => inputs.get(item.id) === staff.facility);
  const canOpen = openableKeysFor(staff.facility).some(key => definitions != null && key in definitions);

  return (
    <DeskPage title={s.today.title} lead={s.today.lead} current="/lam-viec">
      <p className="text-lg text-ink-2">
        {s.today.greeting} <span className="font-semibold text-ink">{staff.displayName}</span>
        {" · "}{facilityLabel(staff.facility)}
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card title={s.today.waitingMine}>
          {waiting.length === 0 ? (
            <p className="text-sm text-ink-2">{s.today.waitingNone}</p>
          ) : (
            <ul className="divide-y divide-line">
              {waiting.map(item => (
                <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                  <a href={`#/ho-so/${item.id}`} className="font-medium text-brand hover:underline">{item.title ?? item.id}</a>
                  <span className="text-sm text-ink-2">{item.definition.name}</span>
                  <span className="text-sm text-muted">
                    <span className="sr-only">{s.today.stepWaiting}: </span>
                    {item.currentStep?.name ?? s.cases.noStep}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={s.today.openedByYou}>
          {openedByYou.length === 0 ? (
            <p className="text-sm text-ink-2">{s.today.openedNone}</p>
          ) : (
            <ul className="divide-y divide-line">
              {openedByYou.map(item => (
                <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                  <a href={`#/ho-so/${item.id}`} className="font-medium text-brand hover:underline">{item.title ?? item.id}</a>
                  <span className="text-sm text-ink-2">{item.definition.name}</span>
                  <span className="text-sm text-muted">{inputUrgency(item) ? urgencyLabel(inputUrgency(item)!) : "—"}</span>
                </li>
              ))}
            </ul>
          )}
          {canOpen && (
            <p className="mt-4">
              <a href="#/ho-so/mo" className="text-sm font-medium text-brand hover:underline">{s.today.openCase} →</a>
            </p>
          )}
        </Card>
      </div>

      <Card title={s.today.latestNotices} className="mt-4">
        {notices.length === 0 ? (
          <p className="text-sm text-ink-2">{s.today.noNotices}</p>
        ) : (
          <ul className="divide-y divide-line">
            {notices.slice(0, 3).map(notice => (
              <li key={notice.id} className="py-3">
                <p className="font-medium">{notice.title}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-ink-2">{notice.body}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {notice.author.displayName} · {facilityLabel(notice.author.facility)} · {formatDateTime(notice.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4">
          <a href="#/lam-viec/bang-tin" className="text-sm font-medium text-brand hover:underline">{s.today.allNotices} →</a>
        </p>
      </Card>
    </DeskPage>
  );
}
