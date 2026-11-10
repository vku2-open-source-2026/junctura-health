// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { APPS as CONTRACT_APPS, CONTRACTS, getContract } from "../contracts/index.mjs";
import { APPS, existingGrant, internalOrigins, parseArgs, parseEnv, planGrants, providers, renderAppEnv, splitName, userRepresentation, webClient } from "../demo/plan.mjs";
import { demoPassword, ensureAccounts, ensureApplication, ensureCapability, ensureGrant, resolveDxos } from "../demo/setup.mjs";
import { loadData, withSubjects } from "../seed/generate.mjs";

const reply = (status, body, headers = {}) => new Response(body === undefined ? null : JSON.stringify(body), { status, headers });
const temp = () => mkdtempSync(join(tmpdir(), "junctura-health-"));

test("the plan covers every application and contract", () => {
  assert.deepEqual(APPS.map(app => app.name), [...CONTRACT_APPS]);
  assert.equal(new Set(APPS.flatMap(app => [app.clientId, app.webClientId])).size, 10);
  assert.equal(new Set(APPS.map(app => app.webPort)).size, 5);
  assert.deepEqual(providers().map(app => app.key), ["clinic", "hospital"]);
  assert.deepEqual(internalOrigins(), ["https://clinic.provider.internal:8443", "https://hospital.provider.internal:8443"]);
  const grants = planGrants();
  assert.equal(grants.length, CONTRACTS.reduce((sum, c) => sum + c.consumers.length, 0));
  assert.equal(grants.length, 7);
  assert.ok(grants.some(g => g.slug === "allergy-list" && g.consumer === "junctura-pharmacy"));
  assert.ok(!grants.some(g => g.consumer === "junctura-insurance" && g.slug !== "claim-verify"), "insurance only verifies claims");
  for (const app of APPS) assert.equal(new URL(app.origin).origin, app.origin);
});

test("Keycloak representations carry the seeded subject and no stray data", () => {
  const account = loadData("accounts.json").users.find(user => user.username === "bacsi.benhvien");
  const user = userRepresentation(account, "tenant-a", "s3cret-demo");
  assert.equal(user.id, account.subject);
  assert.deepEqual([user.lastName, user.firstName], ["BS. Phạm Minh", "Quang"]);
  assert.deepEqual(user.attributes, { tenant_id: ["tenant-a"] });
  assert.deepEqual(user.credentials, [{ type: "password", value: "s3cret-demo", temporary: false }]);
  assert.deepEqual(splitName("An"), { firstName: "An", lastName: "An" });
  const client = webClient(APPS[2], [{ name: "tenant" }]);
  assert.equal(client.publicClient, true);
  assert.equal(client.directAccessGrantsEnabled, false);
  assert.equal(client.attributes["pkce.code.challenge.method"], "S256");
  assert.deepEqual(client.redirectUris, ["http://localhost:5183/*", "http://127.0.0.1:5183/*"]);
});

test("application env files round-trip and reject injected lines", () => {
  const text = renderAppEnv(APPS[0], { baseUrl: "http://127.0.0.1:8080", tenant: "tenant-a", appId: "11111111-1111-4111-8111-111111111111", clientSecret: "abc=def" });
  const env = parseEnv(text);
  assert.equal(env.JUNCTURA_APP_CLIENT_ID, "health-clinic");
  assert.equal(env.JUNCTURA_APP_CLIENT_SECRET, "abc=def");
  assert.equal(env.JUNCTURA_ISSUER, "http://127.0.0.1:8080/identity/realms/junctura");
  assert.equal(env.PROVIDER_HOST, "clinic.provider.internal");
  assert.throws(() => renderAppEnv(APPS[0], { baseUrl: "x", tenant: "t", appId: "a", clientSecret: "s\nEVIL=1" }), TypeError);
  assert.deepEqual(parseEnv("# c\nA=1\n B = \"two words\" \nbad line\n#X=9\r\nC='3'"), { A: "1", B: "two words", C: "3" });
  assert.deepEqual(parseArgs(["--tenant", "tenant-b"]), { tenant: "tenant-b", help: false });
  assert.throws(() => parseArgs(["--tenant", "Bad Tenant"]), /Invalid/);
  assert.throws(() => parseArgs(["--nope"]), /Unknown/);
});

test("the demo password comes from the environment or is generated once", () => {
  const file = join(temp(), "accounts.env");
  assert.equal(demoPassword({ DEMO_PASSWORD: "from-env" }, file), "from-env");
  const first = demoPassword({}, file);
  assert.ok(first.length >= 16);
  assert.equal(demoPassword({}, file), first, "reused on the next run");
  assert.equal(parseEnv(readFileSync(file, "utf8")).DEMO_PASSWORD, first);
});

test("the Junctura DX-OS checkout is required and never guessed", () => {
  const root = temp();
  assert.throws(() => resolveDxos({}, join(root, "health")), /not found/);
  mkdirSync(join(root, "junctura-dxos", "scripts", "lib"), { recursive: true });
  writeFileSync(join(root, "junctura-dxos", "scripts", "lib", "demo-stack.mjs"), "");
  assert.throws(() => resolveDxos({}, join(root, "health")), /no \.env/);
  writeFileSync(join(root, "junctura-dxos", ".env"), "");
  assert.equal(resolveDxos({}, join(root, "health")).directory, join(root, "junctura-dxos"));
  assert.equal(resolveDxos({ JUNCTURA_DXOS_DIR: join(root, "junctura-dxos") }, "/elsewhere").directory, join(root, "junctura-dxos"));
});

function fakeIdentity({ honorIds = true, existing = {} } = {}) {
  const users = new Map(Object.entries(existing)), calls = [];
  const admin = async (path, body, method = body === undefined ? "GET" : "POST") => {
    calls.push(`${method} ${path.split("?")[0]}`);
    if (path.startsWith("users?username=")) {
      const name = decodeURIComponent(path.match(/username=([^&]+)/)[1]);
      return reply(200, users.has(name) ? [{ id: users.get(name) }] : []);
    }
    if (path === "partialImport") {
      if (!honorIds) return reply(400, { error: "unsupported" });
      for (const user of body.users) users.set(user.username, user.id);
      return reply(200, { added: body.users.length });
    }
    if (path === "users") {
      assert.ok(!("id" in body), "plain creation never sends an id");
      users.set(body.username, `kc-${body.username}`);
      return reply(201, undefined, { location: `http://kc/users/kc-${body.username}` });
    }
    return reply(204);
  };
  const must = async (response, expected, what) => { assert.ok(expected.includes(response.status), what); return response; };
  return { users, calls, stack: { admin, must, tenant: "tenant-a", group: { id: "g1" }, roles: [{ name: "core-reader" }], idFrom: r => r.headers.get("location").split("/").at(-1) } };
}

test("accounts keep their seeded subject, fall back cleanly and are reused", async () => {
  const accounts = loadData("accounts.json").users.slice(0, 3);
  const kept = fakeIdentity();
  let result = await ensureAccounts(kept.stack, accounts, "pw");
  assert.equal(result.created, 3);
  for (const account of accounts) assert.equal(result.subjects[account.subject], account.subject);
  assert.equal(kept.calls.filter(call => call === "PUT users/" + accounts[0].subject + "/groups/g1").length, 1);

  result = await ensureAccounts(kept.stack, accounts, "pw2");
  assert.equal(result.created, 0, "second run creates nothing");
  assert.ok(kept.calls.includes(`PUT users/${accounts[0].subject}/reset-password`), "existing accounts get the current demo password");

  const fallback = fakeIdentity({ honorIds: false });
  result = await ensureAccounts(fallback.stack, accounts, "pw");
  assert.equal(result.subjects[accounts[0].subject], `kc-${accounts[0].username}`);
  const clinic = withSubjects(loadData("clinic.json"), { [loadData("clinic.json").patients[0].subject]: "real-subject" });
  assert.equal(clinic.patients[0].subject, "real-subject");
  assert.equal(clinic.referrals.find(r => r.referralId === "CT-2026-000123").subject, "real-subject");
  assert.equal(clinic.patients[1].subject, loadData("clinic.json").patients[1].subject, "unmapped subjects stay");
});

test("an enrolled application is reused and its env file rewritten", async () => {
  const out = temp(), created = [];
  const stack = {
    base: "http://127.0.0.1:8080", tenant: "tenant-a", issuer: "http://127.0.0.1:8080/identity/realms/junctura",
    sql: async () => "22222222-2222-4222-8222-222222222222|active|svc-subject",
    admin: async (path, body) => {
      if (path === "clients?clientId=health-clinic") return reply(200, [{ id: "c1" }]);
      if (path === "clients/c1/client-secret") return reply(200, { value: "sek" });
      if (path === "clients?clientId=health-clinic-web") return reply(200, []);
      if (path === "clients") { created.push(body.clientId); return reply(201); }
      throw new Error(`unexpected ${path}`);
    },
    must: async (response, expected, what) => { assert.ok(expected.includes(response.status), what); return response; },
    mappersFor: async () => [],
  };
  const lib = { q: value => `'${value}'`, enrollApplication: async () => { throw new Error("must not enroll again"); } };
  assert.deepEqual(await ensureApplication(stack, lib, APPS[0], {}, {}, out), { appId: "22222222-2222-4222-8222-222222222222", subject: "svc-subject" });
  assert.deepEqual(created, ["health-clinic-web"]);
  assert.equal(parseEnv(readFileSync(join(out, "junctura-clinic.env"), "utf8")).JUNCTURA_APP_CLIENT_SECRET, "sek");
  stack.sql = async () => "22222222-2222-4222-8222-222222222222|suspended|svc-subject";
  await assert.rejects(ensureApplication(stack, lib, APPS[0], {}, {}, out), /suspended/);
});

test("capabilities are published once through validate, approve and publish", async () => {
  const provider = "11111111-1111-4111-8111-111111111111", contract = getContract("allergy-list"), seen = [];
  let state = "missing";
  const api = async (path, token, body, headers = {}) => {
    const action = path.split("/versions")[1] ?? path;
    seen.push(`${token}:${body === undefined ? "GET" : "POST"} ${action}`);
    if (path === "/v1/approvals") { assert.equal(body.resourceId, `urn:junctura:capability:${provider}:allergy-list@1.0.0`); return reply(201, { approvalId: "ap1" }); }
    if (action === "/1.0.0" && body === undefined) return state === "missing" ? reply(404, {}) : reply(200, { state, capabilityId: "cap", digest: "d", revision: 1 }, { etag: '"1"' });
    if (action === "") { assert.equal(body.providerAppId, provider); state = "draft"; return reply(201, { state, digest: "d", revision: 1 }, { etag: '"1"' }); }
    if (action === "/1.0.0/validate") { assert.equal(headers["If-Match"], '"1"'); return reply(200, { digest: "d2", revision: 2 }, { etag: '"2"' }); }
    if (action === "/1.0.0/publish") { assert.equal(headers["If-Match"], '"2"'); assert.equal(body.approvalId, "ap1"); state = "published"; return reply(200, { state }); }
    throw new Error(`unexpected ${path}`);
  };
  const must = async (response, expected, what) => { assert.ok(expected.includes(response.status), what); return response; };
  const owner = { id: "owner-id", token: "owner" }, approver = { token: "approver" };
  assert.equal((await ensureCapability({ api, must }, contract, provider, owner, approver)).state, "published");
  assert.deepEqual(seen, ["owner:GET /1.0.0", "owner:POST ", "owner:POST /1.0.0/validate", "approver:POST /v1/approvals", "owner:POST /1.0.0/publish"]);
  seen.length = 0;
  await ensureCapability({ api, must }, contract, provider, owner, approver);
  assert.deepEqual(seen, ["owner:GET /1.0.0"], "second run only reads");
  state = "deprecated";
  await assert.rejects(ensureCapability({ api, must }, contract, provider, owner, approver), /deprecated/);
});

test("grants are proposed by the owner, activated by the approver, and not duplicated", async () => {
  const enrolled = { "junctura-clinic": { appId: "p", subject: "ps" }, "junctura-pharmacy": { appId: "c", subject: "cs" } };
  const published = { "allergy-list": { capabilityId: "cap", version: "1.0.0", digest: "d", manifest: { requiredPermissions: ["perm"] } } };
  const grant = planGrants().find(g => g.slug === "allergy-list" && g.consumer === "junctura-pharmacy"), seen = [];
  const api = async (path, token, body, headers = {}) => {
    seen.push(`${token} ${path}`);
    if (path === "/v1/trust/grants") {
      assert.deepEqual(body.subjectIds, ["cs"]); assert.deepEqual(body.operations, ["discover", "invoke"]); assert.equal(body.delegationAllowed, false);
      const days = (Date.parse(body.expiresAt) - Date.now()) / 86_400_000;
      assert.ok(days > 89 && days <= 90);
      return reply(201, { grantId: "g1", digest: "gd", revision: 1 }, { etag: '"g"' });
    }
    if (path === "/v1/approvals") return reply(201, { approvalId: "ap" });
    if (path === "/v1/trust/grants/g1/activate") { assert.equal(headers["If-Match"], '"g"'); return reply(200, {}); }
    throw new Error(`unexpected ${path}`);
  };
  const must = async (response, expected, what) => { assert.ok(expected.includes(response.status), what); return response; };
  await ensureGrant({ api, must }, grant, enrolled, published, [], { id: "o", token: "owner" }, { token: "approver" });
  assert.deepEqual(seen, ["owner /v1/trust/grants", "approver /v1/approvals", "approver /v1/trust/grants/g1/activate"]);
  seen.length = 0;
  const edge = { providerAppId: "p", consumerAppId: "c", capabilityId: "cap", version: "1.0.0", state: "active" };
  await ensureGrant({ api, must }, grant, enrolled, published, [edge], { id: "o", token: "owner" }, { token: "approver" });
  assert.deepEqual(seen, []);
  assert.equal(existingGrant([{ ...edge, state: "revoked" }], edge), undefined, "a revoked grant is proposed again");
});
