// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Deterministic synthetic patients for Junctura Health (no real person, no external tool).
//   npm run seed:generate            -> rewrite seed/data/*.json
//   npm run seed:generate -- --check -> fail if the committed data is out of date
// The same seed always yields byte-identical files. Dates are fixed around
// REFERENCE_DATE; rebase() moves them to "today" when a demo stack is loaded.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ALLERGIES, CLINIC, CONDITIONS, FAMILY, GIVEN, HOSPITAL, HOSPITAL_DRUGS, MIDDLE, REFERRALS, VACCINES, VISITS, WARDS } from "./catalog.mjs";

export const SEED = "junctura-health/v1";
export const REFERENCE_DATE = "2026-11-01";
export const PATIENTS = 50;
const DATA = new URL("./data/", import.meta.url);
const DAY = 86_400_000;

// sfc32, seeded from SHA-256 of the seed string.
function random(seed) {
  const h = createHash("sha256").update(seed).digest();
  let [a, b, c, d] = [0, 4, 8, 12].map(i => h.readUInt32LE(i));
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    const t = (a + b | 0) + d | 0;
    d = d + 1 | 0; a = b ^ b >>> 9; b = c + (c << 3) | 0; c = c << 21 | c >>> 11; c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 12; i++) next();
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  return {
    next, int,
    chance: p => next() < p,
    pick: list => list[int(0, list.length - 1)],
    uuid() {
      const hex = Array.from({ length: 32 }, () => int(0, 15).toString(16));
      hex[12] = "4"; hex[16] = "89ab"[int(0, 3)];
      const s = hex.join("");
      return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
    },
  };
}

const ref = Date.parse(`${REFERENCE_DATE}T00:00:00.000Z`);
const day = offset => new Date(ref + offset * DAY).toISOString().slice(0, 10);
const at = (date, hour, minute = 0) => `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;
const plusDays = (iso, days) => new Date(Date.parse(iso) + days * DAY).toISOString();
const byDate = key => (x, y) => x[key] < y[key] ? -1 : x[key] > y[key] ? 1 : 0;

// The two people the demo script follows; they also match contracts/examples.
const AN = {
  patientName: "Nguyễn Văn An", birthYear: 1968, sex: "male", ward: "Hòa Khánh Bắc", username: "benhnhan.an",
  allergies: [ALLERGIES[0]],
  chronicConditions: [{ code: "I10", name: "Tăng huyết áp vô căn", since: "2019-03-12" }, { code: "E11", name: "Đái tháo đường type 2", since: "2021-08-02" }],
  currentMedications: [{ name: "Amlodipin", dose: "5 mg x 1 lần/ngày", since: "2019-03-12" }, { name: "Metformin", dose: "500 mg x 2 lần/ngày", since: "2021-08-02" }],
  encounters: [
    { date: "2026-03-18", reason: "Tái khám định kỳ", diagnosis: { code: "I10", name: "Tăng huyết áp vô căn" } },
    { date: "2026-07-22", reason: "Tái khám định kỳ", diagnosis: { code: "E11", name: "Đái tháo đường type 2" } },
    { date: "2026-10-28", reason: "Đau ngực, khó thở khi gắng sức", diagnosis: { code: "I20.9", name: "Cơn đau thắt ngực" } },
  ],
  vaccinations: [{ vaccine: "Vắc xin uốn ván (VAT)", code: "112", date: "2024-05-10", doseNumber: 1 }, { vaccine: "Vắc xin cúm mùa", code: "141", date: "2025-10-02", doseNumber: 1 }],
  updatedAt: "2026-10-28T09:15:00.000Z", vaccinationsUpdatedAt: "2025-10-02T02:00:00.000Z",
};
const BINH = {
  patientName: "Trần Thị Bình", birthYear: 1975, sex: "female", ward: "Hòa Minh", username: "benhnhan.binh",
  allergies: [ALLERGIES[1]],
  chronicConditions: [{ code: "J45", name: "Hen phế quản", since: "2010-05-20" }],
  currentMedications: [{ name: "Salbutamol xịt", dose: "2 nhát khi khó thở", since: "2010-05-20" }],
  encounters: [
    { date: "2025-12-04", reason: "Sốt, ho, đau họng", diagnosis: { code: "J06.9", name: "Nhiễm trùng đường hô hấp trên cấp" } },
    { date: "2026-09-15", reason: "Tái khám định kỳ", diagnosis: { code: "J45", name: "Hen phế quản" } },
  ],
  vaccinations: [{ vaccine: "Vắc xin cúm mùa", code: "141", date: "2025-10-09", doseNumber: 1 }],
  updatedAt: "2026-09-15T08:40:00.000Z", vaccinationsUpdatedAt: "2025-10-09T02:00:00.000Z",
};

function randomPatient(r, index) {
  const sex = r.chance(0.5) ? "male" : "female";
  const age = r.int(3, 88);
  const birthYear = Number(REFERENCE_DATE.slice(0, 4)) - age;
  const patientName = `${r.pick(FAMILY)} ${r.pick(MIDDLE[sex])} ${r.pick(GIVEN[sex])}`;
  const allergies = [];
  if (r.chance(0.32)) allergies.push(r.pick(ALLERGIES));
  if (r.chance(0.08)) { const extra = r.pick(ALLERGIES); if (!allergies.includes(extra)) allergies.push(extra); }
  const chronicConditions = [], currentMedications = [];
  for (const condition of CONDITIONS) {
    if (age < condition.minAge || chronicConditions.length >= 3 || !r.chance(0.17 + age / 400)) continue;
    const since = day(-r.int(90, Math.min(15 * 365, (age - condition.minAge + 1) * 365)));
    chronicConditions.push({ code: condition.code, name: condition.name, since });
    currentMedications.push({ ...condition.medication, since });
  }
  const encounters = [];
  for (let i = r.int(1, 5); i > 0; i--) {
    const visit = r.pick(VISITS);
    const chronic = chronicConditions.length ? r.pick(chronicConditions) : null;
    const diagnosis = visit.diagnosis ?? (chronic ? { code: chronic.code, name: chronic.name } : VISITS[0].diagnosis);
    encounters.push({ date: day(-r.int(5, 730)), reason: visit.diagnosis || chronic ? visit.reason : VISITS[0].reason, diagnosis });
  }
  encounters.sort(byDate("date"));
  const vaccinations = [];
  for (const vaccine of VACCINES) {
    if (!r.chance(vaccine.code === "213" ? 0.8 : 0.4)) continue;
    let date = vaccine.code === "213" ? "2021-08-10" : day(-r.int(120, 3000));
    for (let dose = 1; dose <= vaccine.doses; dose++) {
      if (dose > 1 && !r.chance(0.85)) break;
      vaccinations.push({ vaccine: vaccine.vaccine, code: vaccine.code, date, doseNumber: dose });
      date = plusDays(`${date}T00:00:00.000Z`, r.int(28, 180)).slice(0, 10);
    }
  }
  vaccinations.sort(byDate("date"));
  const last = encounters.at(-1).date;
  return {
    patientName, birthYear, sex, ward: r.pick(WARDS), username: `benhnhan.p${String(index).padStart(4, "0")}`,
    allergies, chronicConditions, currentMedications, encounters, vaccinations,
    updatedAt: at(last, r.int(1, 9), r.int(0, 59)),
    vaccinationsUpdatedAt: vaccinations.length ? at(vaccinations.at(-1).date, 2) : at(last, 2),
  };
}

const DRUGS_FOR = { "I20.9": [0, 1], "E11.6": [2], "J44.1": [3], "M17.1": [4] };
const PENICILLINS = new Set(["Amoxicillin"]);

export function generate() {
  const r = random(SEED);
  const patients = [AN, BINH, ...Array.from({ length: PATIENTS - 2 }, (_, i) => randomPatient(r, i + 3))]
    .map((p, i) => ({ subject: r.uuid(), patientId: `P${String(i + 1).padStart(4, "0")}`, ...p }));

  const referrals = [{ referralId: "CT-2026-000123", subject: patients[0].subject, issuedAt: "2026-10-28T09:30:00.000Z",
    toFacility: HOSPITAL, urgency: "urgent", reason: REFERRALS[0].reason, provisionalDiagnosis: REFERRALS[0].diagnosis, treatmentGiven: REFERRALS[0].treatment }];
  const prescriptions = [{ prescriptionCode: "DT-2026-004521", subject: patients[0].subject, issuedAt: "2026-10-29T03:00:00.000Z",
    expiresAt: "2026-11-03T03:00:00.000Z", items: [HOSPITAL_DRUGS[0]], dispensed: false }];
  const claims = [{ claimId: "HS-2026-00987", subject: patients[0].subject, amountVnd: 2450000, recordedAt: "2026-10-31T10:00:00.000Z" }];
  const requests = [{ claimId: "HS-2026-00987", subject: patients[0].subject, requestedAmountVnd: 2450000, submittedAt: "2026-11-01T02:00:00.000Z" }];

  let referralNo = 124, prescriptionNo = 4522, claimNo = 988;
  for (const patient of patients.slice(2)) {
    const codes = new Set(patient.chronicConditions.map(c => c.code));
    const fit = REFERRALS.filter(t => (t.diagnosis.code === "I20.9" && (codes.has("I10") || codes.has("E78"))) ||
      (t.diagnosis.code === "E11.6" && codes.has("E11")) || (t.diagnosis.code === "J44.1" && codes.has("J44")) || (t.diagnosis.code === "M17.1" && codes.has("M17")));
    if (fit.length && r.chance(0.45)) {
      const template = r.pick(fit);
      const issuedAt = at(day(-r.int(2, 150)), r.int(1, 9), r.int(0, 59));
      referrals.push({ referralId: `CT-2026-${String(referralNo++).padStart(6, "0")}`, subject: patient.subject, issuedAt, toFacility: HOSPITAL,
        urgency: template.urgency, reason: template.reason, provisionalDiagnosis: template.diagnosis, treatmentGiven: template.treatment });
      const rxAt = plusDays(issuedAt, 1);
      prescriptions.push({ prescriptionCode: `DT-2026-${String(prescriptionNo++).padStart(6, "0")}`, subject: patient.subject, issuedAt: rxAt,
        expiresAt: plusDays(rxAt, 5), items: DRUGS_FOR[template.diagnosis.code].map(i => HOSPITAL_DRUGS[i]),
        dispensed: Date.parse(rxAt) < ref - 30 * DAY || r.chance(0.5) });
      const amountVnd = r.int(500, 15000) * 1000, claimId = `HS-2026-${String(claimNo++).padStart(5, "0")}`, recordedAt = plusDays(rxAt, 2);
      claims.push({ claimId, subject: patient.subject, amountVnd, recordedAt });
      // Every third request the insurer receives overstates the hospital record.
      const requested = claimNo % 3 === 0 ? amountVnd + r.int(1, 20) * 100000 : amountVnd;
      requests.push({ claimId, subject: patient.subject, requestedAmountVnd: requested, submittedAt: plusDays(recordedAt, r.int(1, 10)) });
    } else if (!patient.allergies.some(a => a.substance === "Penicillin") && r.chance(0.12)) {
      const issuedAt = at(day(-r.int(2, 200)), r.int(1, 9), r.int(0, 59));
      prescriptions.push({ prescriptionCode: `DT-2026-${String(prescriptionNo++).padStart(6, "0")}`, subject: patient.subject, issuedAt,
        expiresAt: plusDays(issuedAt, 5), items: [HOSPITAL_DRUGS[5]], dispensed: Date.parse(issuedAt) < ref - 30 * DAY || r.chance(0.5) });
    }
  }
  for (const list of [referrals, prescriptions, claims, requests]) list.sort((x, y) => byDate(x.issuedAt ? "issuedAt" : x.recordedAt ? "recordedAt" : "submittedAt")(x, y));

  const staff = [
    { username: "ysi.tramyte", displayName: "Y sĩ Lê Thị Hoa", role: "clinic-staff", app: "junctura-clinic" },
    { username: "bacsi.benhvien", displayName: "BS. Phạm Minh Quang", role: "physician", app: "junctura-hospital" },
    { username: "duocsi.nhathuoc", displayName: "DS. Võ Thu Trang", role: "pharmacist", app: "junctura-pharmacy" },
    { username: "giamdinh.baohiem", displayName: "Giám định viên Đỗ Quốc Hùng", role: "claims-assessor", app: "junctura-insurance" },
    { username: "quantri.soyte", displayName: "Quản trị Sở Y tế", role: "health-admin", app: "junctura-dxos" },
  ].map(user => ({ subject: r.uuid(), ...user }));
  const accounts = [...staff, ...patients.map(p => ({ subject: p.subject, username: p.username, displayName: p.patientName, role: "patient", app: "junctura-myhealth" }))];

  const strip = ({ username, ...patient }) => patient;
  return {
    "clinic.json": { referenceDate: REFERENCE_DATE, facility: CLINIC, patients: patients.map(strip), referrals: referrals.map(x => ({ ...x, fromFacility: CLINIC })) },
    "hospital.json": { referenceDate: REFERENCE_DATE, facility: HOSPITAL, prescriptions, claims },
    "insurance.json": { referenceDate: REFERENCE_DATE, claimRequests: requests },
    "accounts.json": { referenceDate: REFERENCE_DATE, note: "Demo accounts only. Passwords are never stored here; the demo stack sets them from .env.", users: accounts },
  };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}\.\d{3}Z)?$/;
/** Shifts every date in a dataset by the same number of days so its reference date becomes `today` (YYYY-MM-DD). */
export function rebase(dataset, today) {
  const delta = Math.round((Date.parse(`${today}T00:00:00.000Z`) - Date.parse(`${dataset.referenceDate}T00:00:00.000Z`)) / DAY);
  if (!Number.isInteger(delta)) throw new TypeError("today must be YYYY-MM-DD");
  const walk = value => {
    if (typeof value === "string" && ISO_DATE.test(value)) {
      const shifted = new Date(Date.parse(value.length === 10 ? `${value}T00:00:00.000Z` : value) + delta * DAY).toISOString();
      return value.length === 10 ? shifted.slice(0, 10) : shifted;
    }
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v)]));
    return value;
  };
  return walk(dataset);
}

/**
 * Replaces seeded subjects with the ones the identity provider actually issued
 * (`mapping`: seeded subject -> real subject). Unmapped subjects stay as they are.
 */
export function withSubjects(dataset, mapping) {
  const walk = value => {
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, key === "subject" && typeof v === "string" ? mapping[v] ?? v : walk(v)]));
    }
    return value;
  };
  return walk(dataset);
}

export const serialize = value => `${JSON.stringify(value, null, 2)}\n`;
export const loadData = name => JSON.parse(readFileSync(new URL(name, DATA), "utf8"));

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const check = process.argv.includes("--check");
  let stale = 0;
  for (const [name, value] of Object.entries(generate())) {
    const url = new URL(name, DATA), text = serialize(value);
    if (check) {
      let current = ""; try { current = readFileSync(url, "utf8"); } catch {}
      if (current !== text) { console.error(`✖ seed/data/${name} is out of date: run npm run seed:generate`); stale++; }
    } else {
      writeFileSync(url, text);
      console.log(`✔ seed/data/${name}`);
    }
  }
  if (stale) process.exitCode = 1;
  else if (check) console.log("✔ Synthetic data is up to date");
}
