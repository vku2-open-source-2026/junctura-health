// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { isMedicalKey, type ExecutionItem } from "../data";

// ---------------------------------------------------------------- shapes from Core

/** One line of `GET /v1/applications/stats` (management aggregates only). */
export interface AppStatsApplication {
  id: string;
  name: string;
  state: string;
  registeredAt: string | null;
  lastActivityAt: string | null;
  calls: {
    outgoing: { last24h: number; last7d: number };
    incoming: { last24h: number; last7d: number };
  };
  capabilities: { published: number };
  connections: { given: number; received: number };
  data: { collections: number; records: number };
  files: { count: number; bytes: number } | null;
}

export interface AppStats {
  generatedAt: string;
  totals: {
    applications: number;
    activeApplications: number;
    activeLast24h: number;
    activeLast7d: number;
    activeConnections: number;
  };
  applications: readonly AppStatsApplication[];
}

/** One collection line of `GET /v1/storage/summary` or `GET /v1/storage/collections`. */
export interface StorageCollection {
  name: string;
  records: number;
  updatedAt: string | null;
  fields?: readonly { name: string; type: string; fillRate: number }[];
}

/** One application line of the storage summary; `files` is null without objects storage. */
export interface StorageApplication {
  id: string;
  name: string;
  state: string;
  collections: readonly StorageCollection[];
  files: { count: number; bytes: number; quarantined: number; updatedAt: string | null } | null;
}

export interface StorageSummary {
  applications: readonly StorageApplication[];
  totals: { collections: readonly StorageCollection[]; files: { count: number; bytes: number; quarantined: number; updatedAt: string | null } | null };
}

/** One protected audit event as `GET /v1/audit-events` returns it; only some fields are ever displayed. */
export interface AuditEventItem {
  eventId: string;
  occurredAt: string;
  tenantId: string;
  schemaVersion: number;
  event: string;
  resourceType: string;
  resourceId: string;
  revision: number;
  actorAppId: string | null;
  issuer: string;
  subject: string;
  managementClient: boolean;
  outcome: string;
  reasonCode: string | null;
  reason: string | null;
}

export interface AuditEventList {
  items: readonly AuditEventItem[];
  nextCursor: string | null;
}

/** The selectable time ranges of the exchange page. */
export type ExchangeRange = "24h" | "7d" | "all";

export const EXCHANGE_RANGES: readonly ExchangeRange[] = ["24h", "7d", "all"];

/** The audit-events query for a range: newest first, at most 100 events, optionally filtered by `since`. */
export const auditPathFor = (range: ExchangeRange, now: Date = new Date()): string => {
  const path = "/v1/audit-events?limit=100";
  if (range === "all") return path;
  const milliseconds = range === "24h" ? 86_400_000 : 7 * 86_400_000;
  return `${path}&since=${new Date(now.getTime() - milliseconds).toISOString()}`;
};

// ---------------------------------------------------------------- waiting per facility

/** Waiting work at one facility: how many running cases sit at its step, and how many for over 24 hours. */
export interface WaitingFacility {
  facility: string;
  total: number;
  overdue: number;
}

/** Groups running executions by the candidate groups of their current step; busiest facility first. */
export const waitingByFacility = (
  items: readonly ExecutionItem[],
  now: Date = new Date(),
): readonly WaitingFacility[] => {
  const byFacility = new Map<string, WaitingFacility>();
  for (const item of items) {
    if (item.status !== "running") continue;
    for (const facility of item.currentStep?.groups ?? []) {
      const entry = byFacility.get(facility) ?? { facility, total: 0, overdue: 0 };
      entry.total += 1;
      const updated = item.updatedAt == null ? Number.NaN : Date.parse(item.updatedAt);
      if (Number.isNaN(updated) || now.getTime() - updated > 86_400_000) entry.overdue += 1;
      byFacility.set(facility, entry);
    }
  }
  return [...byFacility.values()].sort((a, b) => b.total - a.total || a.facility.localeCompare(b.facility));
};

// ---------------------------------------------------------------- processing time

/** Processing-time statistics of one workflow key, from completed executions only. */
export interface DurationStats {
  key: string;
  count: number;
  median: number | null;
  max: number | null;
}

/** Median and longest processing time per medical workflow key; other keys stay out. */
export const durationStatsByWorkflow = (items: readonly ExecutionItem[]): readonly DurationStats[] => {
  const durations = new Map<string, number[]>();
  for (const item of items) {
    const key = item.definition?.key ?? "";
    if (!isMedicalKey(key)) continue;
    if (item.status !== "completed") continue;
    const started = item.startedAt == null ? Number.NaN : Date.parse(item.startedAt);
    const updated = item.updatedAt == null ? Number.NaN : Date.parse(item.updatedAt);
    if (Number.isNaN(started) || Number.isNaN(updated) || updated < started) continue;
    const list = durations.get(key) ?? [];
    list.push(updated - started);
    durations.set(key, list);
  }
  return [...durations.entries()].map(([key, list]) => {
    const sorted = [...list].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    return { key, count: sorted.length, median, max: sorted[sorted.length - 1] };
  });
};

/** A duration in plain Vietnamese: minutes under an hour, hours with one decimal beyond. */
export const formatDuration = (milliseconds: number): string => {
  if (!Number.isFinite(milliseconds)) return "—";
  const minutes = milliseconds / 60_000;
  if (minutes < 1) return "Dưới một phút";
  if (minutes < 60) return `${Math.round(minutes)} phút`;
  const hours = minutes / 60;
  return `${(Math.round(hours * 10) / 10).toLocaleString("vi-VN")} giờ`;
};

// ---------------------------------------------------------------- audit classification

/** Count of audit events per family (the prefix before the first dot), busiest first. */
export const eventFamilyCounts = (items: readonly AuditEventItem[]): readonly { family: string; count: number }[] => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const family = item.event.split(".")[0] ?? item.event;
    counts.set(family, (counts.get(family) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([family, count]) => ({ family, count }))
    .sort((a, b) => b.count - a.count || a.family.localeCompare(b.family));
};

/** The emergency-access events the health department must review. */
export const emergencyEvents = (items: readonly AuditEventItem[]): readonly AuditEventItem[] =>
  items.filter(item => item.event === "execution.emergency_access");

/** Actor id -> application name, from the application statistics. */
export const appNamesById = (applications: readonly AppStatsApplication[]): ReadonlyMap<string, string> =>
  new Map(applications.map(application => [application.id, application.name]));

/** The displayed actor of an audit event: the application name, or a plain phrase for management staff. */
export const actorLabel = (actorAppId: string | null, names: ReadonlyMap<string, string>): string => {
  if (actorAppId == null) return "Quản trị viên";
  return names.get(actorAppId) ?? "Ứng dụng";
};

/** Application statistics indexed by display name, to annotate the sharing map with real call counts. */
export const appStatsByName = (
  applications: readonly AppStatsApplication[],
): ReadonlyMap<string, AppStatsApplication> => new Map(applications.map(application => [application.name, application]));

// ---------------------------------------------------------------- formatting

/** A byte size in plain Vietnamese units, using the vi-VN decimal comma. */
export const bytesLabel = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} byte`;
  const units = ["KiB", "MiB", "GiB"] as const;
  let value = bytes;
  let unit = "byte";
  for (const next of units) {
    if (value < 1024) break;
    value /= 1024;
    unit = next;
  }
  return `${(Math.round(value * 10) / 10).toLocaleString("vi-VN")} ${unit}`;
};

/** The "hh:mm:ss" part of a timestamp, for the "Cập nhật lúc" line. */
export const formatClock = (date: Date): string => date.toLocaleTimeString("vi-VN", { hour12: false });
