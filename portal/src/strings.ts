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
    signIn: "Vào Bàn điều phối",
  },
  signIn: {
    title: "Bàn điều phối liên thông",
    subtitle: "Dành cho nhân viên các cơ sở tham gia và Sở Y tế. Đăng nhập bằng tài khoản Junctura của bạn.",
    note: "Người bệnh không đăng nhập ở đây: hãy dùng ứng dụng Sổ sức khỏe để quản lý đồng thuận.",
    notStaff: "Tài khoản này không thuộc cơ sở nào trong không gian liên thông, nên không mở được Bàn điều phối.",
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
      { title: "Tầng 2 · Junctura Health", text: "Không gian liên thông y tế: hợp đồng dữ liệu, quy trình liên thông, giao diện chung và Bàn điều phối, nơi các cơ sở cùng xử lý hồ sơ liên thông." },
      { title: "Tầng 3 · Ứng dụng của cơ sở", text: "Phần mềm riêng của trạm y tế, bệnh viện, nhà thuốc, bảo hiểm và ứng dụng Sổ sức khỏe của người bệnh. Mỗi ứng dụng giữ dữ liệu của mình và gọi thẳng Tầng 1." },
    ],
    benefitsTitle: "Tầng 2 cung cấp gì",
    benefitsLead: "Những thứ mọi cơ sở trong không gian dùng chung, thay vì mỗi nơi tự làm một kiểu.",
    benefits: [
      { title: "Hợp đồng dữ liệu", text: "Mỗi loại dữ liệu được trao đổi (dị ứng, tóm tắt trước khám, đơn thuốc, chuyển tuyến, chi phí) có một hợp đồng công khai, có phiên bản: ai cung cấp, ai được dùng, dùng vào mục đích gì, trả về những trường nào." },
      { title: "Quy trình liên thông", text: "Chuyển tuyến, xác minh đơn thuốc và xác minh chi phí là quy trình BPMN dùng chung; mỗi bước ghi rõ cơ sở nào phụ trách." },
      { title: "Bàn điều phối", text: "Nhân viên cơ sở đăng nhập để mở hồ sơ liên thông và xử lý bước của cơ sở mình; Sở Y tế theo dõi hồ sơ đang chờ ở đâu. Mọi thao tác chạy trên Tầng 1." },
      { title: "Giao diện và dữ liệu mẫu chung", text: "Một thư viện giao diện cho mọi ứng dụng và bộ 50 người bệnh giả lập để các nhóm cùng thử trên cùng dữ liệu." },
    ],
    howTitle: "Một hồ sơ chuyển tuyến đi như thế nào",
    how: [
      { title: "Trạm y tế mở hồ sơ", text: "Y sĩ mở hồ sơ chuyển tuyến trên Bàn điều phối. Hồ sơ chỉ mang mã tham chiếu, không chứa bệnh án." },
      { title: "Bệnh viện nhận hồ sơ", text: "Bác sĩ thấy hồ sơ đang chờ bệnh viện. Ứng dụng bệnh viện lấy tóm tắt trước khám qua Tầng 1, đúng hợp đồng và chỉ khi người bệnh đã đồng ý." },
      { title: "Sở Y tế theo dõi", text: "Sở Y tế thấy mỗi hồ sơ đang ở bước nào, cơ sở nào đang giữ. Tầng 1 ghi nhật ký mọi lần truy cập dữ liệu." },
    ],
    catalogTitle: "Hợp đồng dữ liệu dùng chung",
    catalogLead: "Danh mục lấy từ hợp đồng năng lực của Junctura Health. Cơ sở nào muốn dữ liệu của cơ sở khác phải dùng đúng hợp đồng này.",
    facilityTitle: "Các cơ sở tham gia",
    facilityLead: "Năm ứng dụng Tầng 3 tham gia không gian này. Sổ sức khỏe là ứng dụng của người bệnh: người bệnh cấp đồng thuận và xem nhật ký truy cập ở đó, không phải trên cổng này.",
    faqTitle: "Câu hỏi thường gặp",
    faq: [
      { q: "Ai dùng cổng này?", a: "Phần công khai dành cho bất kỳ ai muốn biết luật chơi chung. Bàn điều phối dành cho nhân viên các cơ sở tham gia và Sở Y tế, đăng nhập bằng tài khoản Junctura." },
      { q: "Người bệnh có đăng nhập ở đây không?", a: "Không. Người bệnh dùng ứng dụng Sổ sức khỏe (Tầng 3) để cấp, thu hồi đồng thuận và xem ai đã truy cập dữ liệu của mình." },
      { q: "Tầng 2 có giữ bệnh án không?", a: "Không. Bệnh án nằm trong ứng dụng của từng cơ sở. Hồ sơ liên thông trên Bàn điều phối chỉ mang mã tham chiếu và trạng thái các bước." },
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
