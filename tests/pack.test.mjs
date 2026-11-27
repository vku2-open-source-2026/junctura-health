// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getContract } from "../contracts/index.mjs";

// The supported Junctura Workspace revision provides the pack format schemas and the
// pack reader (server/packs.mjs). Both are imported at test time only, never copied
// into this repository. CI checks out the pinned revision into .junctura-workspace;
// locally the same path works, or point JUNCTURA_WORKSPACE_DIR at another checkout.
const WORKSPACE_REVISION = "73171dae8d50031a6d52c8dde7cfcd82bebb68ef";

const explicit = process.env.JUNCTURA_WORKSPACE_DIR;
// An explicit JUNCTURA_WORKSPACE_DIR pins the checkout: no fallback, fail loudly instead.
const workspace = (explicit ? [explicit] : [".junctura-workspace", "../junctura-workspace"])
  .map(dir => resolve(dir))
  .find(dir => existsSync(resolve(dir, "server/packs.mjs")));
const readerReady = Boolean(workspace
  && existsSync(resolve(workspace, "server/node_modules/ajv"))
  && existsSync(resolve(workspace, "server/node_modules/saxes")));

// An explicit JUNCTURA_WORKSPACE_DIR means the check must fail loudly, never skip.
let skip = false;
if (!workspace) skip = explicit ? false : "junctura-workspace checkout not found (pack/README.md; set JUNCTURA_WORKSPACE_DIR)";
else if (!readerReady) skip = explicit ? false : `pack reader dependencies missing: npm --prefix ${workspace}/server ci`;

// The real DX-OS engine policy: a sibling checkout (local) or the copy CI checks out.
// Imported at test time only, never copied into this repository.
const dxos = [process.env.JUNCTURA_DXOS_DIR, ".junctura-dxos", "../junctura-dxos"]
  .filter(Boolean).map(dir => resolve(dir, "src/modules/workflow/definition-policy.mjs")).find(existsSync);

const packDir = fileURLToPath(new URL("../pack/", import.meta.url));
const manifest = JSON.parse(readFileSync(new URL("../pack/pack.json", import.meta.url), "utf8"));
const workflowXml = workflow => readFileSync(new URL(`../pack/${workflow.bpmn}`, import.meta.url), "utf8");

test("the health pack is manifest-complete and aligned with the Tier-2 contracts", () => {
  assert.equal(manifest.formatVersion, 1);
  assert.equal(manifest.id, "health");
  assert.equal(manifest.language, "vi");
  assert.deepEqual(manifest.workflows.map(workflow => workflow.id), ["chuyentuyen", "thanhtoan"]);
  assert.deepEqual(manifest.workflows.map(workflow => workflow.recordType), ["chuyen-tuyen", "thanh-toan"]);
  const transfer = readFileSync(new URL("../workflows/chuyen-tuyen.bpmn20.xml", import.meta.url), "utf8");
  assert.match(transfer, /<process id="junctura_chuyen_tuyen"/, "the shared transfer definition keeps its Tier-2 key");
  for (const slug of ["referral-summary", "claim-verify"]) assert.ok(getContract(slug), `${slug}: capability contract`);
  const readme = readFileSync(new URL("../pack/README.md", import.meta.url), "utf8");
  for (const needle of ["chuyentuyen", "thanhtoan", "chuyen-tuyen", "thanh-toan", "junctura_chuyen_tuyen", WORKSPACE_REVISION]) {
    assert.ok(readme.includes(needle), `pack/README.md documents ${needle}`);
  }
});

test("pack/ passes the pack reader of the supported Workspace revision", { skip }, async () => {
  assert.ok(workspace, "JUNCTURA_WORKSPACE_DIR is set but has no server/packs.mjs");
  assert.ok(readerReady, `pack reader dependencies missing: npm --prefix ${workspace}/server ci`);
  const { readPack } = await import(pathToFileURL(resolve(workspace, "server/packs.mjs")).href);
  const result = await readPack(packDir);
  assert.deepEqual(result.errors ?? [], [], "readPack errors");
  assert.equal(result.ok, true, "readPack must accept pack/");
  const { manifest: read, units, workflows } = result.pack;

  assert.equal(read.formatVersion, 1);
  assert.equal(read.id, "health");
  assert.equal(read.unitsFile, "units.json");
  assert.deepEqual(read.workflows.map(workflow => workflow.id), ["chuyentuyen", "thanhtoan"]);
  assert.deepEqual(read.workflows.map(workflow => workflow.recordType), ["chuyen-tuyen", "thanh-toan"]);

  // Sample units: synthetic, one tree, one root.
  assert.deepEqual(units.units.map(unit => unit.id).sort(), ["benh-vien-x", "so-y-te-x", "tram-y-te-y"]);
  assert.deepEqual(units.units.filter(unit => unit.parent == null).map(unit => unit.id), ["so-y-te-x"]);

  for (const workflow of workflows) {
    const declared = read.workflows.find(item => item.id === workflow.id);
    assert.equal(workflow.processId, workflow.id, `${workflow.id}: process/@id`);
    assert.deepEqual(workflow.userTaskIds, declared.steps.map(step => step.id), `${workflow.id}: userTasks match steps`);
    assert.match(workflow.bpmn, /\.bpmn20\.xml$/, `${workflow.id}: .bpmn20.xml like the other Junctura repos`);
    assert.ok(workflow.xml.includes("<userTask"), `${workflow.id}: xml carried through`);
  }
});

// The pack's BPMN subset: flow nodes and sequence flows, parsed structurally. The
// reader (above) owns XML well-formedness; here ids and routing are what matter.
const attr = (source, name) => new RegExp(`\\b${name}="([^"]*)"`, "u").exec(source)?.[1];
const parseGraph = xml => {
  const nodes = new Map();
  for (const match of xml.matchAll(/<(startEvent|userTask|exclusiveGateway|endEvent)\b([^>]*?)(?:\/>|>[\s\S]*?<\/\1>)/g)) {
    const id = attr(match[2], "id");
    assert.ok(id && !nodes.has(id), `node id "${id}" is unique`);
    nodes.set(id, match[1]);
  }
  // Self-closing flows first (no body); only then paired flows, whose body may
  // carry the conditionExpression routing the flow by decision id.
  const flows = [];
  const rest = xml.replace(/<sequenceFlow\b([^>]*?)\/>/g, (_, source) => {
    flows.push({ source: attr(source, "sourceRef"), target: attr(source, "targetRef"), decision: null });
    return "";
  });
  for (const match of rest.matchAll(/<sequenceFlow\b([^>]*?)>([\s\S]*?)<\/sequenceFlow>/g)) {
    flows.push({
      source: attr(match[1], "sourceRef"),
      target: attr(match[1], "targetRef"),
      decision: /\$\{\s*decision\s*==\s*'([^']*)'\s*\}/.exec(match[2])?.[1] ?? null,
    });
  }
  return { nodes, flows };
};

const reachableFrom = (flows, start) => {
  const reached = new Set([start]);
  for (let changed = true; changed;) {
    changed = false;
    for (const flow of flows) if (reached.has(flow.source) && !reached.has(flow.target)) { reached.add(flow.target); changed = true; }
  }
  return reached;
};

test("every declared decision is routed by id to the documented next step", () => {
  for (const workflow of manifest.workflows) {
    const { nodes, flows } = parseGraph(workflowXml(workflow));
    const label = `${workflow.id}: `;

    // Structurally sound: flows reference real nodes, one start, one end, every
    // flow node sits on a path from the start to the end.
    for (const flow of flows) {
      assert.ok(nodes.has(flow.source) && nodes.has(flow.target), `${label}flow ${flow.source} -> ${flow.target} references real nodes`);
    }
    const starts = [...nodes].filter(([, element]) => element === "startEvent").map(([id]) => id);
    const ends = [...nodes].filter(([, element]) => element === "endEvent").map(([id]) => id);
    assert.equal(starts.length, 1, `${label}one startEvent`);
    assert.equal(ends.length, 1, `${label}one endEvent`);
    const fromStart = reachableFrom(flows, starts[0]);
    for (const [id, element] of nodes) {
      assert.ok(fromStart.has(id), `${label}"${id}" (${element}) is not reachable from start`);
      assert.ok(reachableFrom(flows, id).has(ends[0]), `${label}"${id}" (${element}) cannot reach the end`);
    }

    // Routing: after each step, its decisions — and nothing else — pick the branch.
    const taskIds = [...nodes].filter(([, element]) => element === "userTask").map(([id]) => id);
    assert.deepEqual(taskIds, workflow.steps.map(step => step.id), `${label}userTasks match steps in order`);
    const gateways = new Set([...nodes].filter(([, element]) => element === "exclusiveGateway").map(([id]) => id));
    for (const [stepIndex, step] of workflow.steps.entries()) {
      const outgoing = flows.filter(flow => flow.source === step.id);
      const branches = step.decisions.length > 1
        ? (() => {
          assert.equal(outgoing.length, 1, `${label}${step.id}: one flow from the task to its decision gateway`);
          const [toGateway] = outgoing;
          assert.ok(gateways.has(toGateway.target), `${label}${step.id}: decisions branch at an exclusiveGateway`);
          const gated = flows.filter(flow => flow.source === toGateway.target);
          assert.deepEqual(gated.map(flow => flow.decision).sort(), [...step.decisions.map(d => d.id)].sort(),
            `${label}${step.id}: every declared decision has exactly one gateway branch, routed by decision id`);
          return gated;
        })()
        : (() => {
          assert.equal(outgoing.length, 1, `${label}${step.id}: the single decision advances on one flow`);
          assert.equal(outgoing[0].decision, null, `${label}${step.id}: the single decision needs no condition`);
          return outgoing;
        })();

      for (const decision of step.decisions) {
        const branch = step.decisions.length > 1 ? branches.find(flow => flow.decision === decision.id) : branches[0];
        const after = reachableFrom(flows, branch.target);
        if (decision.outcome === "reject") {
          assert.ok(after.has(ends[0]) && ![...after].some(id => nodes.get(id) === "userTask"),
            `${label}${step.id}/${decision.id}: reject terminates without approving`);
        } else if (decision.outcome === "request-info") {
          const previous = workflow.steps[stepIndex - 1];
          assert.ok(previous && branch.target === previous.id,
            `${label}${step.id}/${decision.id}: request-info loops to the preceding step ${previous?.id}`);
        } else {
          const next = workflow.steps[stepIndex + 1];
          assert.ok(next ? branch.target === next.id : branch.target === ends[0],
            `${label}${step.id}/${decision.id}: ${decision.outcome} moves to ${next?.id ?? "the end"}`);
        }
      }
    }
  }
});

test("pack BPMN passes the pinned DX-OS engine policy with tasks", { skip: dxos ? false : "junctura-dxos checkout not found (set JUNCTURA_DXOS_DIR)" }, async () => {
  const { validateDefinition } = await import(pathToFileURL(dxos).href);
  for (const workflow of manifest.workflows) {
    const result = validateDefinition(workflowXml(workflow), { includeTasks: true });
    assert.deepEqual(result.problems ?? [], [], `${workflow.id}: engine policy`);
    assert.equal(result.ok, true, `${workflow.id}: must deploy to DX-OS`);
    assert.equal(result.key, workflow.id, `${workflow.id}: engine process key`);
    const tasks = new Map(result.tasks.map(task => [task.id, task]));
    for (const step of workflow.steps) {
      assert.ok(tasks.has(step.id), `${workflow.id}: step "${step.id}" is a userTask`);
      assert.deepEqual(tasks.get(step.id).groups, [step.role], `${workflow.id}/${step.id}: candidate group is the manifest role`);
    }
  }
});
