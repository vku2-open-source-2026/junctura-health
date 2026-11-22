// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// The two people the demo script follows; they also match contracts/examples.
import { ALLERGIES } from "./catalog/index.mjs";

export const AN = {
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
export const BINH = {
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
