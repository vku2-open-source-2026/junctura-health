// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from "react";
import { Badge, Card, formatNumber } from "@junctura/health-ui";
import { useDesk } from "../context";
import { CONTRACT_VIEWS, type ContractView } from "../../space/data";
import { DeskPage } from "../layout";
import { DeskError, DeskLoading } from "../states";
import { dataStrings as d } from "./strings";
import { appStatsByName, type AppStats } from "./logic";

/** Sends the browser to the merged page, keeping the old `/danh-muc` link alive. */
export function CatalogRedirect() {
  useEffect(() => { window.location.hash = "#/dieu-hanh/chia-se"; }, []);
  return null;
}

/** One row of the catalog: contract, version, provider, consumers, purposes and emergency access. */
const CatalogRow = ({ view }: { view: ContractView }) => (
  <tr className="hover:bg-surface-2/60">
    <td className="px-4 py-3">
      <a href={`#/hop-dong/${view.slug}`} className="font-medium text-brand hover:underline">{view.title}</a>
    </td>
    <td className="px-4 py-3 text-ink-2">{view.version}</td>
    <td className="px-4 py-3">{view.providerName}</td>
    <td className="px-4 py-3 text-ink-2">{view.consumerNames.join(", ")}</td>
    <td className="px-4 py-3 text-ink-2">{view.purposeNames.join(", ")}</td>
    <td className="px-4 py-3">
      <Badge tone={view.emergencyAccess ? "danger" : "neutral"}>
        {view.emergencyAccess ? d.catalog.emergencyYes : d.catalog.emergencyNo}
      </Badge>
    </td>
  </tr>
);

/**
 * D · Chia sẻ dữ liệu và năng lực: the capability flows "facility A provides capability X
 * to facility B" built from the repository contracts, annotated with the real call counts
 * of the last 24 hours from the Layer 1 statistics, followed by the catalog of normalized
 * data contracts. Granting and revoking happens in the Layer 1 Console, never here.
 */
export function DataSharingPage() {
  const { api } = useDesk();
  const [stats, setStats] = useState<AppStats | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    return api.getJson<AppStats>("/v1/applications/stats").then(setStats).catch(setError);
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const contracts = CONTRACT_VIEWS;

  return (
    <DeskPage title={d.sharing.title} lead={d.sharing.lead} current="/dieu-hanh/chia-se">
      <p className="text-sm text-ink-2">{d.sharing.consoleNote}</p>

      {error ? (
        <div className="mt-4">
          <DeskError error={error} onRetry={() => void load()} />
        </div>
      ) : stats === null ? (
        <div className="mt-4">
          <DeskLoading lines={3} />
        </div>
      ) : (
        <Card title={d.sharing.flowTitle} className="mt-6">
          <p className="text-xs text-muted">{d.sharing.callsHint}</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">{d.sharing.columnProvider}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{d.sharing.columnCapability}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{d.sharing.columnConsumer}</th>
                  <th scope="col" className="px-4 py-3 font-medium">{d.sharing.columnCalls}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {contracts.flatMap(view =>
                  view.consumers.map((consumer, index) => {
                    const consumerName = view.consumerNames[index] ?? consumer;
                    const byName = appStatsByName(stats.applications);
                    const consumerStats = byName.get(consumerName);
                    const providerStats = byName.get(view.providerName);
                    return (
                      <tr key={`${view.slug}-${consumer}`} className="hover:bg-surface-2/60">
                        <td className="px-4 py-3">{view.providerName}</td>
                        <td className="px-4 py-3 font-medium">{view.title}</td>
                        <td className="px-4 py-3">{consumerName}</td>
                        <td className="px-4 py-3 text-ink-2 tabular-nums">
                          {consumerStats == null && providerStats == null
                            ? "—"
                            : `${formatNumber(consumerStats?.calls.outgoing.last24h ?? 0)} / ${formatNumber(providerStats?.calls.incoming.last24h ?? 0)}`}
                        </td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title={d.catalog.title} className="mt-4">
        <p className="text-sm text-ink-2">{d.catalog.lead}</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{d.sharing.columnCapability}</th>
                <th scope="col" className="px-4 py-3 font-medium">{d.catalog.columnVersion}</th>
                <th scope="col" className="px-4 py-3 font-medium">{d.sharing.columnProvider}</th>
                <th scope="col" className="px-4 py-3 font-medium">{d.sharing.columnConsumer}</th>
                <th scope="col" className="px-4 py-3 font-medium">{d.catalog.columnPurposes}</th>
                <th scope="col" className="px-4 py-3 font-medium">{d.catalog.columnEmergency}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {contracts.map(view => <CatalogRow key={view.slug} view={view} />)}
            </tbody>
          </table>
        </div>
      </Card>
    </DeskPage>
  );
}
