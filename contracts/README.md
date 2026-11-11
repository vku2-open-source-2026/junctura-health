<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Hợp đồng năng lực Junctura Health

Nguồn duy nhất cho các năng lực mà ứng dụng Tầng 2 cung cấp và gọi qua Junctura. Bên cung cấp và bên gọi cùng dùng một định nghĩa, nên không lệch nhau.

## Cấu trúc

| Đường dẫn | Nội dung |
| --- | --- |
| `capabilities/<slug>.json` | Một hợp đồng: phiên bản, bên cung cấp, bên gọi, mục đích được phép, có cho cấp cứu không, tiêu đề, mô tả, schema vào/ra, thời gian chờ |
| `examples/<slug>.json` | Một cặp `input`/`output` hợp lệ, dùng cho test và dữ liệu demo |
| `index.mjs`, `index.d.ts` | Thư viện dùng chung (không phụ thuộc thư viện ngoài) |

Schema dùng đúng profile payload của Junctura: `object` (bắt buộc `properties`, `required`, `additionalProperties: false`), `array` (bắt buộc `maxItems`), `string` (bắt buộc `maxLength`), `integer`/`number` (bắt buộc `minimum`/`maximum`), `boolean`, `null`. Profile không có `enum` hay `pattern`, nên các giá trị cố định (ví dụ `severity`: `mild | moderate | severe`) được ghi trong `description` và do bên cung cấp đảm bảo.

## Quy tắc chung

- Mọi năng lực đều về **một người bệnh**. Người bệnh không nằm trong `input` mà đi qua `context.dataSubject` (Keycloak `sub` của người bệnh); Junctura kiểm tra đồng thuận của người đó trước khi cấp vé.
- Bên gọi luôn khai `context.purpose`, phải nằm trong `purposes` của hợp đồng.
- `emergency: true` (truy cập cấp cứu) chỉ dùng được với năng lực có `emergencyAccess: true`, kèm `justification`, và bị rà soát sau.
- **Dị ứng luôn kèm `allergyState`** (`allergy-list`, `pre-visit-summary`): `recorded` (có dị ứng đã ghi nhận), `none-known` (nhân viên đã xác nhận chưa biết dị ứng nào) hoặc `not-recorded` (chưa ghi nhận). Mảng `allergies` rỗng với `not-recorded` **không** có nghĩa là không dị ứng; bên gọi phải hiển thị "chưa ghi nhận dị ứng".
- Dữ liệu trả về là **tối thiểu**: ví dụ `claim-verify` chỉ trả `matches` có/không, không có chẩn đoán.

## Dùng trong ứng dụng

```js
import { buildManifest, checkContext, validateValue, getContract } from "@junctura/health-contracts";

// Bên cung cấp: đăng ký manifest với ID ứng dụng đã enroll.
const manifest = buildManifest("allergy-list", process.env.JUNCTURA_APP_ID);

// Bên cung cấp: sau khi đổi vé (SDK redeemTicket), kiểm tra context rồi mới trả dữ liệu.
const decision = checkContext("allergy-list", redeemed.context);
if (!decision.allowed) return reply(403, { error: decision.reason });

// Cả hai bên: kiểm tra dữ liệu đúng hợp đồng.
const issues = validateValue(getContract("allergy-list").outputSchema, output);
```

## Đổi hợp đồng

Mở PR ở repo này. Thay đổi không tương thích (bỏ trường, đổi kiểu, siết giới hạn) phải tăng **major** version; thêm trường không bắt buộc tăng **minor**. Cập nhật ví dụ, `CHANGELOG.md`, và báo các repo app liên quan.

## Cài đặt

```sh
npm install @junctura/health-contracts
```

Gói không phụ thuộc thư viện ngoài, chạy trên Node 24, có sẵn kiểu TypeScript (`index.d.ts`). Mỗi bản phát hành lên npm kèm provenance (có thể kiểm tra bản build đến từ repo này).

## Phát hành lên npm

Sau khi PR đổi hợp đồng đã merge: sửa `version` trong `contracts/package.json`, rồi đẩy tag trùng version:

```sh
git tag contracts-v1.0.0
git push origin contracts-v1.0.0
```

Workflow `Publish contracts library` kiểm tra tag khớp version, chạy test, rồi publish.
