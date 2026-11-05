// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
export type Schema =
  | { type: "object"; description?: string; properties: Record<string, Schema>; required: string[]; additionalProperties: false }
  | { type: "array"; description?: string; items: Schema; minItems?: number; maxItems: number }
  | { type: "string"; description?: string; minLength?: number; maxLength: number }
  | { type: "integer" | "number"; description?: string; minimum: number; maximum: number }
  | { type: "boolean" | "null"; description?: string };
export type AppName = "junctura-clinic" | "junctura-hospital" | "junctura-myhealth" | "junctura-pharmacy" | "junctura-insurance";
export type Contract = Readonly<{
  slug: string; version: string; provider: AppName; consumers: AppName[]; purposes: string[]; emergencyAccess: boolean;
  title: string; description: string; inputSchema: Schema; outputSchema: Schema;
  sideEffects: { kind: "none" | "non-idempotent" | "idempotent"; description: string; idempotency: "none" | "provider-key" };
  timeoutMs: number;
}>;
export const PURPOSE: RegExp;
export const APPS: readonly AppName[];
export const CONTRACTS: readonly Contract[];
export function getContract(slug: string): Contract;
export function buildManifest(slugOrContract: string | Contract, providerAppId: string): Record<string, unknown>;
export function validateValue(schema: Schema, value: unknown, path?: string): { path: string; message: string }[];
export function checkContext(slugOrContract: string | Contract, context: { purpose?: string; dataSubject?: string; emergency?: boolean } | undefined):
  { allowed: true } | { allowed: false; reason: "data_subject_required" | "purpose_not_allowed" | "emergency_not_allowed" };
export function isSlug(value: unknown): boolean;
