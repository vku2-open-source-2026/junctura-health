// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { APPS, CONTRACTS, PURPOSE, buildManifest, checkContext, getContract, validateValue } from "../contracts/index.mjs";

const PROVIDER = "11111111-1111-4111-8111-111111111111";
const example = slug => JSON.parse(readFileSync(new URL(`../contracts/examples/${slug}.json`, import.meta.url), "utf8"));

// Junctura's own manifest validator, from a sibling checkout (local) or the copy CI checks out.
// Imported at test time only, never copied into this repository.
const dxos = [process.env.JUNCTURA_DXOS_DIR, ".junctura-dxos", "../junctura-dxos"]
  .filter(Boolean).map(dir => resolve(dir, "src/modules/capability/registry/manifest.mjs")).find(existsSync);

test("six contracts, one file each, with consistent metadata", () => {
  const files = readdirSync(new URL("../contracts/capabilities/", import.meta.url)).filter(name => name.endsWith(".json")).sort();
  assert.deepEqual(CONTRACTS.map(c => `${c.slug}.json`), files);
  assert.deepEqual(CONTRACTS.map(c => c.slug).sort(),
    ["allergy-list", "claim-verify", "pre-visit-summary", "prescription-verify", "referral-summary", "vaccination-history"]);
  for (const c of CONTRACTS) {
    assert.match(c.version, /^\d+\.\d+\.\d+$/, c.slug);
    assert.ok(APPS.includes(c.provider), `${c.slug}: provider`);
    assert.ok(c.consumers.length && c.consumers.every(app => APPS.includes(app) && app !== c.provider), `${c.slug}: consumers`);
    assert.ok(c.purposes.length && c.purposes.every(p => PURPOSE.test(p)), `${c.slug}: purposes`);
    assert.equal(typeof c.emergencyAccess, "boolean");
    assert.equal(c.sideEffects.kind, "none", `${c.slug}: health reads have no side effects`);
    assert.ok(Object.isFrozen(c) && Object.isFrozen(c.outputSchema));
  }
});

test("allergy outputs say whether allergies were recorded (an empty list is never \"none\")", () => {
  for (const slug of ["allergy-list", "pre-visit-summary"]) {
    const schema = getContract(slug).outputSchema;
    assert.ok(schema.required.includes("allergyState"), `${slug}: allergyState is required`);
    assert.match(schema.properties.allergyState.description, /none-known/, slug);
    assert.match(schema.properties.allergyState.description, /not-recorded/, slug);
    assert.equal(example(slug).output.allergyState, "recorded", slug);
    const empty = structuredClone(example(slug).output);
    delete empty.allergyState;
    assert.ok(validateValue(schema, empty).some(issue => issue.path === "/allergyState"), `${slug}: output without allergyState is invalid`);
  }
});

test("every example input and output matches its schema", () => {
  for (const c of CONTRACTS) {
    const { input, output } = example(c.slug);
    assert.deepEqual(validateValue(c.inputSchema, input), [], `${c.slug}: input`);
    assert.deepEqual(validateValue(c.outputSchema, output), [], `${c.slug}: output`);
  }
});

test("validation rejects unknown fields, missing fields and out-of-bound values", () => {
  const c = getContract("claim-verify");
  assert.deepEqual(validateValue(c.outputSchema, { matches: true, checkedAt: "2026-11-02T04:00:00.000Z", diagnosis: "x" }),
    [{ path: "/diagnosis", message: "unknown property" }], "insurance never receives extra data");
  assert.deepEqual(validateValue(c.inputSchema, { claimId: "HS-1" }), [{ path: "/amountVnd", message: "required" }]);
  assert.equal(validateValue(c.inputSchema, { claimId: "HS-1", amountVnd: -1 }).length, 1);
  assert.equal(validateValue(c.inputSchema, { claimId: "", amountVnd: 1 }).length, 1);
  const summary = getContract("pre-visit-summary"), output = structuredClone(example("pre-visit-summary").output);
  output.recentEncounters = Array(4).fill(output.recentEncounters[0]);
  assert.deepEqual(validateValue(summary.outputSchema, output), [{ path: "/recentEncounters", message: "expected 0-3 items" }]);
});

test("purpose, data subject and emergency rules", () => {
  const subject = "6f1c2c1e-0000-4000-8000-000000000001";
  assert.deepEqual(checkContext("allergy-list", { purpose: "dispensing", dataSubject: subject }), { allowed: true });
  assert.deepEqual(checkContext("allergy-list", { purpose: "treatment", dataSubject: subject, emergency: true }), { allowed: true });
  assert.equal(checkContext("allergy-list", { purpose: "marketing", dataSubject: subject }).reason, "purpose_not_allowed");
  assert.equal(checkContext("allergy-list", { purpose: "treatment" }).reason, "data_subject_required");
  assert.equal(checkContext("vaccination-history", { purpose: "treatment", dataSubject: subject, emergency: true }).reason, "emergency_not_allowed");
  assert.equal(checkContext("claim-verify", undefined).reason, "data_subject_required");
  assert.throws(() => getContract("unknown"), RangeError);
});

test("built manifests have the provider's identifiers", () => {
  const manifest = buildManifest("referral-summary", PROVIDER);
  assert.equal(manifest.capabilityId, `urn:junctura:capability:${PROVIDER}:referral-summary`);
  assert.deepEqual(manifest.requiredPermissions, [`urn:junctura:permission:${PROVIDER}:referral-summary`]);
  assert.equal(manifest.invocation.path, "/capabilities/referral-summary");
  assert.throws(() => buildManifest("referral-summary", "NOT-A-UUID"), TypeError);
  manifest.inputSchema.properties.extra = { type: "null" };
  assert.ok(!("extra" in getContract("referral-summary").inputSchema.properties), "manifests are copies");
});

test("built manifests pass Junctura's own manifest validator", { skip: dxos ? false : "junctura-dxos checkout not found (set JUNCTURA_DXOS_DIR)" }, async () => {
  const { validateManifest } = await import(pathToFileURL(dxos).href);
  for (const c of CONTRACTS) assert.deepEqual(validateManifest(buildManifest(c, PROVIDER)), [], c.slug);
});
