// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { REFERRALS } from "../seed/catalog/referrals.mjs";
import { VISITS } from "../seed/catalog/visits.mjs";

// What `CollectionSchemaWrite` and the record store accept (see .orchestrator/ref/schemas).
const BODY_KEYS = new Set(["schema", "indexed", "uniqueKey", "searchable", "sensitive"]);
const KEYWORDS = new Set(["type", "required", "properties", "enum", "minLength", "maxLength", "pattern", "minimum", "maximum", "items", "format"]);
const TYPES = new Set(["object", "array", "string", "number", "integer", "boolean", "null"]);
const FORMATS = new Set(["date", "date-time"]);
// Unique-key values must match ^[A-Za-z0-9_-]{1,128}$, so the field itself must be a string.
const KEY_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const UNIQUE_TYPES = new Set(["string"]);

const APPS = {
  registry: ["patients", "icd10", "drugs", "vaccines", "service_prices"],
  clinic: ["clinic_patients", "clinic_encounters", "clinic_conditions", "clinic_allergies", "clinic_medications", "clinic_vaccinations", "clinic_queue", "clinic_referrals", "clinic_settings"],
  hospital: ["hospital_admissions_v1", "hospital_costs_v1", "hospital_emergency_requests_v1", "hospital_exam_notes_v1", "hospital_prescriptions_v1"],
  pharmacy: ["dispensations", "settings", "stock-receipts"],
  insurance: ["insurance_claims", "checks", "decisions", "settlements"],
  myhealth: ["myhealth_profiles"],
};
const EXPECTED = new Set(Object.entries(APPS).flatMap(([app, names]) => names.map(name => `${app}/${name}`)));

const walk = (node, path, errors) => {
  if (typeof node !== "object" || node === null || Array.isArray(node)) {
    errors.push(`${path}: not a schema object`);
    return;
  }
  for (const key of Object.keys(node)) {
    if (!KEYWORDS.has(key)) errors.push(`${path}: unsupported keyword "${key}"`);
  }
  if (node.type !== undefined && !TYPES.has(node.type)) errors.push(`${path}: unknown type "${node.type}"`);
  if (node.format !== undefined && !FORMATS.has(node.format)) errors.push(`${path}: unsupported format "${node.format}"`);
  for (const key of ["required", "enum"]) {
    if (node[key] !== undefined && !Array.isArray(node[key])) errors.push(`${path}.${key}: not an array`);
  }
  // Nested `required` lists count too: every name must be declared among the same node's properties.
  for (const field of node.required ?? []) {
    if (!(field in (node.properties ?? {}))) errors.push(`${path}: required field "${field}" is not declared in properties`);
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === "properties") {
      if (typeof value !== "object" || value === null || Array.isArray(value)) errors.push(`${path}.properties: not an object`);
      else for (const [field, child] of Object.entries(value)) walk(child, `${path}.properties.${field}`, errors);
    } else if (key === "items") {
      walk(value, `${path}.items`, errors);
    }
  }
};

const check = file => {
  const body = JSON.parse(readFileSync(new URL(`../schemas/${file}.json`, import.meta.url), "utf8"));
  assert.deepEqual(Object.keys(body).filter(key => !BODY_KEYS.has(key)), [], `${file}: unexpected top-level keys`);
  for (const key of ["schema", "indexed", "searchable", "sensitive"]) assert.ok(key in body, `${file}: missing ${key}`);
  assert.ok("uniqueKey" in body, `${file}: missing uniqueKey`);
  const schema = body.schema;
  assert.equal(schema.type, "object", `${file}: schema.type`);
  const properties = schema.properties ?? {};
  for (const key of ["indexed", "searchable", "sensitive"]) {
    assert.ok(Array.isArray(body[key]), `${file}: ${key} is not an array`);
    assert.equal(new Set(body[key]).size, body[key].length, `${file}: duplicate entries in ${key}`);
    for (const field of body[key]) assert.ok(field in properties, `${file}: ${key} field "${field}" is not declared in schema.properties`);
  }
  const errors = [];
  walk(schema, file, errors);
  assert.deepEqual(errors, [], `${file}: schema keywords`);
  if (body.uniqueKey !== null) {
    assert.equal(typeof body.uniqueKey, "string", `${file}: uniqueKey`);
    assert.ok(body.uniqueKey in properties, `${file}: uniqueKey field "${body.uniqueKey}" is not declared in schema.properties`);
    assert.equal(properties[body.uniqueKey].type, "string", `${file}: uniqueKey must be a string field`);
    assert.ok((schema.required ?? []).includes(body.uniqueKey), `${file}: uniqueKey must be required`);
    assert.ok(body.indexed.includes(body.uniqueKey), `${file}: uniqueKey must be indexed`);
  }
  return body;
};

// Minimal validator over the supported keywords, to check app-shaped fixture records.
const typeOf = value => (value === null ? "null" : Array.isArray(value) ? "array" : typeof value);
const fitsType = (declared, value) => declared === "integer"
  ? typeof value === "number" && Number.isInteger(value)
  : typeOf(value) === declared;

const validateNode = (node, value, path, errors) => {
  if (node.type !== undefined && !fitsType(node.type, value)) {
    errors.push(`${path}: expected ${node.type}, got ${typeOf(value)}`);
    return;
  }
  if (node.enum !== undefined && !node.enum.includes(value)) errors.push(`${path}: value outside enum`);
  if (typeof value === "string") {
    if (node.minLength !== undefined && value.length < node.minLength) errors.push(`${path}: shorter than minLength`);
    if (node.maxLength !== undefined && value.length > node.maxLength) errors.push(`${path}: longer than maxLength`);
    if (node.format === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) errors.push(`${path}: not a date`);
    if (node.format === "date-time" && Number.isNaN(Date.parse(value))) errors.push(`${path}: not a date-time`);
  }
  if (typeof value === "number") {
    if (node.minimum !== undefined && value < node.minimum) errors.push(`${path}: below minimum`);
    if (node.maximum !== undefined && value > node.maximum) errors.push(`${path}: above maximum`);
  }
  if (Array.isArray(value) && node.items) {
    value.forEach((item, index) => validateNode(node.items, item, `${path}[${index}]`, errors));
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    for (const field of node.required ?? []) {
      if (!(field in value)) errors.push(`${path}: missing required field "${field}"`);
    }
    for (const [field, child] of Object.entries(node.properties ?? {})) {
      if (field in value) validateNode(child, value[field], `${path}.${field}`, errors);
    }
  }
};

test("every expected collection has one schema file, no extras, no duplicates per app", () => {
  const found = new Set();
  for (const app of readdirSync(new URL("../schemas/", import.meta.url), { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name)) {
    const names = readdirSync(new URL(`../schemas/${app}/`, import.meta.url)).filter(name => name.endsWith(".json")).map(name => name.replace(/\.json$/, ""));
    assert.deepEqual(new Set(names).size, names.length, `${app}: duplicate collection file`);
    for (const name of names) found.add(`${app}/${name}`);
  }
  assert.deepEqual([...found].filter(file => !EXPECTED.has(file)), [], "unexpected schema files");
  assert.deepEqual([...EXPECTED].filter(file => !found.has(file)), [], "missing schema files");
});

test("schema files are valid CollectionSchemaWrite bodies", () => {
  for (const file of EXPECTED) check(file);
});

test("app record fixtures validate against their collection schema", () => {
  const subject = "525fd3dc-fa8c-4472-9c8d-2359aa031f40";
  const actor = { subject: "d290f1ee-6c54-4b01-90e6-d701748f0851", displayName: "Bs. Nguyễn Văn An" };
  const justification = "Người bệnh đang sốc phản vệ, cần danh mục dị ứng ngay.";
  const emergencyBase = {
    kind: "hospital-emergency-request/v1",
    operationId: "9f0d4b2e-1a34-4c56-9d8e-2b7f6a5c4e31",
    patientSubject: subject,
    capability: "allergy-list",
    justification,
    createdBy: actor,
  };
  const fixtures = [
    {
      file: "hospital/hospital_admissions_v1",
      record: {
        kind: "hospital-admission/v1",
        operationId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
        patientSubject: subject,
        patientName: "Nguyễn Văn An",
        birthYear: null,
        sex: "male",
        referralId: "CT-2026-000001",
        urgency: "urgent",
        fromFacility: "Trạm Y tế Hoà Khánh Bắc",
        toFacility: "Bệnh viện Đa khoa",
        workflowId: "wf-3f2504e0",
        definitionId: "def-3f2504e0",
        createdBy: actor,
      },
    },
    {
      file: "hospital/hospital_costs_v1",
      record: {
        kind: "hospital-cost/v1",
        requestId: "4a1b2c3d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
        admissionId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
        noteId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        patientSubject: subject,
        patientName: "Nguyễn Văn An",
        birthYear: null,
        sex: "male",
        claimId: "HS-2026-00990",
        items: [{ description: "Khám bệnh", quantity: 1, unitPriceVnd: 200000 }],
        amountVnd: 200000,
        insuranceStatus: "not-reported",
        confirmed: true,
        createdBy: actor,
      },
    },
    {
      file: "hospital/hospital_prescriptions_v1",
      record: {
        kind: "hospital-prescription/v1",
        requestId: "4a1b2c3d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
        admissionId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
        noteId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        items: [{ name: "Paracetamol", strength: "500 mg", quantity: 10, instructions: "Uống 1 viên x 3 lần/ngày" }],
        validDays: 5,
        reviewConfirmed: true,
        overrideReason: "",
        patientSubject: subject,
        patientName: "Nguyễn Văn An",
        birthYear: null,
        sex: "male",
        prescriptionCode: "DT-2026-004529",
        issuedAt: "2026-11-20T08:00:00.000Z",
        expiresAt: "2026-11-25T08:00:00.000Z",
        dispensed: false,
        createdBy: actor,
        allergyReview: {
          executionId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
          updatedAt: "2026-11-20T07:00:00.000Z",
          state: "recorded",
          checkedAt: "2026-11-20T08:00:00.000Z",
          conflicts: [],
          stale: false,
        },
      },
    },
    // The emergency record in its two states: fresh (both null) and after the updates.
    { file: "hospital/hospital_emergency_requests_v1", record: { ...emergencyBase, executionId: null, endedAt: null } },
    { file: "hospital/hospital_emergency_requests_v1", record: { ...emergencyBase, executionId: "e110e6d8-2b1a-4c3d-9e5f-6a7b8c9d0e1f", endedAt: "2026-11-20T08:05:00.000Z" } },
  ];
  for (const { file, record } of fixtures) {
    const body = check(file);
    const errors = [];
    validateNode(body.schema, record, file, errors);
    assert.deepEqual(errors, [], `${file}: fixture record`);
  }
});

test("unique-key values taken from records fit the core key pattern", () => {
  const samples = [
    { file: "registry/patients", record: { patientId: "P0001" } },
    { file: "registry/vaccines", record: { code: "112" } },
    { file: "clinic/clinic_patients", record: { patientId: "P0001" } },
    { file: "clinic/clinic_referrals", record: { referralId: "CT-2026-000001" } },
    { file: "clinic/clinic_settings", record: { key: "aiSummary" } },
    { file: "hospital/hospital_admissions_v1", record: { operationId: "3f2504e0-4f89-11d3-9a0c-0305e82c3301" } },
    { file: "hospital/hospital_costs_v1", record: { requestId: "4a1b2c3d-5e6f-4a7b-8c9d-0e1f2a3b4c5d" } },
    { file: "hospital/hospital_exam_notes_v1", record: { requestId: "4a1b2c3d-5e6f-4a7b-8c9d-0e1f2a3b4c5d" } },
    { file: "hospital/hospital_prescriptions_v1", record: { requestId: "4a1b2c3d-5e6f-4a7b-8c9d-0e1f2a3b4c5d" } },
    { file: "hospital/hospital_emergency_requests_v1", record: { operationId: "9f0d4b2e-1a34-4c56-9d8e-2b7f6a5c4e31" } },
    { file: "insurance/settlements", record: { settlementId: "TT-2026-000001" } },
    { file: "myhealth/myhealth_profiles", record: { subject: "525fd3dc-fa8c-4472-9c8d-2359aa031f40" } },
  ];
  for (const { file, record } of samples) {
    const body = check(file);
    assert.ok(body.uniqueKey, `${file}: uniqueKey set`);
    const value = record[body.uniqueKey];
    assert.equal(typeof value, "string", `${file}: sample carries the key field "${body.uniqueKey}"`);
    assert.match(value, KEY_PATTERN, `${file}: uniqueKey value`);
  }
  const claims = JSON.parse(readFileSync(new URL("../seed/data/insurance.json", import.meta.url), "utf8")).claimRequests;
  const claimsBody = check("insurance/insurance_claims");
  for (const claim of claims) assert.match(claim[claimsBody.uniqueKey], KEY_PATTERN, "insurance_claims: claimId value");
  const prescriptions = JSON.parse(readFileSync(new URL("../seed/data/hospital.json", import.meta.url), "utf8")).prescriptions;
  // The seed holds the contract projection: `prescriptionCode`, derived from the stored record's `requestId`.
  for (const item of prescriptions) assert.match(item.prescriptionCode, KEY_PATTERN, "hospital_prescriptions_v1: prescriptionCode value");
});

test("dotted ICD-10 codes stay legal, so icd10 keeps no unique key", () => {
  const body = check("registry/icd10");
  assert.equal(body.uniqueKey, null);
  assert.ok(body.indexed.includes("code"));
  const codes = [...VISITS, ...REFERRALS].map(item => item.diagnosis?.code).filter(Boolean);
  assert.ok(codes.some(code => code.includes(".")), "seed holds dotted ICD-10 codes");
  for (const code of codes) {
    if (code.includes(".")) assert.ok(!KEY_PATTERN.test(code), "dotted codes cannot be core unique-key values");
  }
  const errors = [];
  validateNode(body.schema, { code: "J06.9", name: "Nhiễm trùng đường hô hấp trên cấp" }, "registry/icd10", errors);
  assert.deepEqual(errors, [], "dotted code passes the icd10 schema");
});

// Fields the review marked as must-carry the `sensitive` label.
const REQUIRED_SENSITIVE = {
  "registry/patients": ["patientId", "subject", "patientName", "birthYear", "sex", "ward", "phone", "insuranceNo"],
  "clinic/clinic_patients": ["patientId", "subject", "patientName", "birthYear", "sex", "ward", "phone", "insuranceNo", "noKnownAllergies"],
  "clinic/clinic_encounters": ["patientId", "date", "reason", "diagnosis", "vitals", "notes", "advice", "prescriptions", "by"],
  "clinic/clinic_vaccinations": ["patientId", "vaccine", "code", "date", "doseNumber", "lot", "by"],
  "clinic/clinic_queue": ["patientId", "reason", "by"],
  "clinic/clinic_referrals": ["referralId", "patientId", "reason", "provisionalDiagnosis", "treatmentGiven", "by"],
  "hospital/hospital_admissions_v1": ["patientSubject", "patientName", "birthYear", "sex", "referralId", "createdBy"],
  "hospital/hospital_costs_v1": ["patientSubject", "patientName", "birthYear", "sex", "items", "amountVnd", "claimId", "admissionId", "noteId", "createdBy"],
  "hospital/hospital_exam_notes_v1": ["patientSubject", "reason", "findings", "diagnosis", "plan", "admissionId", "createdBy"],
  "hospital/hospital_prescriptions_v1": ["patientSubject", "patientName", "birthYear", "sex", "items", "overrideReason", "allergyReview", "prescriptionCode", "admissionId", "noteId", "createdBy"],
  "hospital/hospital_emergency_requests_v1": ["patientSubject", "justification", "createdBy"],
  "pharmacy/dispensations": ["prescriptionCode", "items", "reason"],
  "insurance/insurance_claims": ["subject", "requestedAmountVnd"],
  "insurance/checks": ["claimId", "assessor", "assessorName"],
  "insurance/decisions": ["claimId", "amountVnd", "assessor", "assessorName", "reason"],
  "insurance/settlements": ["claimIds", "createdBy", "createdByName"],
  "myhealth/myhealth_profiles": ["subject", "contactName", "contactPhone", "bloodType", "note"],
};

test("required sensitive labels are present", () => {
  for (const [file, labels] of Object.entries(REQUIRED_SENSITIVE)) {
    const body = check(file);
    const missing = labels.filter(label => !body.sensitive.includes(label));
    assert.deepEqual(missing, [], `${file}: fields missing the sensitive label`);
  }
});

test("indexed fields never include free-text sensitive fields", () => {
  const FREE_TEXT = ["patientName", "reason", "notes", "advice", "findings", "plan", "reaction", "justification", "note", "treatmentGiven"];
  for (const file of EXPECTED) {
    const body = check(file);
    const overlap = body.indexed.filter(field => body.sensitive.includes(field) && FREE_TEXT.includes(field));
    assert.deepEqual(overlap, [], `${file}: free-text sensitive fields indexed`);
  }
});
