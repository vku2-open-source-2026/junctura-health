// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useEffect, useState } from "react";
import { Badge, DataTable, EmptyState, ErrorState, Skeleton, formatDateTime } from "@junctura/health-ui";
import { requestJson } from "../api";
import { appName, capabilityTitle } from "../catalog";
import { purposeLabel, strings } from "../strings";

const DATA_ACCESS_PATH = "/v1/me/data-access";

/** One entry of GET /v1/me/data-access (junctura-dxos infra/postgres/020-subject-access.sql). */
interface ApiApp { appId?: string; displayName?: string | null }
interface ApiEntry {
  executionId?: string;
  accessedAt?: string;
  consumer?: ApiApp;
  provider?: ApiApp;
  capability?: { capabilityId?: string; title?: string | null; version?: string };
  purpose?: string;
  state?: string;
  emergency?: boolean;
}

interface AccessRow {
  key: string;
  time?: string;
  consumer?: string;
  provider?: string;
  capability?: string;
  purpose?: string;
  state?: string;
  emergency: boolean;
}

/** Names come from Junctura; the demo catalog is only a fallback for a missing display name. */
const appLabel = (app?: ApiApp): string | undefined => app?.displayName || (app?.appId ? appName(app.appId) : undefined);

function mapEntry(entry: ApiEntry, index: number): AccessRow {
  const capability = entry.capability;
  return {
    key: entry.executionId ?? `row-${index}`,
    time: entry.accessedAt,
    consumer: appLabel(entry.consumer),
    provider: appLabel(entry.provider),
    capability: capability?.title || (capability?.capabilityId ? capabilityTitle(capability.capabilityId) : undefined),
    purpose: entry.purpose,
    state: entry.state,
    emergency: entry.emergency === true,
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
      const value = await requestJson<{ entries?: ApiEntry[] }>(DATA_ACCESS_PATH);
      const entries = Array.isArray(value.entries) ? value.entries : [];
      setRows(entries.map(mapEntry));
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
        rowKey={row => row.key}
        columns={[
          { key: "time", header: strings.access.columns.time, sortValue: row => row.time ?? "", render: row => formatDateTime(row.time) },
          { key: "consumer", header: strings.access.columns.consumer, render: row => row.consumer ?? "Chưa rõ" },
          { key: "provider", header: strings.access.columns.provider, render: row => row.provider ?? "Chưa rõ" },
          { key: "capability", header: strings.access.columns.capability, render: row => row.capability ?? "Chưa rõ" },
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
