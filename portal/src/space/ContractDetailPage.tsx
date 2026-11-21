// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { Badge, Button, DataTable, EmptyState } from "@junctura/health-ui";
import type { Column } from "@junctura/health-ui";
import { navigateHash } from "../router";
import { contractView } from "./data";
import type { ContractView, FieldView } from "./data";
import { SpacePage } from "./layout";
import { spaceStrings as s } from "./strings";

const fieldColumns: Column<FieldView>[] = [
  { key: "name", header: s.contract.fields.name, mono: true },
  { key: "type", header: s.contract.fields.type, mono: true },
  { key: "required", header: s.contract.fields.required, render: row => (row.required ? s.contract.fields.required : s.contract.fields.optional) },
  { key: "description", header: s.contract.fields.description, render: row => row.description ?? "—" },
];

const FieldTable = ({ caption, rows }: { caption: string; rows: readonly FieldView[] }) => (
  <DataTable caption={caption} columns={fieldColumns} rows={[...rows]} rowKey={row => row.name} empty={s.contract.noFields} className="mt-4" />
);

const Code = ({ children }: { children: string }) => <span className="font-mono text-xs text-muted">{children}</span>;

/** Detail of one capability contract; an unknown slug shows a not-found state with a way back. */
export function ContractDetailPage({ slug }: { slug: string }) {
  const view = contractView(slug);
  if (!view) {
    return (
      <SpacePage title={s.contracts.title} current="/hop-dong">
        <EmptyState title={s.contract.notFoundTitle}>{s.contract.notFoundLead}</EmptyState>
        <p className="mt-4 text-center">
          <Button variant="secondary" onClick={() => navigateHash("/hop-dong")}>{s.contract.backToList}</Button>
        </p>
      </SpacePage>
    );
  }
  return <ContractDetail view={view} />;
}

function ContractDetail({ view }: { view: ContractView }) {
  return (
    <SpacePage title={view.title} lead={view.description} current="/hop-dong">
      <div className="space-y-8">
        <ul className="flex flex-wrap gap-2">
          <li><Badge tone="brand">{s.contract.version} {view.version}</Badge></li>
          <li>
            <Badge tone={view.emergencyAccess ? "warn" : "neutral"}>
              {view.emergencyAccess ? s.contract.emergencyAllowed : s.contract.emergencyForbidden}
            </Badge>
          </li>
        </ul>

        <section aria-label={s.contract.provider} className="rounded-lg border border-line bg-surface p-5 shadow-card">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">{s.contract.provider}</dt>
              <dd className="mt-1 text-sm font-medium">{view.providerName} <Code>{view.provider}</Code></dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">{s.contract.consumers}</dt>
              <dd className="mt-1 space-x-3 text-sm font-medium">
                {view.consumers.map((code, index) => (
                  <span key={code} className="inline-block">{view.consumerNames[index]} <Code>{code}</Code></span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">{s.contract.purposes}</dt>
              <dd className="mt-1 space-x-3 text-sm font-medium">
                {view.purposes.map((code, index) => (
                  <span key={code} className="inline-block">{view.purposeNames[index]} <Code>{code}</Code></span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">{s.contract.timeout}</dt>
              <dd className="mt-1 text-sm font-medium">{view.timeoutMs} ms</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-muted">{s.contract.sideEffects}</dt>
              <dd className="mt-1 text-sm">{view.sideEffects}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="contract-inputs-h">
          <h2 id="contract-inputs-h" className="text-xl font-semibold">{s.contract.inputs}</h2>
          <FieldTable caption={s.contract.inputs} rows={view.inputs} />
        </section>

        <section aria-labelledby="contract-outputs-h">
          <h2 id="contract-outputs-h" className="text-xl font-semibold">{s.contract.outputs}</h2>
          <FieldTable caption={s.contract.outputs} rows={view.outputs} />
        </section>
      </div>
    </SpacePage>
  );
}
