// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from "react";
import { Badge, Card, formatDateTime, formatNumber } from "@junctura/health-ui";
import { useDesk } from "../context";
import { DeskPage } from "../layout";
import { DeskEmpty, DeskError, DeskLoading } from "../states";
import { dataStrings as d, eventLabel, outcomeLabel, appStateLabel, purposeName } from "./strings";
import {
  actorLabel,
  appNamesById,
  auditPathFor,
  emergencyEvents,
  eventFamilyCounts,
  EXCHANGE_RANGES,
  type AppStats,
  type AuditEventItem,
  type AuditEventList,
  type ExchangeRange,
} from "./logic";

const EVENT_FAMILIES: readonly string[] = ["execution", "invocation", "authorization", "capability", "grant", "resource"];

/** Outcome of an audit event as a badge tone; the text always carries the meaning. */
const OUTCOME_TONES: Readonly<Record<string, "ok" | "danger" | "warn" | "neutral">> = {
  success: "ok",
  denied: "danger",
  failed: "warn",
  unknown: "neutral",
};

/** One row of the exchange list: time, type, actor and outcome only — never IDs, hashes or subjects. */
const EventRow = ({ item, names }: { item: AuditEventItem; names: ReadonlyMap<string, string> }) => (
  <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
    <span className="text-sm text-ink-2">{formatDateTime(item.occurredAt)}</span>
    <span className="font-medium">{eventLabel(item.event)}</span>
    <span className="text-sm text-ink-2">{actorLabel(item.actorAppId, names)}</span>
    <span className="flex items-center gap-2">
      {item.reasonCode && (
        <span className="text-xs text-muted">
          {d.exchange.purpose}: {purposeName(item.reasonCode)}
        </span>
      )}
      <Badge tone={OUTCOME_TONES[item.outcome] ?? "neutral"}>{outcomeLabel(item.outcome)}</Badge>
    </span>
  </li>
);

/**
 * D · Trao đổi dữ liệu: the protected audit log of Layer 1, reduced to event types,
 * applications and outcomes, with the emergency-access events called out for review,
 * plus the recent activity of every base application from the application statistics.
 */
export function DataExchangePage() {
  const { api } = useDesk();
  const [range, setRange] = useState<ExchangeRange>("24h");
  const [events, setEvents] = useState<readonly AuditEventItem[] | null>(null);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    return Promise.all([
      api.getJson<AuditEventList>(auditPathFor(range)).then(list => setEvents(list.items)),
      api.getJson<AppStats>("/v1/applications/stats").then(setStats),
    ]).catch(setError);
  }, [api, range]);

  useEffect(() => { void load(); }, [load]);

  if (error) {
    return (
      <DeskPage title={d.exchange.title} lead={d.exchange.lead} current="/dieu-hanh/trao-doi">
        <DeskError error={error} onRetry={() => void load()} />
      </DeskPage>
    );
  }
  if (events === null || stats === null) {
    return (
      <DeskPage title={d.exchange.title} lead={d.exchange.lead} current="/dieu-hanh/trao-doi">
        <DeskLoading lines={6} />
      </DeskPage>
    );
  }

  const names = appNamesById(stats.applications);
  const families = eventFamilyCounts(events);

  const exchangeByApp = new Map<string, number>();
  for (const item of events) {
    if (!EVENT_FAMILIES.some(family => item.event.startsWith(`${family}.`))) continue;
    const label = actorLabel(item.actorAppId, names);
    exchangeByApp.set(label, (exchangeByApp.get(label) ?? 0) + 1);
  }
  const exchangeApps = [...exchangeByApp.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const emergencies = emergencyEvents(events);
  const rangeLabels: Readonly<Record<ExchangeRange, string>> = {
    "24h": d.exchange.range24h,
    "7d": d.exchange.range7d,
    all: d.exchange.rangeAll,
  };

  return (
    <DeskPage title={d.exchange.title} lead={d.exchange.lead} current="/dieu-hanh/trao-doi">
      <p className="text-xs text-muted">{d.exchange.sourceNote}</p>

      <fieldset className="mt-4 flex flex-wrap items-center gap-3">
        <legend className="text-sm font-medium">{d.exchange.rangeLabel}</legend>
        {EXCHANGE_RANGES.map(candidate => (
          <label key={candidate} className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name="khoang-thoi-gian"
              checked={candidate === range}
              onChange={() => setRange(candidate)}
            />
            {rangeLabels[candidate]}
          </label>
        ))}
      </fieldset>

      <Card title={d.exchange.countsTitle} className="mt-6">
        {families.length === 0 ? (
          <p className="text-sm text-ink-2">{d.exchange.countsNone}</p>
        ) : (
          <ul className="divide-y divide-line">
            {families.map(entry => (
              <li key={entry.family} className="flex items-baseline justify-between gap-x-4 py-2.5">
                <span className="font-medium">{eventLabel(`${entry.family}.x`)}</span>
                <span className="text-sm font-semibold tabular-nums">{formatNumber(entry.count)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={d.exchange.emergencyTitle} className="mt-4">
        <p className="text-xs text-muted">{d.exchange.emergencyHint}</p>
        {emergencies.length === 0 ? (
          <p className="mt-3 text-sm text-ink-2">{d.exchange.emergencyNone}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {emergencies.map(item => <EventRow key={item.eventId} item={item} names={names} />)}
          </ul>
        )}
      </Card>

      <Card title={d.exchange.recentTitle} count={events.length} className="mt-4">
        {events.length === 0 ? (
          <DeskEmpty title={d.exchange.recentNone} />
        ) : (
          <ul className="divide-y divide-line">
            {events.slice(0, 30).map(item => <EventRow key={item.eventId} item={item} names={names} />)}
          </ul>
        )}
      </Card>

      <Card title={d.exchange.perAppTitle} className="mt-4">
        <p className="text-xs text-muted">{d.exchange.perAppHint}</p>
        {exchangeApps.length === 0 ? (
          <p className="mt-3 text-sm text-ink-2">{d.exchange.perAppNone}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {exchangeApps.map(([name, count]) => (
              <li key={name} className="flex items-baseline justify-between gap-x-4 py-2.5">
                <span className="font-medium">{name}</span>
                <span className="text-sm font-semibold tabular-nums">{formatNumber(count)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={d.exchange.appsTitle} className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{d.exchange.columnApp}</th>
                <th scope="col" className="px-4 py-3 font-medium">{d.exchange.columnState}</th>
                <th scope="col" className="px-4 py-3 font-medium">{d.exchange.columnActivity}</th>
                <th scope="col" className="px-4 py-3 font-medium">{d.exchange.columnOutgoing}</th>
                <th scope="col" className="px-4 py-3 font-medium">{d.exchange.columnIncoming}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {stats.applications.map(application => (
                <tr key={application.id} className="hover:bg-surface-2/60">
                  <td className="px-4 py-3 font-medium">{application.name}</td>
                  <td className="px-4 py-3"><Badge tone={application.state === "active" ? "ok" : "neutral"}>{appStateLabel(application.state)}</Badge></td>
                  <td className="px-4 py-3 text-ink-2">{formatDateTime(application.lastActivityAt)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatNumber(application.calls.outgoing.last24h)}</td>
                  <td className="px-4 py-3 tabular-nums">{formatNumber(application.calls.incoming.last24h)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DeskPage>
  );
}
