<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Quy trình nghiệp vụ y tế (BPMN)

Thư mục này chứa các định nghĩa quy trình y tế dùng chung của Tầng 2, viết theo BPMN 2.0 và chạy trên công cụ workflow của Tầng 1 (Flowable). Các app Tầng 3 không tự dựng quy trình: cần quy trình duyệt nào thì dùng lại hoặc đề xuất thêm tại đây.

## Cách Tầng 1 nạp thư mục này

- Junctura DX-OS đọc định nghĩa từ biến môi trường `WORKFLOW_DEFINITIONS_DIR=../junctura-health/workflows` (đặt cạnh repo này, cùng cách với các app Tầng 3); trong `docker compose` thư mục được mount vào `/definitions/business`.
- Mỗi file `*.bpmn20.xml` phải qua **chính sách nghiêm của Tầng 1** (`definition-policy.mjs`): một process duy nhất, `isExecutable="true"`, không script, không biểu thức tùy ý, điều kiện chỉ so sánh một biến với một hằng số. File không qua chính sách sẽ bị Tầng 1 từ chối khi nạp.
- Key process không được trùng nhau trong thư mục, và không trùng hai key lõi dành riêng (`junctura_c4a_single`, `junctura_checkpoint`).

## Danh sách quy trình

| File | Key | Quy trình |
| --- | --- | --- |
| `chuyen-tuyen.bpmn20.xml` | `junctura_chuyen_tuyen` | Chuyển tuyến bệnh nhân: trạm y tế tiếp nhận, bác sĩ bệnh viện duyệt, hoàn tất |
| `xac-minh-don-thuoc.bpmn20.xml` | `junctura_xac_minh_don_thuoc` | Xác minh đơn thuốc: nhà thuốc gửi, bệnh viện xác nhận, hoàn tất |
| `xac-minh-chi-phi.bpmn20.xml` | `junctura_xac_minh_chi_phi` | Xác minh chi phí bảo hiểm: bảo hiểm gửi, bệnh viện xác nhận, hoàn tất |

Kiểm tra trước khi triển khai: `npm test` chạy `tests/workflows.test.mjs`, đưa từng file qua `validateDefinition` (bản sao của chính sách Tầng 1, nằm ở `tests/support/`) và bảo đảm key không trùng.
