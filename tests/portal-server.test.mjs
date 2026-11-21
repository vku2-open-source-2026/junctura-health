// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Tests of the portal backend (portal/server). Every route runs against a real
// HTTP server on the loopback interface with fake dependencies (verifyToken,
// junctura, fetchExecution, staffFor, now), so nothing here touches the network
// beyond 127.0.0.1. The JWT verifier is exercised with a freshly generated
// RSA key, as the real one would.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { generateKeyPairSync, sign } from "node:crypto";
import { test } from "node:test";
import { createApp } from "../portal/server/app.mjs";
import { AuthError, createVerifier } from "../portal/server/jwt.mjs";
import { createStaffFor } from "../portal/server/staff.mjs";
import { APPS, PORTAL, PORTAL_APP, parseEnv, portalAppOrigin, renderAppEnv } from "../demo/plan.mjs";

const NOW = () => new Date("2026-11-19T01:02:03.000Z");
const STAMP = "2026-11-19T01:02:03.000Z";
const EXEC = "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0";
const OTHER = "ffffffff-1111-4222-8333-444444444444";
const ADMIN = { username: "quantri.soyte", displayName: "Quản trị Sở Y tế", facility: "so-y-te" };
const CLINIC = { username: "ysi.tramyte", displayName: "Y sĩ Lê Thi Hoa", facility: "tram-y-te" };
const AUTH = { authorization: "Bearer good" };

let serial = 0;
const uuid = () => `aaaaaaaa-0000-4000-8000-${String(++serial).padStart(12, "0")}`;

/** A fake of the SDK client: /v2/data listing with limit/order/cursor plus records and objects. */
function fakeJunctura({ lists = {} } = {}) {
  const records = new Map(), objects = new Map(), calls = [];
  const fail = (status, code) => {
    const error = new Error(`Junctura request failed (${status}, ${code})`);
    error.name = "JuncturaError";
    error.status = status;
    error.code = code;
    throw error;
  };
  return {
    calls, records, objects,
    async request(path) {
      calls.push(path);
      const [base, query = ""] = path.split("?");
      const match = /^\/v2\/data\/([a-z-]+)$/.exec(base);
      if (!match) fail(500, "unexpected_path");
      const params = new URLSearchParams(query);
      const limit = Number(params.get("limit") ?? 100);
      const order = params.get("order") ?? "asc";
      const offset = params.has("cursor") ? Number(Buffer.from(params.get("cursor"), "base64url").toString("utf8")) : 0;
      const all = lists[match[1]] ?? [];
      const ordered = order === "desc" ? [...all].reverse() : all;
      const page = ordered.slice(offset, offset + limit);
      const next = offset + page.length;
      return Response.json({ items: page, nextCursor: next < ordered.length ? Buffer.from(String(next)).toString("base64url") : null });
    },
    async createRecord(collection, data) {
      calls.push(`createRecord ${collection}`);
      const id = uuid();
      records.set(`${collection}/${id}`, { id, data });
      return { id, data };
    },
    async getRecord(collection, id) {
      calls.push(`getRecord ${collection}/${id}`);
      const record = records.get(`${collection}/${id}`);
      if (!record) fail(404, "not_found");
      return record;
    },
    async putObject(id, bytes) {
      calls.push(`putObject ${id}`);
      objects.set(id, bytes);
      return { id, size: bytes.length };
    },
    async getObject(id) {
      calls.push(`getObject ${id}`);
      return objects.get(id);
    },
  };
}

function deps({ staff = ADMIN, badToken = false, execution = 200, noStaff = false, ...rest } = {}) {
  const junctura = fakeJunctura(rest);
  return {
    junctura,
    calls: junctura.calls,
    records: junctura.records,
    objects: junctura.objects,
    verifyToken: async token => {
      if (badToken || token !== "good") throw new AuthError("nope");
      return { preferred_username: staff.username, azp: "health-portal-web" };
    },
    fetchExecution: async () => ({ ok: execution === 200, status: execution === 200 ? 200 : execution }),
    staffFor: username => (!noStaff && username === staff.username ? staff : null),
    now: NOW,
  };
}

async function withServer(provided, run) {
  const server = createServer(createApp(provided));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    return await run(base, provided);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

const post = (base, path, body, headers = AUTH) => fetch(new URL(path, base), { method: "POST", headers, body });
const get = (base, path, headers = AUTH) => fetch(new URL(path, base), { headers });

test("the portal backend is a separate application that reuses the web client and adds nothing else", () => {
  assert.deepEqual(PORTAL_APP, { ...PORTAL, clientId: "health-portal-backend" });
  assert.equal(PORTAL_APP.webClientId, "health-portal-web", "no new web client");
  assert.ok(!APPS.some(app => app.name === PORTAL_APP.name || app.clientId === PORTAL_APP.clientId), "not one of the five applications");
  assert.equal(APPS.length, 5);
  // Junctura enrolls only HTTPS origins with a dotted host; the portal provides nothing.
  assert.equal(portalAppOrigin(), "https://health-portal.provider.internal:8443");
  const env = parseEnv(renderAppEnv(PORTAL_APP, { baseUrl: "http://127.0.0.1:8080", tenant: "tenant-a", appId: "11111111-1111-4111-8111-111111111111", clientSecret: "s" }));
  assert.equal(env.JUNCTURA_APP_CLIENT_ID, "health-portal-backend");
  assert.equal(env.JUNCTURA_WEB_CLIENT_ID, "health-portal-web");
  assert.equal(env.JUNCTURA_ISSUER, "http://127.0.0.1:8080/identity/realms/junctura");
  assert.equal(env.WEB_PORT, "5180");
  assert.ok(!("PROVIDER_HOST" in env) && !("PROVIDER_PORT" in env), "the portal offers no provider port");
  const clinic = parseEnv(renderAppEnv(APPS[0], { baseUrl: "http://127.0.0.1:8080", tenant: "t", appId: "a", clientSecret: "s" }));
  assert.equal(clinic.PROVIDER_HOST, "clinic.provider.internal", "the five applications keep their provider lines");
});

test("staff are mapped by username with the same role-to-facility table as the frontend", () => {
  const staffFor = createStaffFor();
  assert.deepEqual(staffFor("quantri.soyte"), { username: "quantri.soyte", displayName: "Quản trị Sở Y tế", facility: "so-y-te" });
  assert.equal(staffFor("ysi.tramyte").facility, "tram-y-te");
  assert.equal(staffFor("benhnhan.an"), null, "patients are never staff");
  assert.equal(staffFor("khong.ton-tai"), null);
});

test("GET /api/me answers the staff identity of the token", async () => {
  await withServer(deps(), async base => {
    const response = await get(base, "/api/me");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { username: ADMIN.username, displayName: ADMIN.displayName, facility: "so-y-te" });
  });
});

test("requests without a token, with a bad token, or from a patient are refused", async () => {
  await withServer(deps(), async base => {
    assert.equal((await get(base, "/api/me", {})).status, 401);
    assert.equal((await get(base, "/api/me", { authorization: "Bearer nope" })).status, 401);
    assert.equal((await get(base, "/api/me", { authorization: "good" })).status, 401, "the scheme must be Bearer");
  });
  await withServer(deps({ staff: { ...ADMIN, username: "benhnhan.an" }, noStaff: true }), async base => {
    const response = await get(base, "/api/me");
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, "forbidden");
  });
});

test("GET /api/bang-tin lists at most 20 entries, newest first", async () => {
  const entries = Array.from({ length: 25 }, (_, index) => ({
    id: uuid(), collection: "bang-tin", created_at: `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00Z`,
    data: { title: `Tin ${index}`, body: `Nội dung ${index}`, author: { displayName: "Người", facility: "so-y-te" }, createdAt: `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00Z` },
  }));
  await withServer(deps({ lists: { "bang-tin": entries } }), async (base, provided) => {
    const response = await get(base, "/api/bang-tin");
    assert.equal(response.status, 200);
    const { items } = await response.json();
    assert.equal(items.length, 20);
    assert.equal(items[0].title, "Tin 24", "newest first");
    assert.deepEqual(items[0].author, { displayName: "Người", facility: "so-y-te" });
    assert.deepEqual(provided.calls, ["/v2/data/bang-tin?limit=20&order=desc"], "a single page, descending");
  });
});

test("POST /api/bang-tin stores an entry authored from the token, and only Sở Y tế may write", async () => {
  await withServer(deps(), async (base, provided) => {
    const response = await post(base, "/api/bang-tin", JSON.stringify({ title: "Bảo trì hệ thống", body: "Từ 20h hôm nay.", author: { displayName: "Giả mạo", facility: "tram-y-te" } }), { ...AUTH, "content-type": "application/json" });
    assert.equal(response.status, 201);
    const notice = await response.json();
    assert.deepEqual(notice, { id: notice.id, title: "Bảo trì hệ thống", body: "Từ 20h hôm nay.", author: { displayName: ADMIN.displayName, facility: "so-y-te" }, createdAt: STAMP }, "the author comes from the token, never from the body");
    assert.equal([...provided.records.values()][0].data.author.displayName, ADMIN.displayName);
  });
  await withServer(deps({ staff: CLINIC }), async (base, provided) => {
    const response = await post(base, "/api/bang-tin", JSON.stringify({ title: "x", body: "y" }), { ...AUTH, "content-type": "application/json" });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, "forbidden");
    assert.equal(provided.records.size, 0);
  });
});

test("POST /api/bang-tin rejects bad input with 400 and wrong content types with 415", async () => {
  await withServer(deps(), async base => {
    const cases = [
      ['{"title":"","body":"x"}', "application/json", 400],
      [`{"title":"${"a".repeat(121)}","body":"x"}`, "application/json", 400],
      ['{"title":"ok","body":""}', "application/json", 400],
      [`{"title":"ok","body":"${"b".repeat(2001)}"}`, "application/json", 400],
      ['{"title":1,"body":"x"}', "application/json", 400],
      ["[1,2]", "application/json", 400],
      ["không phải json", "application/json", 400],
      ['{"title":"ok","body":"x"}', "text/plain", 415],
      ['{"title":"ok","body":"x"}', "", 415],
    ];
    for (const [body, contentType, expected] of cases) {
      const headers = { ...AUTH, ...(contentType ? { "content-type": contentType } : {}) };
      const response = await post(base, "/api/bang-tin", body, headers);
      assert.equal(response.status, expected, `${contentType || "(không có)"}: ${body.slice(0, 40)}`);
    }
  });
});

test("notes are scoped to one execution, oldest first, at most 100, through at most five pages", async () => {
  const notes = Array.from({ length: 700 }, (_, index) => ({
    id: uuid(), collection: "ghi-chu", created_at: `2026-02-01T00:00:00Z`,
    data: index < 30
      ? { executionId: EXEC, text: `Ghi chú ${index}`, author: { displayName: "Y sĩ", facility: "tram-y-te" }, createdAt: `2026-02-01T00:00:00Z` }
      : { executionId: OTHER, text: "khác", author: { displayName: "Y sĩ", facility: "tram-y-te" }, createdAt: "2026-02-02T00:00:00Z" },
  }));
  await withServer(deps({ lists: { "ghi-chu": notes } }), async (base, provided) => {
    const response = await get(base, `/api/ho-so/${EXEC}/ghi-chu`);
    assert.equal(response.status, 200);
    const { items } = await response.json();
    assert.equal(items.length, 30, "all pages are walked until the cap");
    assert.ok(items.every(item => item.executionId === EXEC), "only notes of this record");
    assert.deepEqual(items.map(item => item.text), Array.from({ length: 30 }, (_, index) => `Ghi chú ${index}`), "oldest first");
    const listCalls = provided.calls.filter(call => call.startsWith("/v2/data/ghi-chu"));
    assert.equal(listCalls.length, 5, "at most five pages");
    assert.match(listCalls[0], /limit=100&order=asc$/);
    assert.match(listCalls[1], /cursor=/, "the next page continues from the cursor");
  });
});

test("POST /api/ho-so/{id}/ghi-chu stores a note authored from the token and validates input", async () => {
  await withServer(deps(), async (base, provided) => {
    const response = await post(base, `/api/ho-so/${EXEC}/ghi-chu`, JSON.stringify({ text: "Đã xác minh đơn thuốc." }), { ...AUTH, "content-type": "application/json" });
    assert.equal(response.status, 201);
    const note = await response.json();
    assert.deepEqual(note, { id: note.id, executionId: EXEC, text: "Đã xác minh đơn thuốc.", author: { displayName: ADMIN.displayName, facility: "so-y-te" }, createdAt: STAMP });
    assert.equal([...provided.records.values()][0].data.text, "Đã xác minh đơn thuốc.");
    for (const bad of ['{"text":""}', '{"text":1}', `{"text":"${"x".repeat(1001)}"}`, "{}"]) {
      assert.equal((await post(base, `/api/ho-so/${EXEC}/ghi-chu`, bad, { ...AUTH, "content-type": "application/json" })).status, 400, bad);
    }
    assert.equal((await post(base, `/api/ho-so/${EXEC.toUpperCase()}/ghi-chu`, '{"text":"x"}', { ...AUTH, "content-type": "application/json" })).status, 400, "only lowercase UUIDs");
    assert.equal((await post(base, `/api/ho-so/${EXEC}/ghi-chu`, '{"text":"x"}', { ...AUTH, "content-type": "text/plain" })).status, 415);
  });
  await withServer(deps({ staff: CLINIC }), async base => {
    assert.equal((await post(base, `/api/ho-so/${EXEC}/ghi-chu`, '{"text":"x"}', { ...AUTH, "content-type": "application/json" })).status, 201, "any staff facility may note");
  });
});

test("unknown or unreachable records are 404 and 503, before any write", async () => {
  for (const execution of [404, 0, 500]) {
    await withServer(deps({ execution }), async (base, provided) => {
      const response = await post(base, `/api/ho-so/${EXEC}/ghi-chu`, '{"text":"x"}', { ...AUTH, "content-type": "application/json" });
      assert.equal(response.status, execution === 404 ? 404 : 503);
      assert.equal((await get(base, `/api/ho-so/${EXEC}/tep`)).status, execution === 404 ? 404 : 503);
      assert.equal(provided.records.size, 0, "nothing is written");
    });
  }
});

test("attachments: a valid upload stores the bytes and a metadata record with the original name", async () => {
  await withServer(deps(), async (base, provided) => {
    const bytes = new Uint8Array(2048).fill(0x25);
    const response = await post(base, `/api/ho-so/${EXEC}/tep`, bytes, { ...AUTH, "content-type": "application/pdf", "x-file-name": encodeURIComponent("Kết quả khám.pdf") });
    assert.equal(response.status, 201);
    const meta = await response.json();
    assert.equal(meta.executionId, EXEC);
    assert.equal(meta.name, "Kết quả khám.pdf");
    assert.equal(meta.type, "application/pdf");
    assert.equal(meta.bytes, 2048);
    assert.deepEqual(meta.author, { displayName: ADMIN.displayName, facility: "so-y-te" });
    assert.equal(meta.createdAt, STAMP);
    const [objectId] = [...provided.objects.keys()];
    assert.match(objectId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.deepEqual(provided.objects.get(objectId), Buffer.from(bytes));
    const record = [...provided.records.values()][0];
    assert.equal(record.data.objectId, objectId, "the metadata record points at the stored bytes");
    assert.equal(record.data.name, "Kết quả khám.pdf", "the original name lives only in the metadata");
    const download = await get(base, `/api/tep/${meta.id}`);
    assert.equal(download.status, 200);
    assert.equal(download.headers.get("content-type"), "application/pdf");
    assert.equal(download.headers.get("content-disposition"), `attachment; filename*=UTF-8''${encodeURIComponent("Kết quả khám.pdf")}`);
    assert.equal(download.headers.get("x-content-type-options"), "nosniff");
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), Buffer.from(bytes));
  });
});

test("attachments refuse wrong media types, oversized bodies and bad names", async () => {
  await withServer(deps(), async base => {
    const send = (headers, body = new Uint8Array(16)) => post(base, `/api/ho-so/${EXEC}/tep`, body, headers);
    assert.equal((await send({ ...AUTH, "content-type": "text/plain", "x-file-name": "a.txt" })).status, 415);
    assert.equal((await send({ ...AUTH, "content-type": "image/svg+xml", "x-file-name": "a.svg" })).status, 415);
    assert.equal((await send({ ...AUTH, "content-type": "application/pdf" })).status, 400, "no X-File-Name");
    assert.equal((await send({ ...AUTH, "content-type": "application/pdf", "x-file-name": "a%zz.pdf" })).status, 400, "undecodable name");
    assert.equal((await send({ ...AUTH, "content-type": "application/pdf", "x-file-name": encodeURIComponent("x".repeat(121)) })).status, 400, "name over 120 characters");
    assert.equal((await send({ ...AUTH, "content-type": "application/pdf", "x-file-name": "a.pdf" }, new Uint8Array(0))).status, 400, "empty upload");
    assert.equal((await send({ ...AUTH, "content-type": "image/png", "x-file-name": "big.png" }, new Uint8Array(5 * 1024 * 1024 + 1))).status, 413, "over 5 MiB");
    assert.equal((await send({ ...AUTH, "content-type": "image/jpeg", "x-file-name": "ok.jpg" }, new Uint8Array(5 * 1024 * 1024))).status, 201, "5 MiB exactly is allowed");
  });
});

test("unknown attachments are 404 and malformed ids are 400", async () => {
  await withServer(deps(), async base => {
    const response = await get(base, `/api/tep/${uuid()}`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error, "not_found");
    assert.equal((await get(base, "/api/tep/khong-phai-uuid")).status, 400);
  });
});

test("unknown routes are 404 with the error envelope", async () => {
  await withServer(deps(), async base => {
    for (const path of ["/", "/api", "/api/khong-ton-tai", "/api/ho-so", "/v1/identity"]) {
      assert.equal((await get(base, path)).status, 404, path);
    }
    assert.equal((await fetch(new URL("/api/me", base), { method: "DELETE", headers: AUTH })).status, 404);
  });
});

test("an upstream outage answers 503 junctura_unavailable", async () => {
  await withServer(deps(), async (base, provided) => {
    provided.junctura.request = async () => {
      throw new Error("boom");
    };
    const response = await get(base, "/api/bang-tin");
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, "junctura_unavailable");
  });
});

test("the JWT verifier checks RS256 signatures, iss, exp and azp = health-portal-web", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: "jwk" }), kid: "k1", use: "sig", alg: "RS256" };
  const now = () => Date.parse("2026-11-19T01:00:00.000Z");
  const verifier = createVerifier({
    issuer: "https://junctura.studio/identity/realms/junctura", clientId: "health-portal-web",
    getJson: async url => {
      assert.ok(url.endsWith("/protocol/openid-connect/certs"));
      return { keys: [jwk] };
    },
    now,
  });
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = (claims, kid = "k1") => {
    const data = `${encode({ alg: "RS256", typ: "JWT", kid })}.${encode(claims)}`;
    return `${data}.${Buffer.from(sign("RSA-SHA256", Buffer.from(data), privateKey)).toString("base64url")}`;
  };
  const iss = "https://junctura.studio/identity/realms/junctura";
  const claims = { iss, exp: now() / 1000 + 300, preferred_username: "quantri.soyte" };
  assert.deepEqual(await verifier(token({ ...claims, azp: "health-portal-web" })), { ...claims, azp: "health-portal-web" });
  await assert.rejects(verifier(token({ ...claims, azp: "other-client" })), /not issued for this application/, "azp must be the portal web client");
  await assert.rejects(verifier(token({ ...claims, iss: "https://other/issuer" })), /wrong issuer/);
  await assert.rejects(verifier(token({ ...claims, exp: now() / 1000 - 60 })), /expired/);
  await assert.rejects(verifier(`${token({ ...claims }).split(".").slice(0, 2).join(".")}.c2lnbg`), /bad signature/);
  await assert.rejects(verifier(token({ ...claims }, "unknown-kid")), /unknown signing key/);
  await assert.rejects(verifier("not-a-token"), /malformed token/);
});
