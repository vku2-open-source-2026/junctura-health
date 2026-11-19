// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { APPS, renderAppEnv } from "../demo/plan.mjs";
import { loadData } from "../seed/generate.mjs";
import {
  createClient, fetchClientToken, parseArgs, readAppEnv, readAppEnvs, readSubjects, renderSummary, seedDemo,
} from "../demo/seed.mjs";
import {
  DEFAULT_TENANT, EICAR_CODE, SEED_APPS, dryRunPlan, eicarTestBytes, objectUuid, plannedDocuments,
  plannedRecords, plannedWorkflowItems, stableUuid, workflowIdempotencyKey,
} from "../demo/seed-plan.mjs";

const datasets = { clinic: loadData("clinic.json"), hospital: loadData("hospital.json"), insurance: loadData("insurance.json") };
const temp = () => mkdtempSync(join(tmpdir(), "junctura-seed-"));
const secret = "s3cr3t-never-print";

test("the plan maps each collection to its owning application, keyed by a stable ma field", () => {
  const plan = plannedRecords(datasets, "production");
  assert.deepEqual(plan.map(entry => [entry.app, entry.collection]), [
    ["junctura-clinic", "benh-nhan"], ["junctura-clinic", "chuyen-tuyen"],
    ["junctura-hospital", "don-thuoc"], ["junctura-hospital", "chi-phi-dieu-tri"],
    ["junctura-insurance", "yeu-cau-thanh-toan"],
  ]);
  assert.deepEqual(plan.map(entry => entry.records.length), [50, 12, 16, 12, 12]);
  assert.ok(!plan.some(entry => entry.app === "junctura-pharmacy"), "pharmacy keeps its own data");
  for (const entry of plan) {
    for (const record of entry.records) {
      assert.equal(typeof record.data.ma, "string");
      assert.equal(record.data.ma, record.ma);
    }
  }
  const referral = plan[1].records[0].data;
  assert.equal(referral.taiLieu, objectUuid("production", "junctura-clinic", referral.ma), "referral records link their document");
  assert.equal(new Set(plan[0].records.map(record => record.ma)).size, 50, "ma codes are unique per collection");
  for (const entry of plan) {
    assert.equal(new Set(entry.records.map(record => record.ma)).size, entry.records.length, `${entry.collection}: unique ma`);
  }
});

test("documents have stable UUIDs derived from (tenant, app, code) and fixed bytes", () => {
  const documents = plannedDocuments(datasets, "production");
  assert.equal(new Set(documents.map(document => document.uuid)).size, documents.length);
  for (const document of documents) {
    assert.match(document.uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.ok(document.bytes.length >= 1 && document.bytes.length <= 5 * 1024 * 1024);
  }
  assert.deepEqual(plannedDocuments(datasets, "production").map(document => [document.uuid, document.code]),
    documents.map(document => [document.uuid, document.code]), "same tenant, same UUIDs");
  assert.notEqual(plannedDocuments(datasets, "tenant-b").map(document => document.uuid),
    documents.map(document => document.uuid), "another tenant, other UUIDs");
  const eicar = documents.find(document => document.kind === "eicar");
  assert.equal(eicar.app, "junctura-clinic");
  assert.equal(eicar.code, EICAR_CODE);
  assert.deepEqual([...eicar.bytes], [...eicarTestBytes()]);
  assert.ok(!documents.some(document => document.app === "junctura-pharmacy"));
});

test("workflow items follow the old plan with the owning application per type", () => {
  const items = plannedWorkflowItems(datasets, "production");
  assert.deepEqual(items.map(item => [item.key, item.definitionKey, item.outcome, item.app]), [
    ["chuyen-tuyen-01", "junctura_chuyen_tuyen", "pending", "junctura-clinic"],
    ["chuyen-tuyen-02", "junctura_chuyen_tuyen", "approved", "junctura-clinic"],
    ["chuyen-tuyen-03", "junctura_chuyen_tuyen", "rejected", "junctura-clinic"],
    ["chuyen-tuyen-04", "junctura_chuyen_tuyen", "pending", "junctura-clinic"],
    ["don-thuoc-01", "junctura_xac_minh_don_thuoc", "pending", "junctura-hospital"],
    ["don-thuoc-02", "junctura_xac_minh_don_thuoc", "approved", "junctura-hospital"],
    ["don-thuoc-03", "junctura_xac_minh_don_thuoc", "approved", "junctura-hospital"],
    ["chi-phi-01", "junctura_xac_minh_chi_phi", "pending", "junctura-insurance"],
    ["chi-phi-02", "junctura_xac_minh_chi_phi", "approved", "junctura-insurance"],
  ]);
  for (const item of items) {
    assert.equal(item.idempotencyKey, workflowIdempotencyKey("production", item.key), `${item.key}: stable key`);
    assert.match(item.idempotencyKey, /^[0-9a-f-]{36}$/);
    assert.equal(typeof item.input.ma_ho_so, "string");
    assert.ok(item.input.ma_ho_so);
  }
  assert.equal(new Set(plannedWorkflowItems(datasets, "production").map(item => item.idempotencyKey)).size, items.length);
  assert.equal(stableUuid("x", "a", "b"), stableUuid("x", "a", "b"));
  assert.notEqual(stableUuid("x", "a", "b"), stableUuid("y", "a", "b"));
});

// An in-memory stand-in for the gateway: per-application data, object storage
// with quarantine, and a workflow engine with idempotent starts. Data pages at
// 40 rows so the cursor loop is exercised too.
function fakeGateway() {
  const records = new Map(), objects = new Map(), executions = new Map();
  const calls = { recordPosts: 0, objectPuts: 0, completes: 0, cancels: 0, starts: 0 };
  let executionNo = 0;
  const fetchImpl = async (url, init = {}) => {
    const target = new URL(url), path = target.pathname;
    if (path === "/identity/realms/junctura/protocol/openid-connect/token") {
      const body = init.body;
      return new Response(JSON.stringify({ access_token: `token-for-${body.get("client_id")}` }), { status: 200 });
    }
    const match = path.match(/^\/v2\/data\/([a-z][a-z0-9_-]*)$/);
    if (match) {
      const key = match[1], rows = records.get(key) ?? [];
      if (init.method === "POST") {
        calls.recordPosts++;
        rows.push({ id: `rec-${rows.length + 1}`, collection: key, data: JSON.parse(init.body).data });
        records.set(key, rows);
        return new Response(JSON.stringify(rows.at(-1)), { status: 201 });
      }
      const limit = Number(target.searchParams.get("limit") ?? 100), start = Number(target.searchParams.get("cursor") ?? 0);
      const page = rows.slice(start, start + limit);
      return new Response(JSON.stringify({ items: page,
        nextCursor: start + limit < rows.length ? String(start + limit) : null }), { status: 200 });
    }
    if (path.startsWith("/v2/objects/")) {
      const uuid = path.slice("/v2/objects/".length);
      const bytes = Buffer.from(await init.body);
      calls.objectPuts++;
      if (bytes.includes(Buffer.from("EICAR", "ascii"))) return new Response(JSON.stringify({ error: "malware_detected" }), { status: 422 });
      const created = !objects.has(uuid);
      objects.set(uuid, bytes);
      return new Response(undefined, { status: created ? 201 : 200 });
    }
    if (path === "/v1/workflows/definitions") {
      return new Response(JSON.stringify({ items: [
        { id: "def-1", key: "junctura_chuyen_tuyen", version: "1", name: "Chuyển tuyến" },
        { id: "def-2", key: "junctura_xac_minh_don_thuoc", version: "1", name: "Xác minh đơn thuốc" },
        { id: "def-3", key: "junctura_xac_minh_chi_phi", version: "1", name: "Xác minh chi phí" },
      ] }), { status: 200 });
    }
    if (path === "/v1/workflows/executions" && init.method === "POST") {
      calls.starts++;
      const key = init.headers["Idempotency-Key"];
      assert.match(key, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
      const definitionId = JSON.parse(init.body).definitionId;
      let execution = executions.get(key);
      if (!execution) {
        execution = { id: `exec-${++executionNo}`, definitionId, status: "running" };
        executions.set(key, execution);
        return new Response(JSON.stringify(execution), { status: 201 });
      }
      return new Response(JSON.stringify(execution), { status: 200 });
    }
    let match2 = path.match(/^\/v1\/workflows\/executions\/(.+)\/complete$/);
    if (match2) {
      calls.completes++;
      const execution = [...executions.values()].find(value => value.id === match2[1]);
      execution.status = "completed";
      return new Response(JSON.stringify(execution), { status: 200 });
    }
    match2 = path.match(/^\/v1\/workflows\/executions\/(.+)$/);
    if (match2 && init.method === "DELETE") {
      calls.cancels++;
      const execution = [...executions.values()].find(value => value.id === match2[1]);
      execution.status = "cancelled";
      return new Response(undefined, { status: 200 });
    }
    throw new Error(`unexpected ${init.method ?? "GET"} ${path}`);
  };
  return { fetchImpl, records, objects, executions, calls };
}

const clientsOf = fetchImpl => Object.fromEntries(SEED_APPS.map(app =>
  [app, createClient({ base: "http://127.0.0.1:8080", token: `token-${app}`, fetchImpl })]));

test("running the seed twice creates nothing new the second time", async () => {
  const gateway = fakeGateway(), log = [];
  const clients = clientsOf(gateway.fetchImpl);
  const first = await seedDemo({ tenant: "production", datasets, clients, log: message => log.push(message) });
  assert.equal(first["junctura-clinic"].recordsCreated, 62);
  assert.equal(first["junctura-clinic"].objectsCreated, 12, "12 referral documents");
  assert.equal(first["junctura-clinic"].quarantined, 1, "the EICAR file is quarantined as expected");
  assert.equal(first["junctura-hospital"].recordsCreated, 28);
  assert.equal(first["junctura-hospital"].objectsCreated, 18, "16 prescriptions and 2 lab results");
  assert.equal(first["junctura-insurance"].recordsCreated, 12);
  assert.equal(first["junctura-insurance"].workflow.completed, 1);
  assert.equal(first["junctura-clinic"].workflow.cancelled, 1);
  assert.equal(first["junctura-clinic"].workflow.running, 2, "pending outcomes stay running");
  const starts = gateway.calls.starts, completes = gateway.calls.completes, cancels = gateway.calls.cancels;
  const storedCount = gateway.executions.size;

  const second = await seedDemo({ tenant: "production", datasets, clients, log: () => {} });
  for (const app of SEED_APPS) {
    assert.equal(second[app].recordsCreated, 0, `${app}: rerun creates no record`);
    assert.equal(second[app].workflow.created, 0, `${app}: rerun starts nothing new`);
  }
  assert.equal(second["junctura-clinic"].objectsCreated, 0, "identical bytes are replaced, not created");
  assert.equal(gateway.calls.starts, starts + 9, "starts replay through the idempotency key");
  assert.equal(gateway.executions.size, storedCount, "no new execution is created");
  assert.equal(gateway.calls.completes, completes, "completed executions are not completed again");
  assert.equal(gateway.calls.cancels, cancels, "cancelled executions are not cancelled again");
  assert.ok(log.every(message => !message.includes("token-") && !message.includes("Bearer")), "no token in the log");
  const stored = [...gateway.executions.values()];
  assert.equal(stored.filter(execution => execution.status === "completed").length, 4);
  assert.equal(stored.filter(execution => execution.status === "cancelled").length, 1);
  assert.equal(stored.filter(execution => execution.status === "running").length, 4);
});

test("a 422 malware_detected is the expected quarantine outcome, not an error", async () => {
  const gateway = fakeGateway();
  const stats = await seedDemo({ tenant: "production", datasets, clients: clientsOf(gateway.fetchImpl) });
  assert.equal(stats["junctura-clinic"].quarantined, 1);
  assert.ok(![...gateway.objects.keys()].some(uuid => uuid === objectUuid("production", "junctura-clinic", EICAR_CODE)),
    "the quarantined file is never published");
});

test("secrets never appear in logs or error messages", async () => {
  const config = { issuer: "http://127.0.0.1:8080/identity/realms/junctura",
    clientId: "health-clinic", clientSecret: secret };
  const token = await fetchClientToken({ ...config, fetchImpl: fakeGateway().fetchImpl });
  assert.equal(token, "token-for-health-clinic");
  const failing = async () => new Response(JSON.stringify({ error: "invalid_grant", hint: secret }), { status: 400 });
  await assert.rejects(fetchClientToken({ ...config, fetchImpl: failing }), error => {
    assert.match(error.message, /400/);
    assert.ok(!error.message.includes(secret), "no secret in the token error");
    return true;
  });
  const badClient = createClient({ base: "http://127.0.0.1:8080", token: "t", fetchImpl: async () =>
    new Response(JSON.stringify({ error: "invalid_query", echo: secret }), { status: 400 }) });
  await assert.rejects(badClient.listAllRecords("benh-nhan"), error => {
    assert.ok(!error.message.includes(secret), "response bodies are never echoed");
    assert.match(error.message, /invalid_query/);
    return true;
  });
  const log = [];
  const gateway = fakeGateway();
  await seedDemo({ tenant: "production", datasets, clients: clientsOf(gateway.fetchImpl), log: message => log.push(message) });
  assert.ok(log.join("\n").split("\n").every(line => !line.includes(secret) && !line.includes("token-")));
});

test("env files must exist, carry the required keys and match the requested tenant", () => {
  const directory = temp();
  assert.throws(() => readAppEnv(directory, "junctura-clinic", "production"), /demo:setup/, "missing env file");
  writeFileSync(join(directory, "junctura-clinic.env"), renderAppEnv(APPS[0],
    { baseUrl: "http://127.0.0.1:8080", tenant: "tenant-a", appId: "a", clientSecret: secret }));
  const clinic = readAppEnv(directory, "junctura-clinic", "tenant-a");
  assert.equal(clinic.clientId, "health-clinic");
  assert.equal(clinic.issuer, "http://127.0.0.1:8080/identity/realms/junctura");
  assert.throws(() => readAppEnv(directory, "junctura-clinic", "production"), /tenant-a/, "a tenant mismatch stops the command");
  assert.throws(() => readAppEnvs(directory, "tenant-a"), /junctura-hospital\.env/, "every owning app needs credentials");
  writeFileSync(join(directory, "junctura-hospital.env"), "JUNCTURA_URL=x\n");
  assert.throws(() => readAppEnvs(directory, "tenant-a"), /JUNCTURA_TENANT/, "missing keys are reported");
  writeFileSync(join(directory, "junctura-hospital.env"), renderAppEnv(APPS[1],
    { baseUrl: "http://127.0.0.1:8080", tenant: "tenant-a", appId: "a", clientSecret: secret }));
  writeFileSync(join(directory, "junctura-insurance.env"), renderAppEnv(APPS[4],
    { baseUrl: "http://127.0.0.1:8080", tenant: "tenant-a", appId: "a", clientSecret: secret }));
  const configs = readAppEnvs(directory, "tenant-a");
  assert.deepEqual(configs.map(config => config.app), SEED_APPS);
  assert.equal(new Set(configs.map(config => config.clientSecret)).size, 1, "secrets are read, not printed");
  assert.equal(readSubjects(directory), null, "subjects.json is optional");
  writeFileSync(join(directory, "subjects.json"), '{"seeded":"real"}');
  assert.deepEqual(readSubjects(directory), { seeded: "real" });
});

test("arguments: tenant default production, dry-run, help, unknown rejected", () => {
  assert.deepEqual(parseArgs([]), { tenant: "production", dryRun: false, help: false });
  assert.deepEqual(parseArgs(["--dry-run"]), { tenant: "production", dryRun: true, help: false });
  assert.deepEqual(parseArgs(["--tenant", "tenant-b"]), { tenant: "tenant-b", dryRun: false, help: false });
  assert.deepEqual(parseArgs(["--help"]), { tenant: "production", dryRun: false, help: true });
  assert.throws(() => parseArgs(["--tenant", "Bad Tenant"]), /Invalid/);
  assert.throws(() => parseArgs(["--nope"]), /Unknown/);
});

test("the dry-run plan is pure: counts only, no network and no patient data", () => {
  const lines = dryRunPlan(datasets, "production");
  const text = lines.join("\n");
  assert.match(text, /junctura-clinic/);
  assert.match(text, /benh-nhan: 50 bản ghi/);
  assert.match(text, /chuyen-tuyen: 12 bản ghi/);
  assert.match(text, /don-thuoc: 16 bản ghi/);
  assert.match(text, /chi-phi-dieu-tri: 12 bản ghi/);
  assert.match(text, /yeu-cau-thanh-toan: 12 bản ghi/);
  assert.match(text, /malware_detected/);
  assert.match(text, /Tổng: 102 bản ghi, 43 tệp, 9 hồ sơ quy trình/);
  assert.ok(!/\b\d+\s+VND\b/.test(text), "no amounts, no record content");
  assert.equal(DEFAULT_TENANT, "production");
});

test("the summary table reports counts per application without patient data", () => {
  const table = renderSummary({
    "junctura-clinic": { recordsCreated: 62, recordsExisting: 0, objectsCreated: 12, objectsExisting: 0, quarantined: 1,
      workflow: { created: 4, replayed: 0, completed: 1, cancelled: 1, running: 2 } },
    "junctura-hospital": { recordsCreated: 28, recordsExisting: 0, objectsCreated: 18, objectsExisting: 0, quarantined: 0,
      workflow: { created: 3, replayed: 0, completed: 2, cancelled: 0, running: 1 } },
    "junctura-insurance": { recordsCreated: 12, recordsExisting: 0, objectsCreated: 12, objectsExisting: 0, quarantined: 0,
      workflow: { created: 2, replayed: 0, completed: 1, cancelled: 0, running: 1 } },
  });
  assert.match(table, /junctura-clinic/);
  assert.match(table, /62\/0/);
  assert.match(table, /1/);
  assert.ok(!/Nguyễn|Trần/.test(table), "no patient data in the summary");
});
