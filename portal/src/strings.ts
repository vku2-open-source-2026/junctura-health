// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

/** Every string shown by the portal, in plain Vietnamese for medical staff and administrators. */

export const strings = {
  app: {
    name: "Cổng Junctura Health",
    shortName: "Junctura Health",
    tagline: "Không gian y tế liên thông",
    lead:
      "Junctura Health là Tầng 2 của Junctura DX-OS: nơi đặt luật chơi chung để trạm y tế, bệnh viện, nhà thuốc và bảo hiểm trao đổi dữ liệu với nhau, và nơi Sở Y tế điều phối những hồ sơ đi qua nhiều cơ sở như chuyển tuyến, xác minh đơn thuốc, xác minh chi phí.",
    note: "Dữ liệu trong bản demo là dữ liệu giả lập, không có thông tin người thật.",
    signIn: "Vào không gian làm việc",
  },
  signIn: {
    title: "Không gian làm việc liên thông",
    subtitle: "Dành cho nhân viên các cơ sở tham gia và Sở Y tế. Đăng nhập bằng tài khoản Junctura của bạn.",
    note: "Người bệnh không đăng nhập ở đây: hãy dùng ứng dụng Sổ sức khỏe để quản lý đồng thuận.",
    notStaff: "Tài khoản này không thuộc cơ sở nào trong không gian liên thông, nên không mở được không gian làm việc.",
    signOut: "Đăng xuất",
    failed: "Không mở được trang đăng nhập. Hãy thử lại.",
    badRedirect: "Đăng nhập chưa hoàn tất. Hãy đăng nhập lại.",
    sessionEnded: "Phiên đăng nhập đã hết. Hãy đăng nhập lại.",
  },
  landing: {
    layersTitle: "Junctura Health nằm ở đâu",
    layersLead: "Junctura chia làm ba tầng. Cổng này là giao diện của Tầng 2.",
    layers: [
      { title: "Tầng 1 · Junctura DX-OS", text: "Lõi trung lập: định danh, đồng thuận, vé gọi dùng một lần, kho dữ liệu, công cụ quy trình và nhật ký. Lõi không biết gì về y tế." },
      { title: "Tầng 2 · Junctura Health", text: "Không gian năng lực số của ngành y tế: hợp đồng dữ liệu, quy trình liên thông, giao diện chung và Cổng Junctura Health, nơi các cơ sở cùng làm việc, xử lý hồ sơ và Sở Y tế điều hành." },
      { title: "Tầng 3 · Ứng dụng của cơ sở", text: "Phần mềm riêng của trạm y tế, bệnh viện, nhà thuốc, bảo hiểm và ứng dụng Sổ sức khỏe của người bệnh. Mỗi ứng dụng giữ dữ liệu của mình và gọi thẳng Tầng 1." },
    ],
    benefitsTitle: "Cổng Junctura Health có gì",
    benefitsLead: "Một nơi làm việc chung cho các cơ sở y tế và Sở Y tế, chạy trên Junctura DX-OS.",
    benefits: [
      { title: "Làm việc chung", text: "Mỗi cơ sở thấy việc của mình hôm nay, đọc bảng tin của Sở Y tế và tra danh bạ liên thông." },
      { title: "Hồ sơ liên thông", text: "Chuyển tuyến, xác minh đơn thuốc, xác minh chi phí là hồ sơ số đi qua từng cơ sở theo quy trình chung, có trao đổi và tệp đính kèm." },
      { title: "Điều hành bằng số liệu", text: "Sở Y tế xem số liệu sống: hồ sơ đang chờ ở đâu, xử lý mất bao lâu, cơ sở nào giữ dữ liệu gì và chia sẻ cho ai." },
      { title: "Trợ lý AI (sắp có)", text: "Tóm tắt và gợi ý trên dữ liệu của không gian, luôn ghi rõ cần người kiểm tra lại." },
    ],
    howTitle: "Một hồ sơ chuyển tuyến đi như thế nào",
    how: [
      { title: "Trạm y tế mở hồ sơ", text: "Y sĩ mở hồ sơ chuyển tuyến trong mục Hồ sơ liên thông, ghi mức khẩn và cơ sở nhận. Hồ sơ chỉ mang mã tham chiếu, không chứa bệnh án." },
      { title: "Bệnh viện nhận hồ sơ", text: "Bác sĩ thấy hồ sơ đang chờ bệnh viện. Ứng dụng bệnh viện lấy tóm tắt trước khám qua Tầng 1, đúng hợp đồng và chỉ khi người bệnh đã đồng ý." },
      { title: "Sở Y tế theo dõi", text: "Ở mục Điều hành, Sở Y tế thấy hồ sơ đang ở bước nào, cơ sở nào đang giữ, mất bao lâu. Tầng 1 ghi nhật ký mọi lần truy cập dữ liệu." },
    ],
    catalogTitle: "Hợp đồng dữ liệu dùng chung",
    catalogLead: "Danh mục lấy từ hợp đồng năng lực của Junctura Health. Cơ sở nào muốn dữ liệu của cơ sở khác phải dùng đúng hợp đồng này.",
    facilityTitle: "Các cơ sở tham gia",
    facilityLead: "Năm ứng dụng Tầng 3 tham gia không gian này. Sổ sức khỏe là ứng dụng của người bệnh: người bệnh cấp đồng thuận và xem nhật ký truy cập ở đó, không phải trên cổng này.",
    faqTitle: "Câu hỏi thường gặp",
    faq: [
      { q: "Ai dùng cổng này?", a: "Phần công khai dành cho bất kỳ ai muốn biết luật chơi chung. Phần làm việc dành cho nhân viên các cơ sở tham gia và Sở Y tế, đăng nhập bằng tài khoản Junctura." },
      { q: "Người bệnh có đăng nhập ở đây không?", a: "Không. Người bệnh dùng ứng dụng Sổ sức khỏe (Tầng 3) để cấp, thu hồi đồng thuận và xem ai đã truy cập dữ liệu của mình." },
      { q: "Tầng 2 có giữ bệnh án không?", a: "Không. Bệnh án nằm trong ứng dụng của từng cơ sở. Hồ sơ liên thông chỉ mang mã tham chiếu, thông tin điều phối và trạng thái các bước." },
      { q: "Muốn thêm một cơ sở mới thì làm gì?", a: "Cơ sở viết ứng dụng Tầng 3 theo các hợp đồng ở đây, đăng ký với Tầng 1, rồi được Sở Y tế duyệt quyền dùng đúng những hợp đồng cần thiết." },
    ],
  },
  catalog: {
    provider: "Bên cung cấp",
    consumers: "Bên được dùng",
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
