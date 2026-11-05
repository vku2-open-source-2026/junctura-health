// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Shared capability contracts of Junctura Health. One JSON file per capability in
// capabilities/; the provider application turns it into a Junctura manifest with
// its own enrolled application ID (buildManifest), and both sides validate payloads
// and invocation context against the same definition.
import { readFileSync, readdirSync } from "node:fs";

const HERE = new URL("./capabilities/", import.meta.url);
const SLUG = /^[a-z][a-z0-9-]{0,62}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const PURPOSE = /^[a-z][a-z0-9_]{1,62}$/;
export const APPS = Object.freeze(["junctura-clinic", "junctura-hospital", "junctura-myhealth", "junctura-pharmacy", "junctura-insurance"]);
const PLATFORM = ["caller-active", "provider-active", "grant-active", "same-tenant"];

const deepFreeze = value => {
  if (value && typeof value === "object") { Object.values(value).forEach(deepFreeze); Object.freeze(value); }
  return value;
};

export const CONTRACTS = deepFreeze(readdirSync(HERE).filter(name => name.endsWith(".json")).sort()
  .map(name => JSON.parse(readFileSync(new URL(name, HERE), "utf8"))));

export function getContract(slug) {
  const contract = CONTRACTS.find(item => item.slug === slug);
  if (!contract) throw new RangeError(`Unknown capability contract: ${slug}`);
  return contract;
}

/** The Junctura manifest (manifestVersion 1.0) a provider registers for this contract. */
export function buildManifest(slugOrContract, providerAppId) {
  const contract = typeof slugOrContract === "string" ? getContract(slugOrContract) : slugOrContract;
  if (typeof providerAppId !== "string" || !UUID.test(providerAppId)) throw new TypeError("providerAppId must be the provider's enrolled lowercase UUID");
  return {
    manifestVersion: "1.0",
    capabilityId: `urn:junctura:capability:${providerAppId}:${contract.slug}`,
    providerAppId,
    version: contract.version,
    title: contract.title,
    description: contract.description,
    inputSchema: structuredClone(contract.inputSchema),
    outputSchema: structuredClone(contract.outputSchema),
    invocation: { protocol: "http-json", method: "POST", path: `/capabilities/${contract.slug}`, mediaType: "application/json" },
    requiredPermissions: [`urn:junctura:permission:${providerAppId}:${contract.slug}`],
    sideEffects: structuredClone(contract.sideEffects),
    timeoutMs: contract.timeoutMs,
    preconditions: { approval: "none", platform: [...PLATFORM] },
  };
}

/**
 * Validates a JSON value against a contract schema (the Junctura payload profile:
 * object/array/string/integer/number/boolean/null with bounds). Returns issues;
 * an empty array means valid.
 */
export function validateValue(schema, value, path = "") {
  const issues = [];
  const fail = message => issues.push({ path: path || "/", message });
  switch (schema.type) {
    case "object":
      if (value === null || typeof value !== "object" || Array.isArray(value)) { fail("expected object"); break; }
      for (const key of Object.keys(value)) if (!Object.hasOwn(schema.properties, key)) issues.push({ path: `${path}/${key}`, message: "unknown property" });
      for (const key of schema.required) if (!Object.hasOwn(value, key)) issues.push({ path: `${path}/${key}`, message: "required" });
      for (const [key, child] of Object.entries(schema.properties)) if (Object.hasOwn(value, key)) issues.push(...validateValue(child, value[key], `${path}/${key}`));
      break;
    case "array":
      if (!Array.isArray(value)) { fail("expected array"); break; }
      if (value.length > schema.maxItems || value.length < (schema.minItems ?? 0)) fail(`expected ${schema.minItems ?? 0}-${schema.maxItems} items`);
      value.forEach((item, index) => issues.push(...validateValue(schema.items, item, `${path}/${index}`)));
      break;
    case "string": {
      if (typeof value !== "string") { fail("expected string"); break; }
      const length = [...value].length;
      if (length > schema.maxLength || length < (schema.minLength ?? 0)) fail(`expected length ${schema.minLength ?? 0}-${schema.maxLength}`);
      break;
    }
    case "integer":
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value) || (schema.type === "integer" && !Number.isSafeInteger(value))) { fail(`expected ${schema.type}`); break; }
      if (value < schema.minimum || value > schema.maximum) fail(`expected ${schema.minimum}-${schema.maximum}`);
      break;
    case "boolean":
      if (typeof value !== "boolean") fail("expected boolean");
      break;
    case "null":
      if (value !== null) fail("expected null");
      break;
    default:
      fail(`unsupported schema type ${schema.type}`);
  }
  return issues;
}

/**
 * Provider-side policy check on the redeemed invocation context: every health
 * capability concerns one person, is called for a declared purpose, and accepts
 * emergency (break-glass) calls only when the contract allows them.
 */
export function checkContext(slugOrContract, context) {
  const contract = typeof slugOrContract === "string" ? getContract(slugOrContract) : slugOrContract;
  if (!context || typeof context.dataSubject !== "string" || !context.dataSubject) return { allowed: false, reason: "data_subject_required" };
  if (!contract.purposes.includes(context.purpose)) return { allowed: false, reason: "purpose_not_allowed" };
  if (context.emergency === true && !contract.emergencyAccess) return { allowed: false, reason: "emergency_not_allowed" };
  return { allowed: true };
}

export const isSlug = value => typeof value === "string" && SLUG.test(value);
