// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import type { Facility } from "./context";

/** Strings of the coordination desk, in plain Vietnamese. */
export const deskStrings = {
  product: "Cổng Junctura Health",
  nav: {
    desk: "Bàn điều phối",
    overview: "Tổng quan",
    cases: "Hồ sơ",
    openCase: "Mở hồ sơ",
    signedInAs: "Nhân viên",
    signOut: "Đăng xuất",
  },
  overview: {
    title: "Bàn điều phối liên thông",
    lead: "Theo dõi các hồ sơ liên thông chạy qua nhiều cơ sở y tế trên Junctura.",
    waitingMine: "Việc đang chờ cơ sở của bạn",
    waitingByFacility: "Hồ sơ đang chờ theo cơ sở",
    waitingNone: "Không có việc nào đang chờ cơ sở của bạn.",
    openCase: "Mở hồ sơ mới",
    running: "Đang chạy",
    completed: "Hoàn tất",
    cancelled: "Đã huỷ",
    steps: "Các bước",
    owner: "Cơ sở phụ trách",
    updatedAt: "Cập nhật",
    viewCase: "Xem hồ sơ",
    caseCount: "hồ sơ",
    waitingStep: "Bước đang chờ",
  },
  cases: {
    title: "Hồ sơ liên thông",
    lead: "Các hồ sơ liên thông đang chạy và đã kết thúc trên Junctura. Mỗi hồ sơ chỉ mang mã tham chiếu, không chứa dữ liệu người bệnh.",
    code: "Mã hồ sơ",
    workflow: "Quy trình",
    status: "Trạng thái",
    currentStep: "Bước hiện tại",
    updated: "Cập nhật",
    statusAll: "Tất cả",
    mineOnly: "Chỉ việc của cơ sở tôi",
    none: "Không có hồ sơ nào.",
    noStep: "—",
    openCase: "Mở hồ sơ mới",
  },
  openCase: {
    title: "Mở hồ sơ liên thông",
    lead: "Cơ sở của bạn mở hồ sơ liên thông trên Junctura; các cơ sở khác xử lý các bước tiếp theo.",
    workflow: "Quy trình",
    reference: "Mã tham chiếu",
    referenceHint: "Chữ hoa, số và dấu gạch, tối đa 32 ký tự, bắt đầu bằng một chữ cái (ví dụ CT-123456).",
    referenceInvalid: "Mã tham chiếu không hợp lệ: dùng chữ hoa, số và dấu gạch, tối đa 32 ký tự, bắt đầu bằng một chữ cái.",
    noWorkflow: "Cơ sở của bạn không mở được quy trình nào. Hồ sơ liên thông do trạm y tế, nhà thuốc hoặc bảo hiểm mở.",
    submit: "Mở hồ sơ",
    submitting: "Đang mở…",
    noPatientNote:
      "Không nhập thông tin người bệnh vào đây: hồ sơ liên thông chỉ mang mã tham chiếu, dữ liệu y tế nằm trong các hồ sơ của cơ sở.",
    forbidden: "Tài khoản chưa được cấp quyền mở hồ sơ liên thông. Liên hệ quản trị Sở Y tế để được cấp quyền.",
    failed: "Không mở được hồ sơ. Hãy thử lại.",
  },
  detail: {
    title: "Chi tiết hồ sơ liên thông",
    backToList: "Về danh sách hồ sơ",
    status: "Trạng thái",
    reference: "Mã tham chiếu",
    openedBy: "Cơ sở mở hồ sơ",
    workflow: "Quy trình",
    steps: "Các bước",
    stepDone: "Đã qua",
    stepCurrent: "Đang ở bước này",
    stepFuture: "Chưa tới",
    stepNoGroups: "Không có cơ sở phụ trách",
    currentStep: "Bước hiện tại",
    completeStep: "Hoàn tất bước",
    confirmTitle: "Hoàn tất bước này?",
    confirmDescription:
      "Bước này sẽ được đánh dấu là đã làm xong và hồ sơ chuyển sang bước tiếp theo của quy trình. Chỉ làm khi công việc của cơ sở bạn tại bước này đã thực sự xong.",
    confirmLabel: "Xác nhận hoàn tất",
    completing: "Đang hoàn tất…",
    readonly: "Sở Y tế theo dõi toàn bộ hồ sơ, không thực hiện bước của cơ sở.",
    notFound: "Không tìm thấy hồ sơ liên thông. Hồ sơ có thể đã bị xoá hoặc bạn không có quyền xem.",
    updated: "Cập nhật",
  },
  errors: {
    loading: "Đang tải",
    loadFailed: "Có lỗi xảy ra",
    forbiddenTitle: "Bạn chưa có quyền xem nội dung này",
    forbidden: "Tài khoản chưa được cấp quyền xem hồ sơ liên thông. Liên hệ quản trị Sở Y tế để được cấp quyền.",
    notFoundTitle: "Không tìm thấy hồ sơ",
    notFound: "Hồ sơ không tồn tại hoặc đã bị xoá. Hãy kiểm tra lại từ danh sách hồ sơ.",
    networkTitle: "Không kết nối được Junctura",
    network: "Máy chủ không phản hồi. Kiểm tra mạng và thử lại.",
    generic: "Đã xảy ra lỗi không xác định. Hãy thử lại.",
    retry: "Thử lại",
    notFoundPage: "Trang không tồn tại trong bàn điều phối.",
    notFoundPageAction: "Về tổng quan",
  },
} as const;

/** Status of a workflow execution, as the engine reports it. */
export type ExecutionStatus = "running" | "completed" | "cancelled";

export const statusLabel: Readonly<Record<ExecutionStatus, string>> = {
  running: deskStrings.overview.running,
  completed: deskStrings.overview.completed,
  cancelled: deskStrings.overview.cancelled,
};

/** Friendly names for the facility groups; unknown codes stay as-is. */
const FACILITY_LABELS: Readonly<Record<Facility, string>> = {
  "tram-y-te": "Trạm y tế",
  "benh-vien": "Bệnh viện",
  "nha-thuoc": "Nhà thuốc",
  "bao-hiem": "Bảo hiểm",
  "so-y-te": "Sở Y tế",
};

export const facilityLabel = (facility: string): string => FACILITY_LABELS[facility as Facility] ?? facility;
