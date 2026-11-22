// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

// Chronic conditions with the usual long-term treatment at a commune health station.
export const CONDITIONS = [
  { code: "I10", name: "Tăng huyết áp vô căn", medication: { name: "Amlodipin", dose: "5 mg x 1 lần/ngày" }, minAge: 35 },
  { code: "E11", name: "Đái tháo đường type 2", medication: { name: "Metformin", dose: "500 mg x 2 lần/ngày" }, minAge: 35 },
  { code: "E78", name: "Rối loạn lipid máu", medication: { name: "Atorvastatin", dose: "20 mg x 1 lần/ngày, uống buổi tối" }, minAge: 35 },
  { code: "J45", name: "Hen phế quản", medication: { name: "Salbutamol xịt", dose: "2 nhát khi khó thở" }, minAge: 5 },
  { code: "K21", name: "Trào ngược dạ dày thực quản", medication: { name: "Omeprazol", dose: "20 mg x 1 lần/ngày trước ăn sáng" }, minAge: 18 },
  { code: "M17", name: "Thoái hóa khớp gối", medication: { name: "Paracetamol", dose: "500 mg khi đau, tối đa 4 lần/ngày" }, minAge: 50 },
  { code: "J44", name: "Bệnh phổi tắc nghẽn mạn tính", medication: { name: "Tiotropium hít", dose: "1 lần/ngày" }, minAge: 50 },
];
