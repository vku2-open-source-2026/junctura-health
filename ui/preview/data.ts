// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Synthetic data for the preview only.
import type { AllergyState } from "../src";

export interface DemoPatient {
  id: string; name: string; birthYear: number; sex: "male" | "female"; phone: string; ward: string;
  allergy: { state: AllergyState; items?: string[] }; conditions: string[]; meds: string[]; lastVisit: string;
}

export const PATIENTS: DemoPatient[] = [
  { id: "HS-0001", name: "Nguyễn Văn An", birthYear: 1962, sex: "male", phone: "0912 345 678", ward: "Hoà Mỹ", allergy: { state: "recorded", items: ["Penicillin", "Tôm"] }, conditions: ["Tăng huyết áp", "Đái tháo đường type 2"], meds: ["Amlodipine 5 mg, 1 viên sáng", "Metformin 500 mg, 2 lần/ngày"], lastVisit: "2026-10-30" },
  { id: "HS-0002", name: "Trần Thị Bình", birthYear: 1989, sex: "female", phone: "0934 111 222", ward: "Hoà Mỹ", allergy: { state: "none-known" }, conditions: ["Hen phế quản nhẹ"], meds: ["Salbutamol xịt khi cần"], lastVisit: "2026-09-02" },
  { id: "HS-0003", name: "Lê Hoàng Cường", birthYear: 2021, sex: "male", phone: "0987 654 321", ward: "An Hải", allergy: { state: "not-recorded" }, conditions: [], meds: [], lastVisit: "2026-11-05" },
  { id: "HS-0004", name: "Phạm Thu Dung", birthYear: 1951, sex: "female", phone: "0905 777 888", ward: "An Hải", allergy: { state: "recorded", items: ["Sulfonamide"] }, conditions: ["Loãng xương", "Suy tim độ II"], meds: ["Furosemide 40 mg", "Calcium D3"], lastVisit: "2026-11-08" },
  { id: "HS-0005", name: "Võ Minh Em", birthYear: 2019, sex: "female", phone: "0911 000 123", ward: "Hoà Mỹ", allergy: { state: "none-known" }, conditions: [], meds: [], lastVisit: "2026-08-20" },
  { id: "HS-0006", name: "Đặng Quốc Phong", birthYear: 1975, sex: "male", phone: "0966 222 333", ward: "Mỹ Khê", allergy: { state: "unavailable" }, conditions: ["Viêm dạ dày"], meds: ["Omeprazole 20 mg"], lastVisit: "2026-07-14" },
];

export const QUEUE = [
  { id: "q1", ticket: "A07", patientId: "HS-0004", priority: "elder" as const, minutes: 41, note: "Đau ngực nhẹ, khó thở khi nằm" },
  { id: "q2", ticket: "A08", patientId: "HS-0003", priority: "child" as const, minutes: 22, note: "Sốt 2 ngày" },
  { id: "q3", ticket: "A09", patientId: "HS-0002", priority: undefined, minutes: 9, note: "Tái khám hen" },
  { id: "q4", ticket: "A10", patientId: "HS-0006", priority: undefined, minutes: 4, note: "Đau thượng vị" },
];

export const VACCINES = [
  { id: "v1", name: "Sởi – Quai bị – Rubella (MMR)", dose: "Mũi 2", due: "2026-10-15", state: "overdue" as const },
  { id: "v2", name: "Cúm mùa", dose: "Hằng năm", due: "2026-11-20", state: "soon" as const },
  { id: "v3", name: "Viêm gan B", dose: "Mũi 3", due: "2026-03-02", state: "done" as const },
];

export const VISITS = [
  { id: "t1", time: "2026-10-30T02:15:00Z", title: "Khám tăng huyết áp", description: "HA 150/90, chỉnh liều Amlodipine. BS. Phạm Thu Hà", tone: "brand" as const },
  { id: "t2", time: "2026-08-12T07:40:00Z", title: "Tiêm vắc-xin cúm", description: "Lô FL-2208. Điều dưỡng Lê Thị Hoa", tone: "neutral" as const },
  { id: "t3", time: "2026-05-03T01:20:00Z", title: "Chuyển tuyến Bệnh viện Đà Nẵng", description: "Đau ngực, nghi hội chứng vành cấp. Đã tiếp nhận", tone: "warn" as const },
];

export const MEDICINES = [
  { value: "amlodipine", label: "Amlodipine 5 mg" },
  { value: "amoxicillin", label: "Amoxicillin 500 mg (nhóm penicillin)" },
  { value: "paracetamol", label: "Paracetamol 500 mg" },
];
