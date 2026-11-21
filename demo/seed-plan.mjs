// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// What the demo seed writes, derived from the synthetic data in seed/data/.
// Pure data and functions (no network, no files, no secrets) so the plan is
// testable; demo/seed.mjs applies it to a running Junctura stack through each
// application's own credentials. Reruns are safe: records are keyed by a
// stable `ma` field, documents by a UUID derived from (tenant, app, code) and
// workflow starts by an idempotency key derived from (tenant, item.key).
import { createHash } from "node:crypto";

export const DEFAULT_TENANT = "production";

// The applications that own seeded data; pharmacy already keeps its own data.
export const SEED_APPS = Object.freeze(["junctura-clinic", "junctura-hospital", "junctura-insurance"]);

/** A lowercase UUID derived from the scope and parts (SHA-256, UUID v5 shape). */
export function stableUuid(scope, ...parts) {
  const hex = createHash("sha256").update([scope, ...parts].join(":")).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export const objectUuid = (tenant, app, code) => stableUuid("object", tenant, app, code);
export const workflowIdempotencyKey = (tenant, key) => stableUuid("workflow", tenant, key);

// The standard harmless antivirus test string, assembled from two halves at
// runtime like the old seed so scanners do not flag the source file. It proves
// the quarantine path rejects unscanned bytes; a 422 malware_detected is the
// expected outcome, never an error.
export function eicarTestBytes() {
  return Buffer.from([
    "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR",
    "-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",
  ].join(""), "ascii");
}

export const EICAR_CODE = "kiem-thu-cach-ly-eicar";
const FICTIONAL_NOTE = "Ghi chú: Dữ liệu hư cấu dùng cho bối cảnh trình diễn Junctura Health.";

/** Every seeded record collection: which application owns it, where the rows come from and its stable code field. */
export const RECORD_PLAN = Object.freeze([
  { app: "junctura-clinic", dataset: "clinic", list: "patients", collection: "benh-nhan", ma: row => row.patientId },
  { app: "junctura-clinic", dataset: "clinic", list: "referrals", collection: "chuyen-tuyen", ma: row => row.referralId },
  { app: "junctura-hospital", dataset: "hospital", list: "prescriptions", collection: "don-thuoc", ma: row => row.prescriptionCode },
  { app: "junctura-hospital", dataset: "hospital", list: "claims", collection: "chi-phi-dieu-tri", ma: row => row.claimId },
  { app: "junctura-insurance", dataset: "insurance", list: "claimRequests", collection: "yeu-cau-thanh-toan", ma: row => row.claimId },
]);

const dayOf = iso => (typeof iso === "string" ? iso.slice(0, 10) : "");
const money = value => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

function referralDocument(referral, patient) {
  return [
    "GIẤY CHUYỂN TUYẾN",
    `Số: ${referral.referralId}`,
    "",
    `Cơ sở gửi: ${referral.fromFacility}`,
    `Cơ sở nhận: ${referral.toFacility}`,
    "",
    `Họ tên người bệnh: ${patient.patientName}`,
    `Mã người bệnh: ${patient.patientId}`,
    `Năm sinh: ${patient.birthYear}`,
    "",
    `Chẩn đoán sơ bộ: ${referral.provisionalDiagnosis.code} ${referral.provisionalDiagnosis.name}`,
    `Lý do chuyển: ${referral.reason}`,
    `Xử trí đã làm: ${referral.treatmentGiven}`,
    `Mức độ ưu tiên: ${referral.urgency}`,
    `Ngày chuyển: ${dayOf(referral.issuedAt)}`,
    "",
    FICTIONAL_NOTE,
    "",
  ].join("\n");
}

function prescriptionDocument(prescription, patient) {
  return [
    "ĐƠN THUỐC",
    `Mã đơn: ${prescription.prescriptionCode}`,
    "",
    `Họ tên người bệnh: ${patient.patientName}`,
    `Mã người bệnh: ${patient.patientId}`,
    `Ngày kê: ${dayOf(prescription.issuedAt)}`,
    `Hạn dùng: ${dayOf(prescription.expiresAt)}`,
    "",
    ...prescription.items.map(item => `- ${item.name} ${item.strength} — ${item.quantity} (${item.instructions})`),
    "",
    FICTIONAL_NOTE,
    "",
  ].join("\n");
}

function laboratoryDocument(patient) {
  return [
    "KẾT QUẢ XÉT NGHIỆM",
    `Mã người bệnh: ${patient.patientId}`,
    `Năm sinh: ${patient.birthYear}`,
    "",
    "Chỉ số minh hoạ: huyết sắc tố 132 g/L; bạch cầu 6,4 G/L; tiểu cầu 248 G/L.",
    "",
    FICTIONAL_NOTE,
    "",
  ].join("\n");
}

function claimRequestDocument(request) {
  return [
    "YÊU CẦU THANH TOÁN BẢO HIỂM",
    `Mã hồ sơ: ${request.claimId}`,
    `Ngày nộp: ${dayOf(request.submittedAt)}`,
    `Số tiền yêu cầu: ${money(request.requestedAmountVnd)} VND`,
    "",
    FICTIONAL_NOTE,
    "",
  ].join("\n");
}

const LAB_PATIENTS = 2;
const patientBySubject = datasets => {
  const patients = new Map(datasets.clinic.patients.map(row => [row.subject, row]));
  return row => {
    const patient = patients.get(row.subject);
    if (!patient) throw new Error(`Thiếu người bệnh cho ${row.subject}`);
    return patient;
  };
};

/**
 * Record plan grouped by application and collection. Referral records carry the
 * stable object UUID of their transfer document so an application can link them.
 */
export function plannedRecords(datasets, tenant = DEFAULT_TENANT) {
  return RECORD_PLAN.map(entry => {
    const rows = datasets[entry.dataset]?.[entry.list];
    if (!Array.isArray(rows)) throw new Error(`Thiếu dữ liệu ${entry.dataset}.${entry.list}`);
    const records = rows.map(row => ({
      ma: entry.ma(row),
      data: { ma: entry.ma(row), ...row,
        ...(entry.collection === "chuyen-tuyen" ? { taiLieu: objectUuid(tenant, entry.app, entry.ma(row)) } : {}) },
    }));
    return { ...entry, records };
  });
}

/** Document plan: one stable UUID and fixed bytes per (tenant, app, code). */
export function plannedDocuments(datasets, tenant = DEFAULT_TENANT) {
  const patientOf = patientBySubject(datasets);
  const documents = [];
  for (const referral of datasets.clinic.referrals) {
    const patient = patientOf(referral);
    documents.push({ app: "junctura-clinic", kind: "chuyen-tuyen", code: referral.referralId,
      uuid: objectUuid(tenant, "junctura-clinic", referral.referralId),
      bytes: Buffer.from(referralDocument(referral, patient), "utf8") });
  }
  for (const prescription of datasets.hospital.prescriptions) {
    const patient = patientOf(prescription);
    documents.push({ app: "junctura-hospital", kind: "don-thuoc", code: prescription.prescriptionCode,
      uuid: objectUuid(tenant, "junctura-hospital", prescription.prescriptionCode),
      bytes: Buffer.from(prescriptionDocument(prescription, patient), "utf8") });
  }
  for (const patient of datasets.clinic.patients.slice(0, LAB_PATIENTS)) {
    documents.push({ app: "junctura-hospital", kind: "xet-nghiem", code: patient.patientId,
      uuid: objectUuid(tenant, "junctura-hospital", patient.patientId),
      bytes: Buffer.from(laboratoryDocument(patient), "utf8") });
  }
  for (const request of datasets.insurance.claimRequests) {
    documents.push({ app: "junctura-insurance", kind: "yeu-cau-thanh-toan", code: request.claimId,
      uuid: objectUuid(tenant, "junctura-insurance", request.claimId),
      bytes: Buffer.from(claimRequestDocument(request), "utf8") });
  }
  // One file that ClamAV always quarantines, sent through the clinic application
  // so the Console shows the isolation path. Expected: 422 malware_detected.
  documents.push({ app: "junctura-clinic", kind: "eicar", code: EICAR_CODE,
    uuid: objectUuid(tenant, "junctura-clinic", EICAR_CODE), bytes: eicarTestBytes() });
  return documents;
}

const WORKFLOW_PLAN = Object.freeze([
  { key: "chuyen-tuyen-01", definitionKey: "junctura_chuyen_tuyen", outcome: "pending", type: "referral", index: 0 },
  { key: "chuyen-tuyen-02", definitionKey: "junctura_chuyen_tuyen", outcome: "approved", type: "referral", index: 1 },
  { key: "chuyen-tuyen-03", definitionKey: "junctura_chuyen_tuyen", outcome: "rejected", type: "referral", index: 2 },
  { key: "chuyen-tuyen-04", definitionKey: "junctura_chuyen_tuyen", outcome: "pending", type: "referral", index: 3 },
  { key: "don-thuoc-01", definitionKey: "junctura_xac_minh_don_thuoc", outcome: "pending", type: "prescription", index: 0 },
  { key: "don-thuoc-02", definitionKey: "junctura_xac_minh_don_thuoc", outcome: "approved", type: "prescription", index: 1 },
  { key: "don-thuoc-03", definitionKey: "junctura_xac_minh_don_thuoc", outcome: "approved", type: "prescription", index: 2 },
  { key: "chi-phi-01", definitionKey: "junctura_xac_minh_chi_phi", outcome: "pending", type: "claim", index: 4 },
  { key: "chi-phi-02", definitionKey: "junctura_xac_minh_chi_phi", outcome: "approved", type: "claim", index: 5 },
]);

const WORKFLOW_APPS = Object.freeze({
  referral: "junctura-clinic", prescription: "junctura-hospital", claim: "junctura-insurance",
});

const referralInput = (referral, patient) => ({
  loai: "chuyen-tuyen", ma_ho_so: referral.referralId, ma_benh_nhan: patient.patientId,
  ho_ten_benh_nhan: patient.patientName, co_so_gui: referral.fromFacility, co_so_nhan: referral.toFacility,
  chan_doan: `${referral.provisionalDiagnosis.code} ${referral.provisionalDiagnosis.name}`,
  ly_do: referral.reason, muc_do_uu_tien: referral.urgency, ngay_tao: dayOf(referral.issuedAt),
});

const prescriptionInput = (prescription, patient) => ({
  loai: "xac-minh-don-thuoc", ma_ho_so: prescription.prescriptionCode, ma_benh_nhan: patient.patientId,
  ho_ten_benh_nhan: patient.patientName, so_thuoc: prescription.items.length, ngay_ke: dayOf(prescription.issuedAt),
});

const claimInput = request => ({
  loai: "xac-minh-chi-phi", ma_ho_so: request.claimId, so_tien_yeu_cau: request.requestedAmountVnd,
  ngay_tao: dayOf(request.submittedAt),
});

/**
 * Workflow items after the old workflowSeedItems: some wait, some are approved
 * (completed) and some rejected (cancelled). Each is started by the application
 * that owns the underlying business flow, with a stable idempotency key.
 */
export function plannedWorkflowItems(datasets, tenant = DEFAULT_TENANT) {
  const patientOf = patientBySubject(datasets);
  return WORKFLOW_PLAN.map(item => {
    const app = WORKFLOW_APPS[item.type];
    if (!app) throw new Error(`Loại hồ sơ quy trình không rõ: ${item.type}`);
    let source, input;
    if (item.type === "referral") {
      source = datasets.clinic.referrals[item.index];
      if (!source) throw new Error(`Thiếu dữ liệu nguồn cho ${item.key}`);
      input = referralInput(source, patientOf(source));
    } else if (item.type === "prescription") {
      source = datasets.hospital.prescriptions[item.index];
      if (!source) throw new Error(`Thiếu dữ liệu nguồn cho ${item.key}`);
      input = prescriptionInput(source, patientOf(source));
    } else {
      source = datasets.insurance.claimRequests[item.index];
      if (!source) throw new Error(`Thiếu dữ liệu nguồn cho ${item.key}`);
      input = claimInput(source);
    }
    return { ...item, app, input, idempotencyKey: workflowIdempotencyKey(tenant, item.key) };
  });
}

/** The dry-run plan as text lines: counts per application, nothing from the network. */
export function dryRunPlan(datasets, tenant = DEFAULT_TENANT) {
  const lines = [`Kế hoạch nạp dữ liệu demo (tenant ${tenant}, không gọi mạng):`];
  let records = 0, files = 0, workflows = 0;
  for (const app of SEED_APPS) {
    lines.push(app);
    for (const entry of plannedRecords(datasets, tenant).filter(entry => entry.app === app)) {
      lines.push(`  ${entry.collection}: ${entry.records.length} bản ghi (khóa theo trường ma)`);
      records += entry.records.length;
    }
    const documents = plannedDocuments(datasets, tenant).filter(document => document.app === app);
    const kinds = new Map();
    for (const document of documents) kinds.set(document.kind, (kinds.get(document.kind) ?? 0) + 1);
    for (const [kind, count] of kinds) {
      lines.push(`  tài liệu ${kind}: ${count} tệp${kind === "eicar" ? " (thử cách ly, mong đợi 422 malware_detected)" : ""}`);
    }
    files += documents.length;
    const items = plannedWorkflowItems(datasets, tenant).filter(item => item.app === app);
    const definitions = new Map();
    for (const item of items) definitions.set(item.definitionKey, (definitions.get(item.definitionKey) ?? 0) + 1);
    for (const [definition, count] of definitions) lines.push(`  quy trình ${definition}: ${count} hồ sơ`);
    workflows += items.length;
  }
  lines.push(`Tổng: ${records} bản ghi, ${files} tệp, ${workflows} hồ sơ quy trình.`);
  return lines;
}
