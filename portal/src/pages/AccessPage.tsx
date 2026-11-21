// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useEffect, useState } from "react";
import { Badge, DataTable, EmptyState, ErrorState, Skeleton, formatDateTime } from "@junctura/health-ui";
import { requestJson } from "../api";
import { appName, capabilityTitle } from "../catalog";
import { purposeLabel, strings } from "../strings";

const DATA_ACCESS_PATH = "/v1/me/data-access";

type Entry = Record<string, unknown>;

const first = (entry: Entry, keys: string[]): unknown => {
  for (const key of keys) if (entry[key] !== undefined && entry[key] !== null) return entry[key];
  return undefined;
};

const asText = (value: unknown): string | undefined => (typeof value === "string" && value ? value : undefined);

/** Either an application id or a `consumer`/`provider` object carrying an `appId`. */
const asApp = (value: unknown): string | undefined => {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && typeof (value as Entry).appId === "string") return (value as Entry).appId as string;
  return undefined;
};

interface AccessRow {
  time?: string;
  consumer?: string;
  capability?: string;
  purpose?: string;
  state?: string;
  emergency: boolean;
}

function mapEntry(entry: Entry): AccessRow {
  const emergencyValue = first(entry, ["emergency", "emergencyFlag"]);
  return {
    time: asText(first(entry, ["at", "time", "occurredAt", "timestamp", "createdAt"])),
    consumer: asApp(first(entry, ["consumerAppId", "consumer", "callerAppId"])),
    capability: asText(first(entry, ["capabilityId", "capability"])),
    purpose: asText(first(entry, ["purpose"])),
    state: asText(first(entry, ["state", "status"])),
    emergency: emergencyValue === true || emergencyValue === "true",
  };
}

const STATE_LABEL: Record<string, string> = {
  succeeded: strings.access.stateSucceeded,
  failed: strings.access.stateFailed,
  running: strings.access.stateRunning,
  accepted: strings.access.stateAccepted,
  auth_required: strings.access.stateAuthRequired,
  timed_out: strings.access.stateTimedOut,
  outcome_unknown: strings.access.stateOutcomeUnknown,
};

const stateLabel = (state?: string): string => (state ? STATE_LABEL[state] ?? strings.access.stateUnknown(state) : "—");

/** The signed-in person's own access log, newest first (`GET /v1/me/data-access`). */
export function AccessPage() {
  const [rows, setRows] = useState<AccessRow[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setRows(null);
    setError(false);
    try {
      const value = await requestJson<{ entries?: Entry[] }>(DATA_ACCESS_PATH);
      const entries = Array.isArray(value.entries) ? value.entries : [];
      setRows(entries.map(entry => mapEntry(entry as Entry)));
    } catch { setError(true); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (error) {
    return <ErrorState title={strings.access.errorTitle} onRetry={() => void load()}>{strings.access.errorLead}</ErrorState>;
  }
  if (!rows) return <Skeleton lines={5} className="mx-auto max-w-4xl" />;
  if (rows.length === 0) {
    return <EmptyState title={strings.access.emptyTitle}>{strings.access.emptyLead}</EmptyState>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{strings.access.title}</h1>
        <p className="mt-2 text-ink-2">{strings.access.lead}</p>
      </header>
      <DataTable
        caption={strings.access.title}
        rows={rows}
        rowKey={row => `${row.time ?? ""}-${row.consumer ?? ""}-${rows.indexOf(row)}`}
        columns={[
          { key: "time", header: strings.access.columns.time, sortValue: row => row.time ?? "", render: row => formatDateTime(row.time) },
          { key: "consumer", header: strings.access.columns.consumer, render: row => (row.consumer ? appName(row.consumer) : "Chưa rõ") },
          { key: "capability", header: strings.access.columns.capability, render: row => (row.capability ? capabilityTitle(row.capability) : "Chưa rõ") },
          { key: "purpose", header: strings.access.columns.purpose, render: row => (row.purpose ? purposeLabel(row.purpose) : "—") },
          { key: "state", header: strings.access.columns.state, render: row => stateLabel(row.state) },
          {
            key: "emergency", header: strings.access.columns.emergency, align: "right",
            render: row => row.emergency ? <Badge tone="danger">{strings.access.emergency}</Badge> : <span aria-hidden>{strings.access.noEmergency}</span>,
          },
        ]}
      />
    </div>
  );
}
