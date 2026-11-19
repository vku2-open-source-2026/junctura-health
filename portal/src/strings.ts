// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

/** Every string shown by the portal, in plain Vietnamese for medical staff and administrators. */

export const strings = {
  app: {
    name: "Cổng Junctura Health",
    shortName: "Junctura Health",
    tagline: "Không gian năng lực y tế dùng chung",
    lead:
      "Trạm y tế, bệnh viện, nhà thuốc và bảo hiểm làm việc trên cùng một nền tảng: hợp đồng năng lực chung, quy trình nghiệp vụ chung và một thư viện giao diện chung. Mỗi cơ sở vẫn chạy ứng dụng riêng của mình và gọi thẳng lõi Junctura bằng định danh riêng.",
    note: "Dữ liệu trong bản demo là dữ liệu giả lập, không có thông tin người thật.",
  },
  landing: {
    benefitsTitle: "Tầng 2 cung cấp gì",
    benefitsLead: "Junctura Health là không gian năng lực y tế dùng chung của Junctura DX-OS, nơi các cơ sở cùng làm việc thay vì nối dữ liệu điểm-điểm với nhau.",
    benefits: [
      { title: "Hợp đồng năng lực dùng chung", text: "Mỗi năng lực — danh sách dị ứng, đơn thuốc, chuyển tuyến, giám định chi phí — có hợp đồng công khai, có phiên bản, mà mọi ứng dụng dùng đúng bản đó." },
      { title: "Quy trình nghiệp vụ dùng chung", text: "Chuyển tuyến, xác minh đơn thuốc và xác minh chi phí là các quy trình BPMN dùng chung, không phải mỗi cơ sở tự viết một kiểu." },
      { title: "Thư viện giao diện dùng chung", text: "Mọi ứng dụng dùng chung một bộ thành phần giao diện, nên người dùng đi từ ứng dụng này sang ứng dụng khác vẫn quen." },
    ],
    howTitle: "Cách hoạt động",
    how: [
      { title: "Mỗi cơ sở là một ứng dụng", text: "Trạm, bệnh viện, nhà thuốc, bảo hiểm chạy ứng dụng riêng của mình và gọi thẳng lõi Junctura bằng định danh riêng, không qua cổng trung gian." },
      { title: "Năng lực công bố theo hợp đồng", text: "Cơ sở nào có dữ liệu thì công bố năng lực theo hợp đồng của Tầng 2; cơ sở nào cần thì được cấp quyền đọc đúng phần đó." },
      { title: "Trao đổi có kiểm soát", text: "Mọi quyền đọc đều là grant có thời hạn, đúng mục đích, do người quản trị duyệt và được ghi nhật ký." },
    ],
    catalogTitle: "Năng lực y tế dùng chung",
    catalogLead: "Danh mục dưới đây lấy từ hợp đồng năng lực của Junctura Health. Cơ sở nào muốn dữ liệu phải dùng đúng hợp đồng này.",
    facilityTitle: "Các cơ sở tham gia",
    facilityLead: "Năm ứng dụng cùng làm việc trên không gian năng lực y tế này:",
    subjectTitle: "Người bệnh ở đâu?",
    subjectLead: "Người bệnh không đăng nhập trên cổng này.",
    subject: [
      { title: "Đồng thuận do người bệnh quản lý", text: "Người bệnh cấp và thu hồi quyền xem dữ liệu của mình trong ứng dụng Sổ sức khỏe (MyHealth) — một ứng dụng của Tầng 3." },
      { title: "Nhật ký truy cập của người bệnh", text: "Ai đã xem dữ liệu của mình, người bệnh xem lại trong cùng ứng dụng Sổ sức khỏe (MyHealth)." },
    ],
    faqTitle: "Câu hỏi thường gặp",
    faq: [
      { q: "Ai là người đọc cổng này?", a: "Cán bộ y tế, người quản trị cơ sở và người muốn tìm hiểu kiến trúc. Cổng công khai, chỉ đọc và không cần đăng nhập." },
      { q: "Người bệnh quản lý đồng thuận ở đâu?", a: "Trong ứng dụng Sổ sức khỏe (MyHealth) của Tầng 3, không phải trên cổng này." },
      { q: "Tầng 2 có giữ dữ liệu y tế không?", a: "Không. Dữ liệu nằm ở ứng dụng của từng cơ sở (Tầng 3); Tầng 2 chỉ định nghĩa hợp đồng năng lực và quy trình nghiệp vụ dùng chung." },
    ],
  },
  catalog: {
    provider: "Bên cung cấp",
    consumers: "Bên được gọi",
    purposes: "Mục đích",
    version: "Phiên bản",
    emergency: "Cho phép truy cập khẩn cấp",
    noEmergency: "Không truy cập khẩn cấp",
  },
} as const;

/** Vietnamese labels for the purpose codes of the shared contracts. */
export const purposeLabels: Record<string, string> = {
  treatment: "Điều trị",
  dispensing: "Phát thuốc",
  referral_intake: "Tiếp nhận chuyển tuyến",
  claim_review: "Giám định bảo hiểm",
};

export const purposeLabel = (purpose: string): string => purposeLabels[purpose] ?? purpose;
