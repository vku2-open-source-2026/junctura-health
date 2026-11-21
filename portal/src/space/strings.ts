// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

/** Strings of the shared capability-space pages, in plain Vietnamese. */

export const spaceStrings = {
  product: "Cổng Junctura Health",
  nav: {
    space: "Không gian năng lực",
    contracts: "Hợp đồng",
    workflows: "Quy trình",
    facilities: "Cơ sở",
  },
  contracts: {
    title: "Hợp đồng năng lực y tế",
    lead:
      "Mỗi hợp đồng mô tả một năng lực dùng chung: ai cung cấp, ai được gọi, cho mục đích gì và dữ liệu hai bên có dạng nào. Nội dung lấy trực tiếp từ kho hợp đồng của Junctura Health.",
    openDetail: "Xem chi tiết",
  },
  contract: {
    version: "Phiên bản",
    provider: "Bên cung cấp",
    consumers: "Bên được gọi",
    purposes: "Mục đích",
    emergency: "Truy cập khẩn cấp",
    emergencyAllowed: "Cho phép khi cấp cứu",
    emergencyForbidden: "Không cho phép",
    sideEffects: "Tác dụng phụ",
    timeout: "Thời gian chờ",
    inputs: "Dữ liệu đầu vào",
    outputs: "Dữ liệu đầu ra",
    fields: { name: "Tên trường", type: "Kiểu dữ liệu", required: "Bắt buộc", optional: "Tuỳ chọn", description: "Mô tả" },
    noFields: "Không có trường nào.",
    notFoundTitle: "Không tìm thấy hợp đồng",
    notFoundLead: "Không có hợp đồng nào với mã này. Hãy chọn một hợp đồng trong danh sách.",
    backToList: "Về danh sách hợp đồng",
  },
  workflows: {
    title: "Quy trình nghiệp vụ dùng chung",
    lead: "Các quy trình BPMN mà các cơ sở y tế chạy chung trên Junctura. Mỗi bước ghi rõ nhóm thực hiện.",
    stepCount: "bước",
    groups: "Nhóm thực hiện",
  },
  facilities: {
    title: "Các cơ sở trong không gian năng lực",
    lead: "Mỗi ứng dụng cung cấp một số năng lực và sử dụng một số năng lực khác qua hợp đồng dùng chung.",
    provides: "Năng lực cung cấp",
    uses: "Năng lực sử dụng",
    none: "Không có",
  },
} as const;

/** Friendly names for the Flowable candidate groups; unknown codes stay as-is. */
const GROUP_LABELS: Readonly<Record<string, string>> = {
  "tram-y-te": "Trạm y tế",
  "benh-vien": "Bệnh viện",
  "nha-thuoc": "Nhà thuốc",
  "bao-hiem": "Bảo hiểm y tế",
};

export const groupLabel = (group: string): string => GROUP_LABELS[group] ?? group;

/** Friendly names for the step kinds that carry no task name. */
const KIND_LABELS: Readonly<Record<string, string>> = {
  startEvent: "Bắt đầu",
  endEvent: "Kết thúc",
  exclusiveGateway: "Rẽ nhánh",
};

export const stepLabel = (step: { name: string; id: string; kind: string }): string => step.name || KIND_LABELS[step.kind] || step.id;
