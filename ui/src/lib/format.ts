// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
const DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/** "2026-10-28" or an ISO timestamp -> "28/10/2026"; anything else -> "Chưa rõ". */
export function formatDate(value: string | null | undefined): string {
  const match = DATE.exec(value ?? "");
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "Chưa rõ";
}

/** ISO timestamp -> "28/10/2026 09:15" in Vietnam time (UTC+7), 24-hour clock. */
export function formatDateTime(value: string | null | undefined): string {
  const time = Date.parse(value ?? "");
  if (Number.isNaN(time)) return "Chưa rõ";
  const shifted = new Date(time + 7 * 3_600_000).toISOString();
  return `${formatDate(shifted)} ${shifted.slice(11, 16)}`;
}

export const formatNumber = (value: number): string => new Intl.NumberFormat("vi-VN").format(value);

export const ageFromBirthYear = (birthYear: number, now: Date = new Date()): number => Math.max(0, now.getUTCFullYear() - birthYear);

/** True when `value` is older than `days` days before `now`; unknown dates count as stale. */
export function isStale(value: string | null | undefined, days: number, now: Date = new Date()): boolean {
  const time = Date.parse(value ?? "");
  return Number.isNaN(time) || now.getTime() - time > days * 86_400_000;
}

export const sexLabel = (sex: string): string => (sex === "male" ? "Nam" : sex === "female" ? "Nữ" : "Chưa rõ");
