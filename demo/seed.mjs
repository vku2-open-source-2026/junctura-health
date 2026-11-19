// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Seeds the running local Junctura stack with the synthetic Junctura Health data:
//   npm run demo:seed [-- --tenant production] [--dry-run]
// Every write goes through the real v1/v2 API of the owning application, using
// that application's own credentials from .junctura/demo/<app>.env (written by
// demo:setup). Records are deduplicated by their stable `ma` field, documents
// are PUT with a stable UUID and identical bytes, workflow starts carry a
// stable idempotency key, so reruns never duplicate anything. No secret or
// token is ever printed; no patient data is printed either, only counts.
// demo:setup has already enrolled the applications, published the capabilities
// and granted the trust relationships - this command never touches those.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadData, withSubjects } from "../seed/generate.mjs";
import { parseEnv } from "./plan.mjs";
import { DEFAULT_TENANT, SEED_APPS, dryRunPlan, plannedDocuments, plannedRecords, plannedWorkflowItems } from "./seed-plan.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".junctura", "demo");
const TENANT_PATTERN = /^[a-z][a-z0-9-]{0,62}$/;
const REQUIRED_ENV_KEYS = ["JUNCTURA_URL", "JUNCTURA_TENANT", "JUNCTURA_APP_CLIENT_ID", "JUNCTURA_APP_CLIENT_SECRET", "JUNCTURA_ISSUER"];
const USAGE = `Cách dùng: npm run demo:seed [-- --tenant production] [--dry-run]
Nạp bản ghi, tệp và hồ sơ quy trình y tế mẫu qua API thật của từng ứng dụng
(junctura-clinic, junctura-hospital, junctura-insurance), dùng credential riêng
của từng app trong .junctura/demo/<app>.env do "npm run demo:setup" tạo.
Chạy lại không tạo trùng. Không đụng app pharmacy (đã có dữ liệu riêng).
  --dry-run   chỉ in kế hoạch số lượng, không gọi mạng, không cần file env
  --tenant    tenant đích (mặc định production), phải khớp JUNCTURA_TENANT trong file env`;

export function parseArgs(argv) {
  const options = { tenant: DEFAULT_TENANT, dryRun: false, help: false };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--tenant") options.tenant = argv[++index];
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (!TENANT_PATTERN.test(options.tenant ?? "")) throw new Error("Invalid --tenant");
  return options;
}

/** Reads one application env file; the tenant inside must match the requested one. */
export function readAppEnv(directory, app, tenant) {
  const file = join(directory, `${app}.env`);
  if (!existsSync(file)) throw new Error(`Thiếu ${app}.env trong ${directory}: chạy "npm run demo:setup" trước`);
  const env = parseEnv(readFileSync(file, "utf8"));
  const missing = REQUIRED_ENV_KEYS.filter(key => !env[key]);
  if (missing.length) throw new Error(`${app}.env thiếu khóa ${missing.join(", ")}`);
  if (env.JUNCTURA_TENANT !== tenant) {
    throw new Error(`${app}.env thuộc tenant "${env.JUNCTURA_TENANT}" trong khi lệnh nạp cho tenant "${tenant}": dùng --tenant ${env.JUNCTURA_TENANT}`);
  }
  return { app, base: env.JUNCTURA_URL, clientId: env.JUNCTURA_APP_CLIENT_ID,
    clientSecret: env.JUNCTURA_APP_CLIENT_SECRET, issuer: env.JUNCTURA_ISSUER };
}

export function readAppEnvs(directory, tenant) {
  return SEED_APPS.map(app => readAppEnv(directory, app, tenant));
}

/** Optional subjects.json from demo:setup: maps seeded subjects to the ones Keycloak issued. */
export function readSubjects(directory) {
  const file = join(directory, "subjects.json");
  if (!existsSync(file)) return null;
  const mapping = JSON.parse(readFileSync(file, "utf8"));
  return mapping && typeof mapping === "object" ? mapping : null;
}

/** Fetches an application token with client_credentials. Never logs the secret. */
export async function fetchClientToken({ issuer, clientId, clientSecret, fetchImpl = fetch }) {
  const response = await fetchImpl(`${issuer}/protocol/openid-connect/token`, {
    method: "POST",
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Lấy token cho ${clientId} thất bại (${response.status})`);
  const value = await response.json();
  if (typeof value.access_token !== "string" || !value.access_token) throw new Error(`Phản hồi token cho ${clientId} thiếu access_token`);
  return value.access_token;
}

// Error details only carry the Core error code; response bodies are never
// echoed, so a failing request cannot leak credentials or record content.
async function errorDetail(response) {
  try {
    const value = await response.json();
    return typeof value?.error === "string" ? `: ${value.error}` : "";
  } catch {
    return "";
  }
}

export function createClient({ base, token, fetchImpl = fetch }) {
  const request = async (path, { method = "GET", headers = {}, body } = {}) => {
    const response = await fetchImpl(`${base}${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, ...headers }, body,
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`${method} ${path} thất bại (${response.status})${await errorDetail(response)}`);
    return response;
  };
  return {
    async listAllRecords(collection) {
      const rows = [];
      let cursor;
      do {
        const query = new URLSearchParams({ limit: "100" });
        if (cursor) query.set("cursor", cursor);
        const body = await (await request(`/v2/data/${collection}?${query}`)).json();
        rows.push(...(Array.isArray(body.items) ? body.items : []));
        cursor = body.nextCursor ?? null;
      } while (cursor);
      return rows;
    },
    async createRecord(collection, data) {
      return (await request(`/v2/data/${collection}`, { method: "POST",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }) })).json();
    },
    // 201 created, 200 replaced (identical bytes: idempotent), 422 quarantined.
    async putObject(uuid, bytes) {
      const response = await fetchImpl(`${base}/v2/objects/${uuid}`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream" },
        body: bytes, signal: AbortSignal.timeout(30000),
      });
      if (![200, 201, 422].includes(response.status)) {
        throw new Error(`PUT /v2/objects/${uuid} thất bại (${response.status})${await errorDetail(response)}`);
      }
      await response.arrayBuffer();
      return response.status;
    },
    async listWorkflowDefinitions() {
      return (await request("/v1/workflows/definitions")).json();
    },
    async startExecution(definitionId, input, idempotencyKey) {
      return request("/v1/workflows/executions", { method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ definitionId, input }) });
    },
    async completeExecution(id) {
      return (await request(`/v1/workflows/executions/${encodeURIComponent(id)}/complete`, { method: "POST",
        headers: { "Content-Type": "application/json" }, body: "{}" })).json();
    },
    async cancelExecution(id) {
      await request(`/v1/workflows/executions/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
  };
}

/**
 * Applies the plan through the given application clients. Safe to run again:
 * existing records, documents and executions are detected and kept.
 */
export async function seedDemo({ tenant, datasets, clients, log = () => {} }) {
  for (const app of SEED_APPS) if (!clients[app]) throw new Error(`Thiếu client cho ${app}`);
  const stats = Object.fromEntries(SEED_APPS.map(app => [app, {
    recordsCreated: 0, recordsExisting: 0, objectsCreated: 0, objectsExisting: 0, quarantined: 0,
    workflow: { created: 0, replayed: 0, completed: 0, cancelled: 0, running: 0 },
  }]));

  for (const entry of plannedRecords(datasets, tenant)) {
    const appStats = stats[entry.app];
    const existing = await clients[entry.app].listAllRecords(entry.collection);
    const seen = new Set(existing.map(row => row.data?.ma).filter(value => typeof value === "string"));
    let created = 0;
    for (const record of entry.records) {
      if (seen.has(record.ma)) continue;
      await clients[entry.app].createRecord(entry.collection, record.data);
      seen.add(record.ma);
      created++;
    }
    appStats.recordsCreated += created;
    appStats.recordsExisting += entry.records.length - created;
    log(`${entry.app} — ${entry.collection}: ${created} mới, ${entry.records.length - created} đã có`);
  }

  for (const document of plannedDocuments(datasets, tenant)) {
    const appStats = stats[document.app];
    const status = await clients[document.app].putObject(document.uuid, document.bytes);
    if (status === 201) appStats.objectsCreated++;
    else if (status === 200) appStats.objectsExisting++;
    else {
      appStats.quarantined++;
      log(`${document.app} — tệp thử đã bị cách ly (422 malware_detected, kết quả mong đợi)`);
    }
  }
  for (const app of SEED_APPS) {
    const { objectsCreated, objectsExisting, quarantined } = stats[app];
    log(`${app} — tệp: ${objectsCreated} mới, ${objectsExisting} đã có${quarantined ? `, ${quarantined} bị cách ly` : ""}`);
  }

  const items = plannedWorkflowItems(datasets, tenant);
  let definitions;
  try {
    definitions = new Map(((await clients["junctura-clinic"].listWorkflowDefinitions()).items ?? [])
      .map(definition => [definition.key, definition]));
  } catch (error) {
    log(`Bỏ qua phần quy trình: chưa đọc được định nghĩa quy trình (${error.message})`);
    return stats;
  }
  const missing = [...new Set(items.filter(item => !definitions.has(item.definitionKey)).map(item => item.definitionKey))];
  if (missing.length) {
    log(`Bỏ qua phần quy trình: thiếu định nghĩa ${missing.join(", ")}`);
    return stats;
  }
  for (const item of items) {
    const appStats = stats[item.app];
    const response = await clients[item.app].startExecution(definitions.get(item.definitionKey).id, item.input, item.idempotencyKey);
    if (![200, 201].includes(response.status)) throw new Error(`Không tạo được hồ sơ ${item.key} (${response.status})`);
    if (response.status === 201) appStats.workflow.created++;
    else appStats.workflow.replayed++;
    let value = await response.json();
    // Outcome pending keeps the execution running; approved completes it and
    // rejected cancels it. A replayed start in the right state is left alone.
    if (item.outcome === "approved" && value.status === "running") {
      let guard = 0;
      while (value.status === "running" && guard++ < 6) value = await clients[item.app].completeExecution(value.id);
      if (value.status === "running") throw new Error(`Hồ sơ ${item.key} chưa hoàn tất sau khi duyệt đủ các bước`);
    }
    if (item.outcome === "rejected" && value.status === "running") {
      await clients[item.app].cancelExecution(value.id);
      value.status = "cancelled";
    }
    if (value.status === "completed") appStats.workflow.completed++;
    else if (value.status === "cancelled") appStats.workflow.cancelled++;
    else appStats.workflow.running++;
  }
  return stats;
}

const columns = ["Ứng dụng", "Bản ghi (mới/đã có)", "Tệp (mới/đã có)", "Cách ly", "Quy trình (mới/lặp lại)", "Chờ/Duyệt/Từ chối"];

export function renderSummary(stats) {
  const rows = Object.entries(stats).map(([app, value]) => [app, `${value.recordsCreated}/${value.recordsExisting}`,
    `${value.objectsCreated}/${value.objectsExisting}`, String(value.quarantined),
    `${value.workflow.created}/${value.workflow.replayed}`,
    `${value.workflow.running}/${value.workflow.completed}/${value.workflow.cancelled}`]);
  const widths = columns.map((column, index) => Math.max(column.length, ...rows.map(row => row[index].length)));
  const line = row => row.map((cell, index) => cell.padEnd(widths[index])).join("  ").trimEnd();
  return [line(columns), ...rows.map(line)].join("\n");
}

function printDryRun(datasets, tenant) {
  for (const line of dryRunPlan(datasets, tenant)) console.log(line);
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) { console.log(USAGE); return; }
  const datasets = { clinic: loadData("clinic.json"), hospital: loadData("hospital.json"), insurance: loadData("insurance.json") };
  if (options.dryRun) { printDryRun(datasets, options.tenant); return; }

  const configs = readAppEnvs(OUT, options.tenant);
  const mapping = readSubjects(OUT);
  if (mapping) {
    console.log("• Dùng ánh xạ subject thật từ subjects.json");
    for (const [name, dataset] of Object.entries(datasets)) datasets[name] = withSubjects(dataset, mapping);
  }
  const clients = {};
  for (const config of configs) {
    clients[config.app] = createClient({ base: config.base, token: await fetchClientToken(config) });
  }
  const stats = await seedDemo({ tenant: options.tenant, datasets, clients, log: message => console.log(`• ${message}`) });
  console.log(`\n${renderSummary(stats)}`);
  console.log(`\n✔ Dữ liệu demo Junctura Health sẵn sàng cho tenant ${options.tenant}.`);
  console.log("  Xem trong Console bằng tài khoản quản trị Sở Y tế hoặc qua API v2 của từng ứng dụng.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(`✖ ${error.message}`); process.exitCode = 1; });
}
