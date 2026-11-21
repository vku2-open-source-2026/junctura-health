// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, formatDateTime, formatNumber } from "@junctura/health-ui";
import { useDesk } from "../context";
import { DeskPage } from "../layout";
import { DeskError, DeskLoading } from "../states";
import { appStateLabel } from "./strings";
import { dataStrings as d } from "./strings";
import { bytesLabel, type StorageApplication, type StorageCollection, type StorageSummary } from "./logic";

/** One collection line: name, record count and last update — no field values, ever. */
const CollectionRow = ({ collection }: { collection: StorageCollection }) => (
  <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2">
    <span className="font-mono text-sm">{collection.name}</span>
    <span className="text-sm text-ink-2 tabular-nums">{formatNumber(collection.records)} bản ghi</span>
    <span className="text-xs text-muted">{formatDateTime(collection.updatedAt)}</span>
  </li>
);

/** The field list of one application, read on demand from `GET /v1/storage/collections`. */
const FieldList = ({ appId, api }: { appId: string; api: ReturnType<typeof useDesk>["api"] }) => {
  const [collections, setCollections] = useState<readonly StorageCollection[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setCollections(null);
    api.getJson<{ collections: readonly StorageCollection[] }>(`/v1/storage/collections?application=${appId}`)
      .then(result => { if (active) setCollections(result.collections); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [api, appId]);

  if (failed) return <p className="mt-3 text-sm text-ink-2">{d.dataMap.fieldsNone}</p>;
  if (collections === null) return <p className="mt-3 text-sm text-muted">{d.dataMap.loadingFields}</p>;
  if (collections.length === 0) return <p className="mt-3 text-sm text-ink-2">{d.dataMap.fieldsNone}</p>;
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">{d.dataMap.fieldName}</th>
            <th scope="col" className="px-4 py-2 font-medium">{d.dataMap.fieldType}</th>
            <th scope="col" className="px-4 py-2 font-medium">{d.dataMap.fieldFillRate}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {collections.flatMap(collection =>
            (collection.fields ?? []).map(field => (
              <tr key={`${collection.name}-${field.name}`}>
                <td className="px-4 py-2 font-mono text-xs">{field.name}</td>
                <td className="px-4 py-2 text-ink-2">{field.type}</td>
                <td className="px-4 py-2 tabular-nums">{formatNumber(Math.round(field.fillRate))}%</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
};

/** One application card of the data map: its collections and its file aggregate. */
const ApplicationCard = ({ application, api }: { application: StorageApplication; api: ReturnType<typeof useDesk>["api"] }) => {
  const [open, setOpen] = useState(false);
  return (
    <Card
      title={application.name}
      className="mt-4"
      actions={<Badge tone={application.state === "active" ? "ok" : "neutral"}>{appStateLabel(application.state)}</Badge>}
    >

      <h3 className="mt-4 text-sm font-semibold">{d.dataMap.collectionsTitle}</h3>
      {application.collections.length === 0 ? (
        <p className="mt-2 text-sm text-ink-2">{d.dataMap.collectionsNone}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {application.collections.map(collection => <CollectionRow key={collection.name} collection={collection} />)}
        </ul>
      )}

      <h3 className="mt-4 text-sm font-semibold">{d.dataMap.filesTitle}</h3>
      {application.files === null ? (
        <p className="mt-2 text-sm text-ink-2">{d.dataMap.filesNone}</p>
      ) : (
        <p className="mt-2 text-sm text-ink-2">
          {formatNumber(application.files.count)} {d.dataMap.filesCount} · {bytesLabel(application.files.bytes)}
          {application.files.quarantined > 0 && (
            <> · <span className="font-medium">{formatNumber(application.files.quarantined)}</span> {d.dataMap.quarantined}</>
          )}
        </p>
      )}

      <p className="mt-4">
        <Button variant="secondary" size="md" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? d.dataMap.hideFields : d.dataMap.showFields}
        </Button>
      </p>
      {open && <FieldList appId={application.id} api={api} />}
    </Card>
  );
};

/**
 * D · Bản đồ dữ liệu: the storage summary of Layer 1 — per base application the
 * collection names with record counts and the file aggregates (count, size,
 * quarantined). Counts and names only, as the API returns them; field names and
 * fill rates load on demand when a card is expanded.
 */
export function DataMapPage() {
  const { api } = useDesk();
  const [summary, setSummary] = useState<StorageSummary | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    return api.getJson<StorageSummary>("/v1/storage/summary").then(setSummary).catch(setError);
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  if (error) {
    return (
      <DeskPage title={d.dataMap.title} lead={d.dataMap.lead} current="/dieu-hanh/du-lieu">
        <DeskError error={error} onRetry={() => void load()} />
      </DeskPage>
    );
  }
  if (!summary) {
    return (
      <DeskPage title={d.dataMap.title} lead={d.dataMap.lead} current="/dieu-hanh/du-lieu">
        <DeskLoading lines={6} />
      </DeskPage>
    );
  }

  const totals = summary.totals;
  return (
    <DeskPage title={d.dataMap.title} lead={d.dataMap.lead} current="/dieu-hanh/du-lieu">
      <p className="text-sm text-ink-2">{d.dataMap.explanation}</p>
      <p className="mt-2 text-sm text-muted">
        {formatNumber(totals.collections.length)} {d.dataMap.collectionsTitle.toLowerCase()}
        {totals.files && (
          <> · {formatNumber(totals.files.count)} {d.dataMap.filesCount} · {bytesLabel(totals.files.bytes)}
            {totals.files.quarantined > 0 && <> · {formatNumber(totals.files.quarantined)} {d.dataMap.quarantined}</>}
          </>
        )}
      </p>
      {summary.applications.map(application => (
        <ApplicationCard key={application.id} application={application} api={api} />
      ))}
    </DeskPage>
  );
}
