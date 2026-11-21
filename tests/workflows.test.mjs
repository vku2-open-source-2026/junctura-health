// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { validateDefinition } from "./support/definition-policy.mjs";

const dir = fileURLToPath(new URL("../workflows/", import.meta.url));
const files = readdirSync(dir).filter((name) => name.endsWith(".bpmn20.xml")).sort();

test("workflows/ has the three medical BPMN definitions", () => {
  assert.deepEqual(files,
    ["chuyen-tuyen.bpmn20.xml", "xac-minh-chi-phi.bpmn20.xml", "xac-minh-don-thuoc.bpmn20.xml"]);
});

test("every BPMN file in workflows/ passes the Tier 1 definition policy", () => {
  assert.ok(files.length >= 1, "no BPMN definitions found in workflows/");
  for (const file of files) {
    const result = validateDefinition(readFileSync(dir + file, "utf8"));
    assert.deepEqual(result.problems ?? [], [], `${file}: policy`);
    assert.equal(result.ok, true, `${file}: must validate`);
  }
});

test("process keys are unique across workflows/", () => {
  const keys = files.map((file) => {
    const result = validateDefinition(readFileSync(dir + file, "utf8"));
    assert.equal(result.ok, true, `${file}: must validate`);
    return result.key;
  });
  assert.equal(new Set(keys).size, keys.length, `duplicate process keys: ${keys.join(", ")}`);
});
