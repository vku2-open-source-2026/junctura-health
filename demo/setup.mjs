// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Prepares a running local Junctura DX-OS stack for the Junctura Health demo:
//   npm run demo:setup [-- --tenant tenant-a] [--domain junctura.studio]
// 1. demo accounts from seed/data/accounts.json (one shared demo password, kept locally)
// 2. the five applications, each with a backend client and a browser (PKCE) client
// 3. the six capabilities from contracts/, validated, approved and published
// 4. one grant per provider/consumer pair of the contracts
// Everything goes through the real Gateway with Junctura's separation of duties
// (owner proposes, independent approver approves), using the operator helper of the
// Junctura DX-OS checkout next to this repository. Nothing is copied from it.
// Safe to run again: existing accounts, applications, capabilities and grants are kept.
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CONTRACTS, buildManifest } from "../contracts/index.mjs";
import { loadData } from "../seed/generate.mjs";
import { APPS, appByName, appWebOrigins, existingGrant, internalOrigins, mergeWebClient, namesFor, parseArgs, parseEnv, planGrants, portalAppOrigin, PORTAL, portalClient, portalOrigins, PORTAL_APP, providers, publicOrigin, renderAppEnv, scopedApp, staffPrincipals, userRepresentation, webClient } from "./plan.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".junctura", "demo");
const CONSOLE_CLIENT = "junctura-console";
const readEnv = path => existsSync(path) ? parseEnv(readFileSync(path, "utf8")) : {};
const step = message => console.log(`• ${message}`);
const secretFile = (path, text) => writeFileSync(path, text, { mode: 0o600 });

export function resolveDxos(env = process.env, root = ROOT) {
  const directory = resolve(root, env.JUNCTURA_DXOS_DIR || "../junctura-dxos");
  const helper = join(directory, "scripts", "lib", "demo-stack.mjs");
  if (!existsSync(helper)) throw new Error(`Junctura DX-OS not found at ${directory}: clone it next to this repository or set JUNCTURA_DXOS_DIR`);
  if (!existsSync(join(directory, ".env"))) throw new Error(`${directory} has no .env: run "npm run setup" and "npm run local:up" there first`);
  return { directory, helper };
}

// One demo password for every demo account: DEMO_PASSWORD, or a random one that is
// generated once and kept in .junctura/demo/accounts.env (never printed or committed).
export function demoPassword(env, file) {
  if (env.DEMO_PASSWORD) return env.DEMO_PASSWORD;
  const saved = readEnv(file).DEMO_PASSWORD;
  if (saved) return saved;
  const generated = randomBytes(12).toString("base64url");
  secretFile(file, `# Shared password of the local demo accounts. Private - never commit.\nDEMO_PASSWORD=${generated}\n`);
  return generated;
}

const TENANT_LINE = /^JUNCTURA_TENANT=(.*)$/m;

/** Reads only the JUNCTURA_TENANT line of an env file; no other key is looked at or printed. */
export function envTenant(file) {
  const match = readFileSync(file, "utf8").match(TENANT_LINE);
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : undefined;
}

/**
 * Guard against mixing tenants in one output directory: when an application env file is
 * already there and belongs to another tenant, stop with a clear message (suggesting
 * --isolated) before anything is written to Keycloak or the database. Runs without
 * --isolated keep their behaviour when the directory matches the requested tenant.
 */
export function guardOutDir(directory, tenant) {
  for (const app of [...APPS, PORTAL_APP]) {
    const file = join(directory, `${app.name}.env`);
    if (!existsSync(file)) continue;
    const existing = envTenant(file);
    if (existing && existing !== tenant) {
      throw new Error(`${file} thuộc tenant "${existing}" trong khi lệnh chạy cho tenant "${tenant}": dùng --isolated (kèm --tenant ${tenant}) để nạp tenant thứ hai vào thư mục riêng, hoặc chạy lại với --tenant ${existing}`);
    }
  }
}

export async function ensureAccounts(stack, accounts, password, names = namesFor({})) {
  const { admin, must, group, roles, tenant } = stack;
  const subjects = {};
  let created = 0;
  for (const account of accounts) {
    const username = names.username(account);
    const find = async () => (await (await admin(`users?username=${encodeURIComponent(username)}&exact=true`)).json())[0]?.id;
    let id = await find();
    if (!id) {
      // Without --isolated a partial import keeps the seeded subject as the Keycloak user
      // id; with --isolated Keycloak issues a fresh id for the tenant-prefixed username.
      const user = userRepresentation(account, tenant, password, { fixedId: !names.isolated, username });
      const imported = await admin("partialImport", { ifResourceExists: "SKIP", users: [user] });
      id = imported.ok ? await find() : undefined;
      if (!id) {
        const { id: _seeded, ...plain } = user;
        id = stack.idFrom(await must(await admin("users", plain), [201], `Create ${username}`));
      }
      created++;
    } else {
      await must(await admin(`users/${id}/reset-password`, { type: "password", value: password, temporary: false }, "PUT"), [204], `Set password of ${username}`);
    }
    await must(await admin(`users/${id}/groups/${group.id}`, undefined, "PUT"), [204], `Add ${username} to ${tenant}`);
    await must(await admin(`users/${id}/role-mappings/realm`, roles), [204], `Assign roles to ${username}`);
    subjects[account.subject] = id;
  }
  return { subjects, created };
}

export async function ensureApplication(stack, lib, app, owner, approver, out = OUT, domain = null) {
  const { admin, must, sql, tenant, issuer } = stack;
  const { q } = lib;
  const row = await sql(`SELECT a.app_id||'|'||a.state||'|'||coalesce(e.resource_subject,'') FROM app_private.applications a
    JOIN app_private.enrollments e ON (e.tenant_id,e.issuer,e.oauth_client_id)=(a.tenant_id,a.issuer,a.oauth_client_id)
    WHERE a.tenant_id=${q(tenant)} AND a.issuer=${q(issuer)} AND a.oauth_client_id=${q(app.clientId)};`);
  let appId, subject, clientSecret;
  if (row) {
    let state;
    [appId, state, subject] = row.split("|");
    if (state !== "active") throw new Error(`${app.clientId} exists but is ${state}; reactivate it in the Console or use another tenant`);
    const client = (await (await admin(`clients?clientId=${app.clientId}`)).json())[0];
    if (!client) throw new Error(`${app.clientId} is registered but its Keycloak client is missing`);
    clientSecret = (await (await must(await admin(`clients/${client.id}/client-secret`), [200], `Read ${app.clientId} secret`)).json()).value;
    step(`${app.displayName} already enrolled`);
  } else {
    const enrolled = await lib.enrollApplication(stack, { clientId: app.clientId, origin: app.origin, displayName: app.displayName }, owner, approver);
    appId = enrolled.app.appId; subject = enrolled.subject; clientSecret = enrolled.clientSecret;
  }
  await ensureWebClient(stack, webClient(app, await stack.mappersFor(), appWebOrigins(app, domain)));
  secretFile(join(out, `${app.name}.env`), renderAppEnv(app, { baseUrl: stack.base, tenant, appId, clientSecret }));
  return { appId, subject };
}

export async function ensureCapability(stack, contract, providerAppId, owner, approver) {
  const { api, must } = stack;
  const manifest = buildManifest(contract, providerAppId);
  const versions = `/v1/capabilities/${encodeURIComponent(manifest.capabilityId)}/versions`, path = `${versions}/${contract.version}`;
  let response = await api(path, owner.token);
  if (response.status === 404) response = await must(await api(versions, owner.token, manifest), [201], `Register ${contract.slug}`);
  else await must(response, [200], `Read ${contract.slug}`);
  let etag = response.headers.get("etag"), value = await response.json();
  if (value.state === "published") { step(`${contract.title} already published`); return value; }
  if (value.state !== "draft") throw new Error(`${contract.slug}@${contract.version} is ${value.state}; publish a new contract version instead`);
  step(`Validate, approve and publish ${contract.title}`);
  const validated = await must(await api(`${path}/validate`, owner.token, {}, { "If-Match": etag }), [200], `Validate ${contract.slug}`);
  etag = validated.headers.get("etag") ?? etag;
  value = { ...value, ...(await validated.json()) };
  const decision = await must(await api("/v1/approvals", approver.token, { resourceType: "capability-version",
    resourceId: `${manifest.capabilityId}@${contract.version}`, resourceDigest: value.digest, resourceRevision: value.revision,
    requesterSubject: owner.id, requesterAppId: providerAppId, decision: "approve", expiresAt: new Date(Date.now() + 120000).toISOString() }), [201], `Approve ${contract.slug}`);
  return (await must(await api(`${path}/publish`, owner.token, { approvalId: (await decision.json()).approvalId }, { "If-Match": etag }), [200], `Publish ${contract.slug}`)).json();
}

export async function ensureGrant(stack, grant, enrolled, published, edges, owner, approver) {
  const { api, must } = stack;
  const provider = enrolled[grant.provider], consumer = enrolled[grant.consumer], capability = published[grant.slug];
  const label = `${appByName(grant.provider).key} → ${appByName(grant.consumer).key} (${grant.slug})`;
  if (existingGrant(edges, { providerAppId: provider.appId, consumerAppId: consumer.appId, capabilityId: capability.capabilityId, version: grant.version })) {
    step(`Grant ${label} already present`); return;
  }
  step(`Grant ${label}`);
  const created = await must(await api("/v1/trust/grants", owner.token, {
    providerAppId: provider.appId, consumerAppId: consumer.appId,
    capabilities: [{ capabilityId: capability.capabilityId, version: capability.version, manifestDigest: capability.digest }],
    operations: grant.operations, permissions: capability.manifest.requiredPermissions, subjectIds: [consumer.subject],
    expiresAt: new Date(Date.now() + grant.days * 86_400_000).toISOString(), delegationAllowed: false, acceptDelegation: false,
  }), [201], `Propose grant ${label}`);
  const proposal = await created.json();
  const decision = await must(await api("/v1/approvals", approver.token, { resourceType: "grant", resourceId: proposal.grantId,
    resourceDigest: proposal.digest, resourceRevision: proposal.revision, requesterSubject: owner.id, requesterAppId: provider.appId,
    decision: "approve", expiresAt: new Date(Date.now() + 120000).toISOString() }), [201], `Approve grant ${label}`);
  await must(await api(`/v1/trust/grants/${proposal.grantId}/activate`, approver.token, { approvalId: (await decision.json()).approvalId },
    { "If-Match": created.headers.get("etag") }), [200], `Activate grant ${label}`);
}

/**
 * Creates a public web client, or adds the origins it lacks to the existing one (never
 * removes any), so a second run with --domain opens the subdomain without a new client.
 */
export async function ensureWebClient(stack, desired) {
  const { admin, must } = stack;
  const existing = (await (await admin(`clients?clientId=${encodeURIComponent(desired.clientId)}`)).json())[0];
  if (!existing) {
    await must(await admin("clients", desired), [201], `Create ${desired.clientId}`);
    step(`${desired.clientId} created`);
    return "created";
  }
  const merged = mergeWebClient(existing, desired);
  if (!merged) {
    step(`${desired.clientId} already present`);
    return "unchanged";
  }
  await must(await admin(`clients/${existing.id}`, merged, "PUT"), [204], `Update ${desired.clientId} origins`);
  step(`${desired.clientId} origins updated`);
  return "updated";
}

/** The portal's public web client, with the tenant mapper of the realm. */
export async function ensurePortalClient(stack, origins = portalOrigins()) {
  return ensureWebClient(stack, portalClient(await stack.mappersFor(), origins));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { console.log("Usage: npm run demo:setup [-- --tenant tenant-a] [--isolated] [--domain junctura.studio]\nSee demo/README.md."); return; }
  const names = namesFor(options);
  const local = { ...readEnv(join(ROOT, ".env")), ...process.env };
  const dxos = resolveDxos(local);
  for (const [key, value] of Object.entries(readEnv(join(dxos.directory, ".env")))) process.env[key] ??= value;
  mkdirSync(names.outDir, { recursive: true, mode: 0o700 });
  // Before anything is written to Keycloak or the database: refuse to mix tenants.
  guardOutDir(names.outDir, options.tenant);
  const password = demoPassword(local, join(names.outDir, "accounts.env"));

  // The operator helper talks to the stack's own database container, so run from its directory.
  process.chdir(dxos.directory);
  const lib = await import(pathToFileURL(dxos.helper).href);
  const stack = await lib.connectDemoStack({ tenant: options.tenant });
  await stack.ensureManagementClient();
  step("Demo owner and independent approver");
  const owner = await stack.human("owner", lib.OWNER_PERMISSIONS);
  const approver = await stack.human("approver", lib.APPROVER_PERMISSIONS);

  const accounts = loadData("accounts.json").users;
  step(`Demo accounts (${accounts.length})`);
  const { subjects, created } = await ensureAccounts(stack, accounts, password, names);
  const moved = Object.entries(subjects).filter(([seeded, actual]) => seeded !== actual).length;
  writeFileSync(join(names.outDir, "subjects.json"), `${JSON.stringify(subjects, null, 2)}\n`);
  // The health administrator reviews grants and emergency access in the Console.
  const administrator = accounts.find(account => account.role === "health-admin");
  await stack.sql(`INSERT INTO app_private.principals(tenant_id,issuer,subject,management_client,permissions)
    VALUES(${lib.q(options.tenant)},${lib.q(stack.issuer)},${lib.q(subjects[administrator.subject])},${lib.q(CONSOLE_CLIENT)},ARRAY[${lib.APPROVER_PERMISSIONS.map(lib.q).join(",")}]::text[])
    ON CONFLICT (tenant_id,issuer,subject,management_client) DO UPDATE SET permissions=EXCLUDED.permissions, enabled=true;`);
  // Staff accounts open the signed-in workspace of the portal (patients never do there):
  // one principal per staff account on the portal's web client, audit.read only.
  for (const principal of staffPrincipals(accounts)) {
    await stack.sql(`INSERT INTO app_private.principals(tenant_id,issuer,subject,management_client,permissions)
      VALUES(${lib.q(options.tenant)},${lib.q(stack.issuer)},${lib.q(subjects[principal.subject])},${lib.q(principal.managementClient)},ARRAY[${principal.permissions.map(lib.q).join(",")}]::text[])
      ON CONFLICT (tenant_id,issuer,subject,management_client) DO UPDATE SET permissions=EXCLUDED.permissions, enabled=true;`);
  }

  const apps = APPS.map(app => scopedApp(app, names));
  const enrolled = {};
  for (const app of apps) enrolled[app.name] = await ensureApplication(stack, lib, app, owner, approver, names.outDir, options.domain);
  // The portal signs staff in with the realm but is not a Junctura application.
  step(PORTAL.displayName);
  await ensurePortalClient(stack, portalOrigins(options.domain));
  // The portal's backend is a real Junctura application (its own backend client)
  // that stores notice-board entries, notes and attachments through /v2/data and
  // /v2/objects. It reuses the portal web client, publishes no capability and
  // needs no grant; the web client of the portal stays untouched.
  step(`${PORTAL_APP.displayName} (backend)`);
  enrolled[PORTAL_APP.name] = await ensureApplication(stack, lib, { ...PORTAL_APP, clientId: names.clientId(PORTAL_APP), origin: portalAppOrigin(names.isolated ? names.tenant : undefined) }, owner, approver, names.outDir, options.domain);
  const published = {};
  for (const contract of CONTRACTS) published[contract.slug] = await ensureCapability(stack, contract, enrolled[contract.provider].appId, owner, approver);
  const graph = await (await stack.must(await stack.api("/v1/trust/graph", approver.token), [200], "Read trust graph")).json();
  for (const grant of planGrants()) await ensureGrant(stack, grant, enrolled, published, graph.edges, owner, approver);

  console.log(`\n✔ Junctura Health demo is ready on ${stack.base} (${options.tenant}${names.isolated ? ", isolated" : ""}).`);
  console.log(`  Accounts: ${accounts.length} (${created} new). Shared password: ${local.DEMO_PASSWORD ? "DEMO_PASSWORD from your environment" : join(names.outDir, "accounts.env")}`);
  console.log(`  Application credentials: ${join(names.outDir, "<app>.env")} (private)`);
  console.log(`  Portal: ${options.domain ? publicOrigin(PORTAL.key, options.domain) : `http://localhost:${PORTAL.webPort}`} - sign in with a demo staff account (config: portal/public/config.json)`);
  console.log(`  Subjects: ${join(names.outDir, "subjects.json")}${moved ? ` - ${moved} differ from the seed; load data with withSubjects()` : " - identical to the seed"}`);
  console.log("\n  To let Junctura call the provider applications, in the Junctura DX-OS directory:");
  console.log(`    npm run provider:pki -- ${providers().map(app => app.key).join(" ")}`);
  console.log(`    add to .env:  C4A_ENABLED=true`);
  console.log(`                  C4A_INTERNAL_PROVIDER_ORIGINS=${JSON.stringify(internalOrigins(undefined, apps))}`);
  if (names.isolated) console.log(`  Isolated tenant: provider hosts carry the tenant (${apps.map(app => app.providerHost).join(", ")}); make sure the provider PKI issues a certificate for each of them.`);
  console.log("    docker compose -f compose.yaml -f compose.providers.yaml up -d core");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    const offline = error.cause && error.message === "fetch failed";
    console.error(`✖ ${offline ? 'Cannot reach Junctura: start it with "npm run local:up" in the Junctura DX-OS directory' : error.message}`);
    process.exitCode = 1;
  });
}
