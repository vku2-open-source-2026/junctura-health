// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

/** Strings of space D (Điều hành), in plain Vietnamese for the health department and facility staff. */
export const dataStrings = {
  overview: {
    title: "Tổng quan điều hành",
    lead: "Số liệu sống từ Tầng 1: hồ sơ đang chạy ở đâu, xử lý mất bao lâu, cơ sở nào đang giữ.",
    running: "Hồ sơ đang chạy",
    completed: "Hồ sơ hoàn tất",
    cancelled: "Hồ sơ đã huỷ",
    activeApps: "Ứng dụng cơ sở đang hoạt động",
    activeAppsHint: "Ứng dụng Tầng 3 có hoạt động gần đây.",
    waitingTitle: "Hồ sơ đang chờ theo cơ sở",
    waitingHint: "Căn theo bước đang chờ của từng hồ sơ, trong 100 hồ sơ gần nhất.",
    waitingNone: "Không có hồ sơ nào đang chờ.",
    overdue: "quá 24 giờ",
    waitingAt: "hồ sơ chờ",
    durationTitle: "Thời gian xử lý",
    durationHint: "Theo hồ sơ hoàn tất gần nhất của từng quy trình y tế.",
    median: "Trung vị",
    max: "Lâu nhất",
    durationNone: "Chưa có hồ sơ hoàn tất nào để tính thời gian xử lý.",
    perWorkflow: "Theo từng quy trình",
    columnWorkflow: "Quy trình",
    columnRunning: "Đang chạy",
    columnCompleted: "Hoàn tất",
    columnCancelled: "Đã huỷ",
    columnSteps: "Các bước",
    columnFacilities: "Cơ sở phụ trách",
    noStep: "—",
    refresh: "Làm mới",
    updatedAt: "Cập nhật lúc",
  },
  exchange: {
    title: "Trao đổi dữ liệu",
    lead: "Sự kiện trao đổi dữ liệu và năng lực giữa các cơ sở, đọc từ nhật ký có chuỗi băm của Tầng 1.",
    sourceNote: "Nhật ký chuỗi băm của Tầng 1",
    rangeLabel: "Khoảng thời gian",
    range24h: "24 giờ qua",
    range7d: "7 ngày qua",
    rangeAll: "Tất cả",
    countsTitle: "Sự kiện theo loại",
    countsNone: "Chưa có sự kiện nào trong khoảng thời gian này.",
    perAppTitle: "Sự kiện theo ứng dụng",
    perAppHint: "Ghi nhận trao đổi năng lực và truy cập theo ứng dụng.",
    perAppNone: "Không có sự kiện trao đổi nào gắn với ứng dụng.",
    recentTitle: "Sự kiện gần nhất",
    columnTime: "Thời điểm",
    columnType: "Loại",
    columnActor: "Ứng dụng / tác nhân",
    columnOutcome: "Kết quả",
    recentNone: "Chưa có sự kiện nào.",
    emergencyTitle: "Truy cập cấp cứu cần rà soát",
    emergencyHint: "Các lần truy cập dữ liệu ở chế độ cấp cứu. Sở Y tế rà soát từng lần để bảo đảm đúng quy định.",
    emergencyNone: "Không có truy cập cấp cứu nào trong khoảng thời gian này.",
    appsTitle: "Hoạt động gần nhất của ứng dụng cơ sở",
    columnApp: "Ứng dụng",
    columnState: "Trạng thái",
    columnActivity: "Hoạt động gần nhất",
    columnOutgoing: "Gọi ra (24 giờ)",
    columnIncoming: "Được gọi (24 giờ)",
    purpose: "Mục đích",
  },
  catalog: {
    title: "Danh mục dữ liệu chuẩn hóa",
    lead: "Các hợp đồng năng lực của không gian y tế: ai cung cấp, ai được dùng, để làm gì. Xem chi tiết tại trang công khai của từng hợp đồng.",
    viewContract: "Xem hợp đồng",
    columnVersion: "Phiên bản",
    columnPurposes: "Mục đích",
    columnEmergency: "Truy cập khẩn cấp",
    emergencyYes: "Có",
    emergencyNo: "Không",
  },
  sharing: {
    title: "Chia sẻ dữ liệu và năng lực",
    lead: "Cơ sở nào cung cấp năng lực nào cho cơ sở nào, và tần suất gọi thực tế 24 giờ qua.",
    flowTitle: "Cung cấp năng lực giữa các cơ sở",
    columnProvider: "Bên cung cấp",
    columnCapability: "Năng lực",
    columnConsumer: "Bên được dùng",
    columnCalls: "Số gọi 24 giờ qua",
    callsHint: "Đếm từ thống kê ứng dụng của Tầng 1 (bên được dùng gọi ra / bên cung cấp được gọi).",
    consoleNote: "Cấp hoặc thu hồi quyền làm ở Console của Tầng 1; trang này chỉ xem.",
  },
  dataMap: {
    title: "Bản đồ dữ liệu",
    lead: "Mỗi ứng dụng cơ sở giữ dữ liệu của mình trên Tầng 1; trang này chỉ thấy tên và số đếm.",
    explanation: "Dữ liệu nằm ở cơ sở sở hữu; Tầng 2 chỉ thấy bản đồ, không đọc nội dung.",
    collectionsTitle: "Bộ sưu tập",
    collectionsNone: "Chưa có dữ liệu.",
    columnCollection: "Bộ sưu tập",
    columnRecords: "Số bản ghi",
    columnUpdated: "Cập nhật",
    filesTitle: "Tệp",
    filesCount: "tệp",
    quarantined: "cách ly",
    filesNone: "Chưa có tệp nào.",
    fieldsTitle: "Các trường",
    fieldName: "Trường",
    fieldType: "Kiểu",
    fieldFillRate: "Tỉ lệ điền",
    fieldsNone: "Không có thông tin trường nào.",
    showFields: "Xem tên trường",
    hideFields: "Ẩn tên trường",
    loadingFields: "Đang tải tên trường…",
  },
  notFound: {
    title: "Trang không tồn tại",
    action: "Về Tổng quan điều hành",
  },
} as const;

/** Friendly labels for the audit event families of Tầng 1; unknown events stay as-is. */
const EVENT_FAMILIES: Readonly<Record<string, string>> = {
  application: "Quản trị ứng dụng",
  approval: "Phê duyệt",
  resource: "Chia sẻ tài nguyên",
  capability: "Đăng ký năng lực",
  grant: "Cấp quyền",
  delegation: "Ủy quyền",
  composition: "Kết hợp năng lực",
  execution: "Thực thi năng lực",
  invocation: "Gọi năng lực",
  authorization: "Ủy nhiệm truy cập",
  audit: "Kiểm toán",
};

/** The two execution events that record a capability call naming a data subject. */
const EXECUTION_EVENTS: Readonly<Record<string, string>> = {
  "execution.subject_accessed": "Thực thi năng lực (có người bệnh ghi nhận)",
  "execution.emergency_access": "Truy cập cấp cứu",
};

/** The audit event as one readable line: the specific event, else the family. */
export const eventLabel = (event: string): string => {
  const [family, action] = event.split(".");
  const familyLabel = EVENT_FAMILIES[family];
  if (!familyLabel) return event;
  const specific = action != null ? EXECUTION_EVENTS[`${family}.${action}`] : undefined;
  if (specific) return specific;
  return familyLabel;
};

/** Friendly labels for audit outcomes. */
export const outcomeLabel = (outcome: string): string => {
  const labels: Readonly<Record<string, string>> = {
    success: "Thành công",
    denied: "Bị từ chối",
    failed: "Lỗi",
    unknown: "Không rõ",
  };
  return labels[outcome] ?? outcome;
};

/** Friendly labels for application states. */
export const appStateLabel = (state: string): string => {
  const labels: Readonly<Record<string, string>> = {
    active: "Đang hoạt động",
    pending: "Chờ duyệt",
    suspended: "Tạm dừng",
    revoked: "Đã thu hồi",
  };
  return labels[state] ?? state;
};

/** Friendly labels for the purpose codes used in audit reason codes and contracts. */
export const purposeName = (purpose: string): string => {
  const labels: Readonly<Record<string, string>> = {
    treatment: "Điều trị",
    dispensing: "Phát thuốc",
    referral_intake: "Tiếp nhận chuyển tuyến",
    claim_review: "Giám định bảo hiểm",
  };
  return labels[purpose] ?? purpose;
};
