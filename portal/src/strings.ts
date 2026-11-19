// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

/** Every string shown by the portal, in plain Vietnamese for patients (see docs/DESIGN.md §8). */

export const strings = {
  app: {
    name: "Cổng Junctura Health",
    shortName: "Cổng người bệnh",
    tagline: "Dữ liệu y tế của bạn, bạn quyết định",
    lead:
      "Đây là không gian năng lực y tế dùng chung của Junctura Health: trạm y tế, bệnh viện, nhà thuốc và bảo hiểm làm việc trên cùng một nền tảng, và chỉ trao đổi dữ liệu về bạn khi bạn đồng ý, đúng mục đích, với nhật ký đầy đủ.",
    note: "Dữ liệu trong bản demo là dữ liệu giả lập, không có thông tin người thật.",
    userFallback: "Người bệnh",
  },
  nav: {
    consents: "Đồng thuận",
    access: "Ai đã xem dữ liệu",
    signIn: "Đăng nhập",
    signOut: "Đăng xuất",
  },
  signIn: {
    title: "Đăng nhập cho người bệnh",
    subtitle: "Đăng nhập bằng tài khoản Junctura của bạn để quản lý đồng thuận và xem nhật ký truy cập.",
    note: "Tài khoản do cơ sở y tế cấp trong bản demo. Bạn sẽ nhập tài khoản trên trang đăng nhập của Junctura.",
    back: "Về trang chủ",
    started: "Đang chuyển tới trang đăng nhập của Junctura…",
    failed: "Không đăng nhập được. Vui lòng thử lại.",
    sessionEnded: "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.",
    badRedirect: "Phản hồi đăng nhập không hợp lệ. Vui lòng thử lại.",
  },
  landing: {
    benefitsTitle: "Bạn làm chủ dữ liệu của mình",
    benefitsLead: "Mọi ứng dụng phải được bạn cho phép trước khi xem dữ liệu, và bạn biết chính xác ai đã xem gì.",
    benefits: [
      { title: "Đồng thuận rõ ràng", text: "Bạn thấy từng bên nào được xem năng lực nào, cho mục đích gì và đến bao giờ." },
      { title: "Thu hồi hoặc cấp lại bất cứ lúc nào", text: "Một nút bấm: thu hồi ngay, hoặc cấp lại đúng 90 ngày khi cần." },
      { title: "Nhật ký ai đã xem", text: "Mỗi lần truy cập dữ liệu của bạn đều được ghi lại, kể cả truy cập khẩn cấp." },
    ],
    howTitle: "Cách hoạt động",
    how: [
      { title: "Bạn đăng nhập", text: "Một tài khoản Junctura dùng cho mọi cơ sở y tế, không cần mật khẩu riêng." },
      { title: "Cơ sở xin phép", text: "Khi cần dữ liệu của bạn, ứng dụng của cơ sở đó phải có đồng thuận của bạn." },
      { title: "Bạn kiểm soát", text: "Thu hồi bất cứ lúc nào, và xem lại toàn bộ lịch sử truy cập của mình." },
    ],
    catalogTitle: "Năng lực y tế dùng chung",
    catalogLead: "Danh mục dưới đây lấy từ hợp đồng năng lực của Junctura Health. Cơ sở nào muốn dữ liệu phải dùng đúng hợp đồng này.",
    facilityTitle: "Các cơ sở tham gia",
    facilityLead: "Năm ứng dụng cùng làm việc trên không gian năng lực y tế này:",
    trustTitle: "Riêng tư là mặc định",
    trust: [
      { title: "Đăng nhập qua Junctura", text: "Cổng không giữ mật khẩu; đăng nhập và phiên của bạn do Junctura đảm nhiệm." },
      { title: "Token chỉ ở trong bộ nhớ", text: "Phiên của bạn không lưu xuống máy; đóng trang là kết thúc." },
      { title: "Cấp cứu không bỏ qua bạn", text: "Truy cập khẩn cấp vẫn được ghi và người quản lý rà soát lại sau." },
    ],
    faqTitle: "Câu hỏi thường gặp",
    faq: [
      { q: "Ai có thể xem dữ liệu của tôi?", a: "Chỉ ứng dụng mà bạn đã cấp đồng thuận, đúng năng lực và mục đích đã ghi trong đồng thuận." },
      { q: "Tôi có biết khi nào dữ liệu được xem không?", a: "Có. Mọi lần truy cập hiện ở mục \"Ai đã xem dữ liệu\", kèm thời điểm và mục đích." },
      { q: "Thu hồi rồi thì sao?", a: "Ứng dụng sẽ không xem được nữa; nếu cần bạn có thể cấp lại bất cứ lúc nào." },
    ],
    ctaTitle: "Sẵn sàng xem lại quyền của mình?",
    ctaLead: "Đăng nhập bằng tài khoản Junctura của bạn.",
  },
  catalog: {
    provider: "Bên cung cấp",
    consumers: "Bên được gọi",
    purposes: "Mục đích",
    version: "Phiên bản",
    emergency: "Cho phép truy cập khẩn cấp",
    noEmergency: "Không truy cập khẩn cấp",
  },
  consents: {
    title: "Đồng thuận của bạn",
    lead: "Mỗi dòng là một sự cho phép bạn đã cấp cho một ứng dụng. Bạn có thể thu hồi bất cứ lúc nào.",
    grantTitle: "Cấp đồng thuận mới",
    grantLead: "Chọn ứng dụng và năng lực, đặt thời hạn, rồi xác nhận. Ứng dụng chỉ xem được đúng phần bạn cấp.",
    consumer: "Ứng dụng nhận",
    capability: "Năng lực",
    purposes: "Mục đích",
    expires: "Có hiệu lực đến",
    state: "Trạng thái",
    emptyTitle: "Chưa có đồng thuận nào",
    emptyLead: "Khi bạn cấp quyền cho một ứng dụng, đồng thuận sẽ hiện ở đây.",
    loading: "Đang tải đồng thuận…",
    errorTitle: "Không tải được danh sách đồng thuận",
    errorLead: "Mất kết nối tới Junctura. Vui lòng thử lại.",
    stateActive: "Đang có hiệu lực",
    stateRevoked: "Đã thu hồi",
    stateExpired: "Đã hết hạn",
    stateUnknown: "Không rõ trạng thái",
    revoke: "Thu hồi đồng thuận",
    revokeTitle: "Thu hồi đồng thuận?",
    revokeDescription: (consumer: string, capability: string) =>
      `${consumer} sẽ không xem được “${capability}” của bạn nữa. Việc này không thể hoàn tác; nếu cần bạn có thể cấp lại sau.`,
    grantAgain: "Cấp lại",
    grantAgainTitle: "Cấp lại đồng thuận?",
    grantAgainDescription: (consumer: string, capability: string) =>
      `Đồng ý cho ${consumer} xem “${capability}” của bạn trong 90 ngày tới. Bạn có thể thu hồi bất cứ lúc nào.`,
    confirmRevoke: "Thu hồi đồng thuận",
    confirmGrant: "Cấp lại đồng thuận",
    cancel: "Huỷ",
    working: "Đang xử lý…",
    done: "Đã cập nhật.",
    purposeFallback: (purpose: string) => purpose,
  },
  access: {
    title: "Ai đã xem dữ liệu của bạn",
    lead: "Nhật ký do Junctura ghi lại cho từng lần ứng dụng đọc dữ liệu về bạn. Bạn không thể sửa nhật ký này.",
    emptyTitle: "Chưa có lần truy cập nào",
    emptyLead: "Khi có ứng dụng xem dữ liệu của bạn, lần truy cập sẽ hiện ở đây.",
    loading: "Đang tải nhật ký…",
    errorTitle: "Không tải được nhật ký truy cập",
    errorLead: "Mất kết nối tới Junctura. Vui lòng thử lại.",
    columns: {
      time: "Thời điểm",
      consumer: "Ứng dụng gọi",
      provider: "Nơi lưu dữ liệu",
      capability: "Năng lực",
      purpose: "Mục đích",
      state: "Trạng thái",
      emergency: "Truy cập khẩn cấp",
    },
    emergency: "Cấp cứu",
    noEmergency: "—",
    stateSucceeded: "Thành công",
    stateFailed: "Không thành công",
    stateRunning: "Đang chạy",
    stateAccepted: "Đã ghi nhận",
    stateAuthRequired: "Cần xác thực",
    stateTimedOut: "Hết thời gian",
    stateOutcomeUnknown: "Không rõ kết quả",
    stateUnknown: (state: string) => state,
  },
  auth: {
    stateHeading: "Phiên của bạn",
    signedInAs: "Đang đăng nhập với tư cách",
  },
} as const;

/** Vietnamese labels for the purpose codes of the shared contracts. */
export const purposeLabels: Record<string, string> = {
  treatment: "Điều trị",
  dispensing: "Phát thuốc",
  referral_intake: "Tiếp nhận chuyển tuyến",
  claim_review: "Giám định bảo hiểm",
};

export const purposeLabel = (purpose: string): string => purposeLabels[purpose] ?? strings.consents.purposeFallback(purpose);
