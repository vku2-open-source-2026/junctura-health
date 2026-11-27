<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Gói Y tế cho Junctura Workspace

Thư mục này là gói ngành thật của Junctura Health theo [đặc tả gói v1 của Junctura Workspace](https://github.com/vku2-open-source-2026/junctura-workspace/blob/main/docs/PACK_FORMAT.md): `pack.json` (kê khai nhóm, loại đơn vị, loại hồ sơ, quy trình, cách mở hồ sơ và bước xử lý), `units.json` (đơn vị mẫu) và `workflows/*.bpmn20.xml` (một quy trình một tệp, có luồng nối đầy đủ từ start đến end). Workspace đọc gói qua bộ đọc gói (`readPack`) và cài qua `pack:install`; nhóm vai trò trong gói trở thành nhóm Keycloak ở Directory.

Toàn bộ dữ liệu là **tổng hợp**: "Sở Y tế Tỉnh X", "Bệnh viện X", "Trạm Y tế xã Y" không phải đơn vị thật.

## Các quy trình và đối chiếu với hợp đồng Y tế sẵn có

ID quy trình trong gói là ổn định vĩnh viễn. Nơi một ID trùng với cấu hình Y tế đã có của repo này, hai bên mô tả cùng một nghiệp vụ và phải giữ aligned:

| Quy trình của gói | Định nghĩa BPMN Tầng 2 sẵn có (`workflows/`) | Hợp đồng năng lực (`contracts/`) | Bản ghi lược đồ (`schemas/`) |
| --- | --- | --- | --- |
| `chuyentuyen` | `junctura_chuyen_tuyen` — `workflows/chuyen-tuyen.bpmn20.xml`, cùng chiều trạm y tế gửi — bệnh viện duyệt — hoàn tất | `referral-summary` | `clinic/clinic_referrals`, `hospital/hospital_admissions_v1` |
| `thanhtoan` | *(mới — không trùng `junctura_xac_minh_chi_phi`, quy trình đó là bảo hiểm xác minh chi phí, không phải duyệt chi)* | `claim-verify` (cùng mảnh chi phí điều trị) | `hospital/hospital_costs_v1`, `insurance/insurance_claims` |

Ghi chú ánh xạ:

- ID quy trình của gói là **khóa gọn không dấu gạch** (`chuyentuyen`, `thanhtoan`): bộ đọc gói yêu cầu `process/@id` của BPMN trùng `id` quy trình trong `pack.json`, còn chính sách nghi của Tầng 1 (DX-OS) chỉ nhận key `^[a-z][a-z0-9_]{2,63}$` — nên khóa gọn dùng chung cho cả hai nơi. `recordType` giữ nguyên ID công khai có dấu gạch (`chuyen-tuyen`, `thanh-toan`), và hai dạng viết là hai tên của cùng một nghiệp vụ, không phải một định danh dùng hai nơi.
- BPMN của gói gắn `flowable:candidateGroups` đúng vai trò (`role`) của từng bước trong `pack.json` (`y-ta`, `bac-si`, `tai-chinh`, `lanh-dao`) — nhóm vai trò trong gói trở thành nhóm Keycloak ở Directory. Mỗi bước có nhiều quyết định (`steps[].decisions`) rẽ nhánh tại `exclusiveGateway` theo ID quyết định (`${decision == '…'}`): `reject` kết thúc hồ sơ mà không duyệt, `request-info` lặp về bước trước đó, `approve`/`forward` đi tới bước kế tiếp đã khai báo.
- `tests/pack.test.mjs` giữ bảng trên không trôi: nó kiểm key `junctura_chuyen_tuyen` vẫn tồn tại trong `workflows/`, hai ID quy trình của gói trùng bảng, mọi quyết định được định tuyến đúng và cả hai định nghĩa của gói qua chính sách nghi của DX-OS (`validateDefinition(includeTasks: true)`).

## Phiên bản tương thích

- Kho Workspace hỗ trợ: **`junctura-workspace` tại commit `73171dae8d50031a6d52c8dde7cfcd82bebb68ef`** (đó là nơi schema `schemas/pack.schema.json`, `schemas/units.schema.json` và bộ đọc `server/packs.mjs` được dùng để kiểm gói). Đổi bản Workspace phải chạy lại kiểm tra bên dưới.
- Kèm theo đó, `@junctura/ui` RC `0.1.0-rc` từ đúng bản Workspace này được kiểm tương thích với giao diện Y tế qua `ui-compat/` (xem [`ui-compat/README.md`](../ui-compat/README.md)).

## Chạy kiểm tra

Kiểm tra dùng schema và bộ đọc gói **của bản Workspace đã ghim** — không sao chép bộ kiểm:

```sh
# 1. Chuẩn bị checkout Workspace ở bản đã ghim (CI tự làm bước này)
git clone https://github.com/vku2-open-source-2026/junctura-workspace .junctura-workspace
git -C .junctura-workspace checkout 73171dae8d50031a6d52c8dde7cfcd82bebb68ef

# 2. Cài phụ thuộc bộ đọc gói (ajv, saxes) theo lockfile của Workspace
npm --prefix .junctura-workspace/server ci

# 3. Chạy kiểm gói (một phần của npm test; chạy riêng được)
npm test                      # hoặc: node --test tests/pack.test.mjs
```

Không có checkout Workspace thì `tests/pack.test.mjs` bỏ qua (không làm hỏng các kiểm khác); đặt `JUNCTURA_WORKSPACE_DIR` tường minh sẽ khiến kiểm tra fail thay vì bỏ qua.
