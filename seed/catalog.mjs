// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Vocabulary for the synthetic patients. Written by the team for this project;
// diagnosis codes are ICD-10 (WHO), vaccine codes CVX. No real person is described.

export const FAMILY = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
export const MIDDLE = { male: ["Văn", "Hữu", "Đức", "Minh", "Quốc", "Thanh", "Công"], female: ["Thị", "Ngọc", "Thu", "Thanh", "Mỹ", "Kim"] };
export const GIVEN = {
  male: ["Bảo", "Cường", "Dũng", "Hải", "Hùng", "Khoa", "Long", "Nam", "Phúc", "Quang", "Sơn", "Tài", "Tuấn", "Vinh", "Thắng", "Hiếu"],
  female: ["Anh", "Chi", "Dung", "Hà", "Hạnh", "Hoa", "Hương", "Lan", "Linh", "Mai", "Ngân", "Nhung", "Phương", "Thảo", "Trang", "Yến"],
};
export const WARDS = ["Hòa Khánh Bắc", "Hòa Minh", "Thanh Khê Đông", "Hải Châu", "An Hải", "Mỹ An", "Hòa Cường", "Khuê Trung"];

export const CLINIC = "Trạm Y tế phường Hòa Khánh Bắc";
export const HOSPITAL = "Bệnh viện Đà Nẵng";

export const ALLERGIES = [
  { substance: "Penicillin", severity: "severe", reaction: "Nổi mề đay, khó thở" },
  { substance: "Aspirin", severity: "moderate", reaction: "Phù mạch, sưng môi" },
  { substance: "Sulfamid", severity: "moderate", reaction: "Phát ban toàn thân" },
  { substance: "Hải sản", severity: "mild", reaction: "Ngứa, nổi mẩn" },
  { substance: "Ibuprofen", severity: "mild", reaction: "Đau thượng vị" },
];

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

export const VISITS = [
  { reason: "Sốt, ho, đau họng", diagnosis: { code: "J06.9", name: "Nhiễm trùng đường hô hấp trên cấp" } },
  { reason: "Đi ngoài phân lỏng nhiều lần", diagnosis: { code: "A09", name: "Tiêu chảy và viêm dạ dày ruột" } },
  { reason: "Đau thượng vị sau ăn", diagnosis: { code: "K29.7", name: "Viêm dạ dày" } },
  { reason: "Đau thắt lưng khi mang vác", diagnosis: { code: "M54.5", name: "Đau vùng thắt lưng" } },
  { reason: "Đau đầu, chóng mặt", diagnosis: { code: "R51", name: "Đau đầu" } },
  { reason: "Tái khám định kỳ", diagnosis: null },
];

export const VACCINES = [
  { vaccine: "Vắc xin uốn ván (VAT)", code: "112", doses: 3 },
  { vaccine: "Vắc xin cúm mùa", code: "141", doses: 1 },
  { vaccine: "Vắc xin viêm gan B", code: "43", doses: 3 },
  { vaccine: "Vắc xin COVID-19", code: "213", doses: 3 },
];

// Reasons a commune station refers a patient to hospital.
export const REFERRALS = [
  { reason: "Đau ngực tái diễn, cần đánh giá tim mạch chuyên sâu", diagnosis: { code: "I20.9", name: "Cơn đau thắt ngực" }, treatment: "Nitroglycerin ngậm dưới lưỡi 0,5 mg; theo dõi huyết áp 30 phút", urgency: "urgent" },
  { reason: "Đường huyết không kiểm soát dù đã điều trị", diagnosis: { code: "E11.6", name: "Đái tháo đường type 2 có biến chứng" }, treatment: "Tư vấn chế độ ăn; tăng liều Metformin", urgency: "routine" },
  { reason: "Khó thở tăng dần, SpO2 92%", diagnosis: { code: "J44.1", name: "Đợt cấp bệnh phổi tắc nghẽn mạn tính" }, treatment: "Khí dung Salbutamol 5 mg; thở oxy 2 lít/phút", urgency: "emergency" },
  { reason: "Đau khớp gối kéo dài, cần đánh giá phẫu thuật", diagnosis: { code: "M17.1", name: "Thoái hóa khớp gối nguyên phát" }, treatment: "Paracetamol; hướng dẫn tập vận động", urgency: "routine" },
];

// Short hospital courses after a referral.
export const HOSPITAL_DRUGS = [
  { name: "Clopidogrel", strength: "75 mg", quantity: 30, instructions: "Uống 1 viên/ngày sau ăn sáng" },
  { name: "Bisoprolol", strength: "2,5 mg", quantity: 30, instructions: "Uống 1 viên/ngày buổi sáng" },
  { name: "Gliclazid", strength: "30 mg", quantity: 30, instructions: "Uống 1 viên/ngày trước ăn sáng" },
  { name: "Budesonid/Formoterol hít", strength: "160/4,5 mcg", quantity: 1, instructions: "Hít 2 nhát x 2 lần/ngày" },
  { name: "Celecoxib", strength: "200 mg", quantity: 14, instructions: "Uống 1 viên/ngày sau ăn" },
  { name: "Amoxicillin", strength: "500 mg", quantity: 21, instructions: "Uống 1 viên x 3 lần/ngày" },
];
