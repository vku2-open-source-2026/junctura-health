// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from "react";
import { Badge, Card } from "@junctura/health-ui";
import { useDesk } from "./context";
import { DeskPage } from "./layout";
import { DeskEmpty, DeskError, DeskLoading } from "./states";
import { deskStrings as s } from "./strings";

/** An organization node of the tenant directory: the tenant root and its applications. */
interface DirectoryOrg {
  id: string;
  name: string;
  kind: string;
  children?: readonly DirectoryOrg[];
}

/** One principal of the tenant directory; subject, issuer and permissions are never shown. */
interface DirectoryPrincipal {
  displayName: string | null;
  organization: string | null;
  jobTitle: string | null;
  kind: string | null;
}

interface DirectoryOrganizations {
  root: DirectoryOrg;
  truncated?: boolean;
}

interface DirectoryPrincipals {
  items: readonly DirectoryPrincipal[];
  truncated?: boolean;
}

/** The label for an organization kind; unknown kinds stay as-is. */
const orgKindLabel = (kind: string): string =>
  kind === "platform" ? s.directory.kindPlatform : kind === "application" ? s.directory.kindApplication : kind;

/** The label for a principal kind; unknown kinds stay as-is. */
const kindLabel = (kind: string | null): string =>
  kind === null ? s.directory.kindPerson : kind === "admin" ? s.directory.kindAdmin : kind === "application" ? s.directory.kindApplication : kind;

/** H · Danh bạ: the organizations and people of the platform, from the Layer 1 directory. */
export function DirectoryPage() {
  const { api } = useDesk();
  const [orgs, setOrgs] = useState<DirectoryOrganizations | null>(null);
  const [principals, setPrincipals] = useState<readonly DirectoryPrincipal[] | null>(null);
  const [principalsTruncated, setPrincipalsTruncated] = useState(false);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    return Promise.all([
      api.getJson<DirectoryOrganizations>("/v1/directory/organizations"),
      api.getJson<DirectoryPrincipals>("/v1/directory/principals"),
    ])
      .then(([organizationsResult, principalsResult]) => {
        setOrgs(organizationsResult);
        setPrincipals(principalsResult.items.filter(person => person.kind !== "application"));
        setPrincipalsTruncated(principalsResult.truncated === true);
      })
      .catch(setError);
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  if (error) {
    return (
      <DeskPage title={s.directory.title} lead={s.directory.lead} current="/lam-viec/danh-ba">
        <DeskError error={error} onRetry={() => void load()} />
      </DeskPage>
    );
  }
  if (!orgs || principals === null) {
    return (
      <DeskPage title={s.directory.title} lead={s.directory.lead} current="/lam-viec/danh-ba">
        <DeskLoading lines={5} />
      </DeskPage>
    );
  }

  const needle = filter.trim().toLowerCase();
  const matches = (value: string | null): boolean => value != null && value.toLowerCase().includes(needle);

  const orgNodes: readonly { org: DirectoryOrg; depth: number }[] = [
    { org: orgs.root, depth: 0 },
    ...(orgs.root.children ?? []).map(child => ({ org: child, depth: 1 })),
  ].filter(({ org }) => needle === "" || matches(org.name));

  const people = principals.filter(person =>
    needle === "" || matches(person.displayName) || matches(person.organization) || matches(person.jobTitle));

  const groups = [...new Set(people.map(person => person.organization ?? s.directory.noOrg))]
    .map(organization => ({
      organization,
      members: people.filter(person => (person.organization ?? s.directory.noOrg) === organization),
    }));

  return (
    <DeskPage title={s.directory.title} lead={s.directory.lead} current="/lam-viec/danh-ba">
      <label className="block max-w-md">
        <span className="text-sm font-medium">{s.directory.filterLabel}</span>
        <input
          value={filter}
          onChange={event => setFilter(event.target.value)}
          className="mt-1 block w-full rounded-lg border border-control bg-surface px-3 py-2 text-sm"
        />
      </label>

      <Card title={s.directory.orgsTitle} className="mt-6">
        {orgNodes.length === 0 ? (
          <p className="text-sm text-ink-2">{s.directory.orgNone}</p>
        ) : (
          <ul className="space-y-3">
            {orgNodes.map(({ org, depth }) => (
              <li key={org.id} className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 ${depth > 0 ? "pl-5" : ""}`}>
                <span className="font-medium">{org.name}</span>
                <Badge tone={depth === 0 ? "brand" : "neutral"}>{orgKindLabel(org.kind)}</Badge>
              </li>
            ))}
          </ul>
        )}
        {orgs.truncated && <p className="mt-3 text-xs text-muted">{s.directory.truncated}</p>}
      </Card>

      <Card title={s.directory.peopleTitle} count={people.length} className="mt-4">
        {people.length === 0 ? (
          <DeskEmpty title={s.directory.peopleNone} />
        ) : (
          <ul className="space-y-5">
            {groups.map(group => (
              <li key={group.organization}>
                <h3 className="text-sm font-semibold">{group.organization}</h3>
                <ul className="mt-2 divide-y divide-line">
                  {group.members.map((person, index) => (
                    <li key={`${person.displayName ?? ""}-${index}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                      <span className="font-medium">{person.displayName ?? s.directory.kindPerson}</span>
                      <span className="text-sm text-ink-2">{person.jobTitle ?? "—"}</span>
                      <Badge tone="neutral">{kindLabel(person.kind)}</Badge>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
        {principalsTruncated && <p className="mt-3 text-xs text-muted">{s.directory.truncated}</p>}
      </Card>
    </DeskPage>
  );
}
