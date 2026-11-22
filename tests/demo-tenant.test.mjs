// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { APPS, PORTAL_APP, namesFor, parseArgs, parseEnv, portalAppOrigin, renderAppEnv, scopedApp, userRepresentation } from "../demo/plan.mjs";
import { guardOutDir } from "../demo/setup.mjs";
import { loadData, withSubjects } from "../seed/generate.mjs";
import { parseArgs as parseSeedArgs, readAppEnvs, readSubjects } from "../demo/seed.mjs";
import { plannedDocuments, plannedRecords, plannedWorkflowItems } from "../demo/seed-plan.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temp = () => mkdtempSync(join(tmpdir(), "junctura-tenant-"));
const staff = loadData("accounts.json").users.find(user => user.username === "bacsi.benhvien");

test("without --isolated the names, paths, client ids and origins are exactly the current ones", () => {
  const names = namesFor({ tenant: "production", root: ROOT });
  assert.equal(names.isolated, false);
  assert.equal(names.outDir, join(ROOT, ".junctura", "demo"));
  assert.equal(names.username(staff), "bacsi.benhvien");
  assert.equal(names.clientId(APPS[0]), "health-clinic");
  assert.equal(scopedApp(APPS[0], names), APPS[0], "application objects stay untouched");
  assert.equal(portalAppOrigin(), "https://health-portal.provider.internal:8443");
  assert.equal(userRepresentation(staff, "production", "pw").id, staff.subject, "the seeded subject is still requested as the user id");
  assert.equal(parseEnv(renderAppEnv(APPS[0], { baseUrl: "http://127.0.0.1:8080", tenant: "production", appId: "a", clientSecret: "s" })).PROVIDER_HOST, "clinic.provider.internal");
  assert.deepEqual(parseArgs([]), { tenant: "tenant-a", domain: null, isolated: false, help: false });
  assert.deepEqual(parseSeedArgs([]), { tenant: "production", dryRun: false, isolated: false, help: false });
});

test("--isolated --tenant demo puts names, paths and clients in their own namespace", () => {
  const root = temp();
  const names = namesFor({ tenant: "demo", isolated: true, root });
  assert.equal(names.outDir, join(root, ".junctura", "demo", "demo"));
  assert.equal(names.username(staff), "demo.bacsi.benhvien");
  const user = userRepresentation(staff, "demo", "pw", { fixedId: false, username: names.username(staff) });
  assert.equal("id" in user, false, "Keycloak issues the user id, not the seed");
  assert.equal(user.email, "demo.bacsi.benhvien@junctura.invalid");
  assert.deepEqual(user.attributes, { tenant_id: ["demo"] });
  for (const app of APPS) {
    const scoped = scopedApp(app, names);
    assert.equal(scoped.clientId, `health-${app.key}-demo`);
    assert.equal(scoped.webClientId, app.webClientId, "the PKCE web client stays shared between tenants");
    assert.equal(scoped.providerHost, `${app.key}-demo.provider.internal`);
    assert.equal(scoped.origin, `https://${app.key}-demo.provider.internal:8443`);
  }
  const env = parseEnv(renderAppEnv(scopedApp(APPS[0], names), { baseUrl: "http://127.0.0.1:8080", tenant: "demo", appId: "a", clientSecret: "s" }));
  assert.equal(env.JUNCTURA_APP_CLIENT_ID, "health-clinic-demo");
  assert.equal(env.JUNCTURA_WEB_CLIENT_ID, "health-clinic-web");
  assert.equal(env.JUNCTURA_TENANT, "demo");
  assert.equal(env.PROVIDER_HOST, "clinic-demo.provider.internal");
  const portal = { ...PORTAL_APP, clientId: names.clientId(PORTAL_APP), origin: portalAppOrigin("demo") };
  assert.equal(portal.clientId, "health-portal-backend-demo");
  assert.equal(portal.origin, "https://health-portal-demo.provider.internal:8443");
  assert.equal(parseEnv(renderAppEnv(portal, { baseUrl: "x", tenant: "demo", appId: "a", clientSecret: "s" })).JUNCTURA_APP_CLIENT_ID, "health-portal-backend-demo");
  assert.deepEqual(parseArgs(["--isolated", "--tenant", "demo"]), { tenant: "demo", domain: null, isolated: true, help: false });
  assert.deepEqual(parseSeedArgs(["--isolated", "--tenant", "demo"]), { tenant: "demo", dryRun: false, isolated: true, help: false });
});

test("the guard refuses to overwrite env files of another tenant and reads only JUNCTURA_TENANT", () => {
  const directory = temp();
  assert.equal(guardOutDir(directory, "demo"), undefined, "nothing written yet, nothing to refuse");
  writeFileSync(join(directory, "junctura-clinic.env"), "TOP_SECRET=never-print\nJUNCTURA_TENANT=production\n");
  assert.throws(() => guardOutDir(directory, "demo"), error => {
    assert.match(error.message, /--isolated/);
    assert.match(error.message, /production/);
    assert.ok(!error.message.includes("never-print"), "no other key is read or echoed");
    return true;
  });
  assert.equal(guardOutDir(directory, "production"), undefined, "the same tenant may rewrite its own files");
  writeFileSync(join(directory, "junctura-clinic.env"), "JUNCTURA_TENANT=demo\n");
  assert.equal(guardOutDir(directory, "demo"), undefined);
  writeFileSync(join(directory, "junctura-health-portal.env"), "JUNCTURA_TENANT=production\n");
  assert.throws(() => guardOutDir(directory, "demo"), /junctura-health-portal\.env/);
});

test("--isolated without --tenant and a malformed tenant are rejected", () => {
  assert.throws(() => parseArgs(["--isolated"]), /--tenant/);
  assert.throws(() => parseArgs(["--isolated", "--tenant", "Bad Tenant"]), /Invalid --tenant/);
  assert.throws(() => parseSeedArgs(["--isolated"]), /--tenant/);
  assert.throws(() => parseSeedArgs(["--isolated", "--tenant", "Bad"]), /Invalid/);
  assert.throws(() => parseArgs(["--tenant", "Bad Tenant", "--isolated"]), /Invalid --tenant/);
  assert.throws(() => namesFor({ isolated: true }), /--tenant/);
  assert.throws(() => namesFor({ tenant: "Bad Tenant" }), /Invalid --tenant/);
});

test("the seed reads the credentials of the tenant directory and applies the full subject mapping", () => {
  const root = temp();
  const tenantDir = join(root, ".junctura", "demo", "demo");
  mkdirSync(tenantDir, { recursive: true });
  // A decoy of the first tenant stays untouched in the shared directory.
  mkdirSync(join(root, ".junctura", "demo"), { recursive: true });
  writeFileSync(join(root, ".junctura", "demo", "junctura-clinic.env"), "JUNCTURA_TENANT=production\n");
  const names = namesFor({ tenant: "demo", isolated: true });
  const secret = "s3cr3t-never-print";
  for (const app of ["junctura-clinic", "junctura-hospital", "junctura-insurance"]) {
    writeFileSync(join(tenantDir, `${app}.env`), renderAppEnv(scopedApp(APPS.find(item => item.name === app), names), { baseUrl: "http://127.0.0.1:8080", tenant: "demo", appId: "a", clientSecret: secret }));
  }
  const configs = readAppEnvs(tenantDir, "demo");
  assert.deepEqual(configs.map(config => config.clientId), ["health-clinic-demo", "health-hospital-demo", "health-insurance-demo"],
    "the seed reads the tenant directory, not the shared one");
  assert.equal(new Set(configs.map(config => config.clientSecret)).size, 1);
  assert.throws(() => readAppEnvs(join(root, ".junctura", "demo"), "demo"), "the shared directory with the other tenant's file is not used silently");

  const mapping = { "seed-subject": "real-subject", "another": "real-two" };
  writeFileSync(join(tenantDir, "subjects.json"), JSON.stringify(mapping));
  assert.deepEqual(readSubjects(tenantDir), mapping);
  assert.equal(readSubjects(join(root, ".junctura", "demo")), null, "the shared directory has no subjects.json");

  // Every seeded subject is different from the one Keycloak issued (the isolated case),
  // and the seed really applies the mapping before planning records, files and workflows.
  const datasets = { clinic: loadData("clinic.json"), hospital: loadData("hospital.json"), insurance: loadData("insurance.json") };
  const subjects = new Set();
  const walk = value => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (key === "subject" && typeof child === "string") subjects.add(child);
        else walk(child);
      }
    }
  };
  for (const dataset of Object.values(datasets)) walk(dataset);
  assert.ok(subjects.size > 0);
  const issued = Object.fromEntries([...subjects].map(subject => [subject, `kc-${subject}`]));
  assert.ok([...subjects].every(subject => issued[subject] !== subject), "every subject differs, as in an isolated run");
  const mapped = Object.fromEntries(Object.entries(datasets).map(([name, dataset]) => [name, withSubjects(dataset, issued)]));
  const records = plannedRecords(mapped, "demo");
  assert.equal(records[0].records[0].data.subject, `kc-${datasets.clinic.patients[0].subject}`, "patient subjects are remapped");
  const referral = records[1].records[0].data;
  assert.equal(referral.subject, `kc-${datasets.clinic.referrals[0].subject}`);
  assert.ok(mapped.clinic.patients.some(patient => patient.subject === referral.subject), "referrals still resolve to their remapped patient");
  for (const document of plannedDocuments(mapped, "demo")) assert.ok(document.bytes.length > 0, "documents build from remapped data");
  const items = plannedWorkflowItems(mapped, "demo");
  assert.equal(items.length, 9);
  for (const item of items) assert.equal(typeof item.input.ma_ho_so, "string");
});
