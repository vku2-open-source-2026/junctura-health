// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, Skeleton, formatDate, type Tone } from "@junctura/health-ui";
import { postJson, requestJson } from "../api";
import { appName, capabilityTitle } from "../catalog";
import { purposeLabel, strings } from "../strings";

interface ConsentRow {
  consentId: string;
  consumer?: { appId?: string };
  consumerAppId?: string;
  capabilityId: string;
  purposes?: string[];
  expiresAt?: string;
  state?: string;
}

const CONSENTS_PATH = "/v1/me/consents";
/** Default validity of a new consent, in days (demo plan uses the same GRANT_DAYS = 90). */
const GRANT_DAYS = 90;

type DisplayState = "active" | "revoked" | "expired" | "unknown";

function displayState(row: ConsentRow, now: number): DisplayState {
  if (row.state === "revoked") return "revoked";
  if (row.state === "active") {
    const expires = Date.parse(row.expiresAt ?? "");
    return Number.isNaN(expires) || expires > now ? "active" : "expired";
  }
  return "unknown";
}

const STATE_BADGE: Record<DisplayState, { label: string; tone: Tone }> = {
  active: { label: strings.consents.stateActive, tone: "ok" },
  revoked: { label: strings.consents.stateRevoked, tone: "neutral" },
  expired: { label: strings.consents.stateExpired, tone: "warn" },
  unknown: { label: strings.consents.stateUnknown, tone: "neutral" },
};

const consumerName = (row: ConsentRow): string => appName(row.consumer?.appId ?? row.consumerAppId ?? "");

/** The signed-in person's consents, one card per consent, mobile first. */
export function ConsentsPage() {
  const [rows, setRows] = useState<ConsentRow[] | null>(null);
  const [error, setError] = useState(false);
  const [confirming, setConfirming] = useState<{ row: ConsentRow; action: "revoke" | "grant" } | null>(null);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState(false);

  const load = useCallback(async (keepNotice = false) => {
    setRows(null);
    setError(false);
    if (!keepNotice) setNotice(false);
    try {
      const value = await requestJson<{ consents?: ConsentRow[] }>(CONSENTS_PATH);
      setRows(Array.isArray(value.consents) ? value.consents : []);
    } catch { setError(true); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const act = useCallback(async (row: ConsentRow, action: "revoke" | "grant") => {
    setConfirming(null);
    setWorking(true);
    try {
      if (action === "revoke") await postJson(`${CONSENTS_PATH}/${encodeURIComponent(row.consentId)}/revoke`, {});
      else await postJson(CONSENTS_PATH, {
        consumerAppId: row.consumer?.appId ?? row.consumerAppId ?? "",
        capabilityId: row.capabilityId,
        purposes: row.purposes ?? [],
        expiresAt: new Date(Date.now() + GRANT_DAYS * 86_400_000).toISOString(),
      });
      setNotice(true);
      await load(true);
    } catch {
      setError(true);
      setRows([]);
    } finally {
      setWorking(false);
    }
  }, [load]);

  if (error) {
    return <ErrorState title={strings.consents.errorTitle} onRetry={() => void load()}>{strings.consents.errorLead}</ErrorState>;
  }
  if (!rows) return <Skeleton lines={5} className="mx-auto max-w-2xl" />;
  if (rows.length === 0) {
    return <EmptyState title={strings.consents.emptyTitle}>{strings.consents.emptyLead}</EmptyState>;
  }

  const now = Date.now();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{strings.consents.title}</h1>
        <p className="mt-2 text-ink-2">{strings.consents.lead}</p>
      </header>
      {notice && <p role="status" className="text-sm font-medium text-ok">{strings.consents.done}</p>}
      <ul className="space-y-3">
        {rows.map(row => {
          const state = displayState(row, now);
          const badge = STATE_BADGE[state];
          const consumer = consumerName(row);
          const capability = capabilityTitle(row.capabilityId);
          return (
            <li key={row.consentId} className="rounded-lg border border-line bg-surface shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
                  <h2 className="text-lg font-semibold">{consumer}</h2>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </div>
                <dl className="space-y-1.5 px-5 py-3 text-sm">
                  <div><dt className="inline font-medium">{strings.consents.capability}: </dt><dd className="inline">{capability}</dd></div>
                  <div>
                    <dt className="inline font-medium">{strings.consents.purposes}: </dt>
                    <dd className="inline">{(row.purposes ?? []).map(purposeLabel).join(", ") || "—"}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">{strings.consents.expires}: </dt>
                    <dd className="inline">{row.expiresAt ? formatDate(row.expiresAt) : "Chưa rõ"}</dd>
                  </div>
                </dl>
                <div className="border-t border-line px-5 py-3">
                  {state === "active" ? (
                    <Button variant="danger" onClick={() => setConfirming({ row, action: "revoke" })}>{strings.consents.revoke}</Button>
                  ) : (
                    <Button onClick={() => setConfirming({ row, action: "grant" })}>{strings.consents.grantAgain}</Button>
                  )}
                </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirming?.action === "revoke"}
        title={strings.consents.revokeTitle}
        description={confirming ? strings.consents.revokeDescription(consumerName(confirming.row), capabilityTitle(confirming.row.capabilityId)) : ""}
        confirmLabel={strings.consents.confirmRevoke}
        danger
        loading={working}
        onConfirm={() => confirming && void act(confirming.row, "revoke")}
        onCancel={() => setConfirming(null)}
      />
      <ConfirmDialog
        open={confirming?.action === "grant"}
        title={strings.consents.grantAgainTitle}
        description={confirming ? strings.consents.grantAgainDescription(consumerName(confirming.row), capabilityTitle(confirming.row.capabilityId)) : ""}
        confirmLabel={strings.consents.confirmGrant}
        loading={working}
        onConfirm={() => confirming && void act(confirming.row, "grant")}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
