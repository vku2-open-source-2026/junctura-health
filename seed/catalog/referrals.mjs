// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

// Reasons a commune station refers a patient to hospital.
export const REFERRALS = [
  { reason: "Đau ngực tái diễn, cần đánh giá tim mạch chuyên sâu", diagnosis: { code: "I20.9", name: "Cơn đau thắt ngực" }, treatment: "Nitroglycerin ngậm dưới lưỡi 0,5 mg; theo dõi huyết áp 30 phút", urgency: "urgent" },
  { reason: "Đường huyết không kiểm soát dù đã điều trị", diagnosis: { code: "E11.6", name: "Đái tháo đường type 2 có biến chứng" }, treatment: "Tư vấn chế độ ăn; tăng liều Metformin", urgency: "routine" },
  { reason: "Khó thở tăng dần, SpO2 92%", diagnosis: { code: "J44.1", name: "Đợt cấp bệnh phổi tắc nghẽn mạn tính" }, treatment: "Khí dung Salbutamol 5 mg; thở oxy 2 lít/phút", urgency: "emergency" },
  { reason: "Đau khớp gối kéo dài, cần đánh giá phẫu thuật", diagnosis: { code: "M17.1", name: "Thoái hóa khớp gối nguyên phát" }, treatment: "Paracetamol; hướng dẫn tập vận động", urgency: "routine" },
];
