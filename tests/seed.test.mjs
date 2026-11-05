// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { getContract, validateValue } from "../contracts/index.mjs";
import { generate, loadData, rebase, serialize, PATIENTS, REFERENCE_DATE } from "../seed/generate.mjs";
import { allergyList, claimVerify, preVisitSummary, prescriptionVerify, referralSummary, vaccinationHistory } from "../seed/views.mjs";

const clinic = loadData("clinic.json"), hospital = loadData("hospital.json"), insurance = loadData("insurance.json"), accounts = loadData("accounts.json");
const example = slug => JSON.parse(readFileSync(new URL(`../contracts/examples/${slug}.json`, import.meta.url), "utf8"));
const valid = (slug, value) => assert.deepEqual(validateValue(getContract(slug).outputSchema, value), [], slug);
const AN = clinic.patients[0];

test("generation is deterministic and the committed data is current", () => {
  const first = generate(), second = generate();
  assert.deepEqual(first, second);
  for (const [name, value] of Object.entries(first)) {
    assert.equal(readFileSync(new URL(`../seed/data/${name}`, import.meta.url), "utf8"), serialize(value), `${name}: run npm run seed:generate`);
  }
});

test("50 patients with unique identifiers and one account each", () => {
  assert.equal(clinic.patients.length, PATIENTS);
  const subjects = new Set(clinic.patients.map(p => p.subject));
  assert.equal(subjects.size, PATIENTS);
  assert.equal(new Set(clinic.patients.map(p => p.patientId)).size, PATIENTS);
  const users = accounts.users;
  assert.equal(new Set(users.map(u => u.username)).size, users.length);
  assert.equal(new Set(users.map(u => u.subject)).size, users.length);
  for (const p of clinic.patients) assert.ok(users.some(u => u.subject === p.subject && u.role === "patient"), p.patientId);
  for (const role of ["clinic-staff", "physician", "pharmacist", "claims-assessor", "health-admin"]) assert.ok(users.some(u => u.role === role), role);
  assert.ok(!JSON.stringify(accounts).toLowerCase().includes("password\":"), "no passwords in data");
  for (const u of users) assert.match(u.subject, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("every record fits its capability contract", () => {
  for (const p of clinic.patients) {
    valid("pre-visit-summary", preVisitSummary(clinic, p.subject));
    valid("allergy-list", allergyList(clinic, p.subject));
    valid("vaccination-history", vaccinationHistory(clinic, p.subject));
  }
  for (const r of clinic.referrals) valid("referral-summary", referralSummary(clinic, r.subject, r));
  for (const rx of hospital.prescriptions) valid("prescription-verify", prescriptionVerify(hospital, rx.subject, rx));
  for (const c of insurance.claimRequests) valid("claim-verify", claimVerify(hospital, c.subject, { claimId: c.claimId, amountVnd: c.requestedAmountVnd }));
});

test("the demo patient An matches the contract examples", () => {
  assert.equal(AN.patientName, "Nguyễn Văn An");
  const now = new Date("2026-10-30T00:00:00.000Z"), at = new Date("2026-11-02T04:00:00.000Z");
  assert.deepEqual(allergyList(clinic, AN.subject), example("allergy-list").output);
  assert.deepEqual(vaccinationHistory(clinic, AN.subject), example("vaccination-history").output);
  assert.deepEqual(referralSummary(clinic, AN.subject, example("referral-summary").input), example("referral-summary").output);
  assert.deepEqual(prescriptionVerify(hospital, AN.subject, example("prescription-verify").input, now), example("prescription-verify").output);
  assert.deepEqual(claimVerify(hospital, AN.subject, example("claim-verify").input, at), example("claim-verify").output);
  const summary = preVisitSummary(clinic, AN.subject), expected = example("pre-visit-summary").output;
  assert.deepEqual({ ...summary, recentEncounters: summary.recentEncounters.slice(0, 1) }, expected, "newest encounter first");
  assert.equal(summary.recentEncounters.length, 3);
});

test("views never return another person's record", () => {
  const other = clinic.patients[1].subject;
  assert.equal(referralSummary(clinic, other, { referralId: "CT-2026-000123" }), undefined);
  assert.equal(prescriptionVerify(hospital, other, { prescriptionCode: "DT-2026-004521" }), undefined);
  assert.equal(claimVerify(hospital, other, { claimId: "HS-2026-00987", amountVnd: 2450000 }).matches, false);
  assert.equal(preVisitSummary(clinic, "00000000-0000-4000-8000-000000000000"), null);
});

test("data supports the demo: allergy alert, mismatched claims, no unsafe prescription", () => {
  assert.ok(AN.allergies.some(a => a.substance === "Penicillin"), "prescribing amoxicillin to An must raise an alert");
  const bySubject = new Map(clinic.patients.map(p => [p.subject, p]));
  for (const rx of hospital.prescriptions) {
    const allergic = bySubject.get(rx.subject).allergies.some(a => a.substance === "Penicillin");
    assert.ok(!(allergic && rx.items.some(i => i.name === "Amoxicillin")), rx.prescriptionCode);
  }
  const mismatched = insurance.claimRequests.filter(c => !claimVerify(hospital, c.subject, { claimId: c.claimId, amountVnd: c.requestedAmountVnd }).matches);
  assert.ok(mismatched.length >= 2 && mismatched.length < insurance.claimRequests.length);
});

test("rebase moves every date by the same offset", () => {
  const moved = rebase(clinic, "2026-12-06");
  assert.equal(moved.referenceDate, "2026-12-06");
  assert.equal(moved.referrals.find(r => r.referralId === "CT-2026-000123").issuedAt, "2026-12-02T09:30:00.000Z");
  assert.equal(moved.patients[0].chronicConditions[0].since, "2019-04-16");
  assert.equal(moved.patients[0].birthYear, AN.birthYear, "numbers are untouched");
  assert.equal(clinic.referenceDate, REFERENCE_DATE, "input is not mutated");
  assert.throws(() => rebase(clinic, "not-a-date"), TypeError);
});
