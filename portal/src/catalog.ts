// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * The public catalog shown on the landing page, assembled at build time from the pure
 * modules of this repository: the capability contracts and the demo application names.
 */

import { CONTRACTS } from "@junctura/health-contracts";
import { APPS } from "@junctura/health-demo/plan";

export interface CatalogEntry {
  slug: string;
  version: string;
  title: string;
  description: string;
  provider: string;
  consumers: string[];
  purposes: string[];
  emergencyAccess: boolean;
}

export const appNames: ReadonlyMap<string, string> = new Map(APPS.map(app => [app.name, app.displayName]));

export const appName = (id: string): string => appNames.get(id) ?? id;

export const catalog: readonly CatalogEntry[] = CONTRACTS.map(contract => ({
  slug: contract.slug, version: contract.version, title: contract.title, description: contract.description,
  provider: contract.provider, consumers: [...contract.consumers], purposes: [...contract.purposes],
  emergencyAccess: contract.emergencyAccess,
}));

/** The capability URN is `urn:junctura:capability:<provider-app-id>:<slug>`. */
export function capabilityTitle(capabilityId: string): string {
  const slug = capabilityId.split(":").at(-1) ?? "";
  return catalog.find(entry => entry.slug === slug)?.title ?? capabilityId;
}
