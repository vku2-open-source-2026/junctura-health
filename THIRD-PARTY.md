<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Thành phần bên thứ ba

Junctura Health phát hành theo [Apache License 2.0](LICENSE). Tài liệu này liệt kê những gì dự án dùng nhưng không phải do dự án viết, kèm giấy phép. **Không có mã nguồn bên thứ ba nào được chép vào repo**: thư viện được khai trong `package.json`, khóa phiên bản bằng `package-lock.json` và cài từ registry bằng `npm ci`.

Danh sách lấy từ trường `license` trong lockfile, ở phiên bản hiện tại. Khi thêm hoặc nâng cấp thư viện, cập nhật lại tài liệu này.

## 1. Gói do dự án phát hành

| Gói | Thư mục | Phụ thuộc bên thứ ba khi chạy | Giấy phép |
| --- | --- | --- | --- |
| [`@junctura/health-contracts`](https://www.npmjs.com/package/@junctura/health-contracts) | `contracts/` | Không | Apache-2.0 |
| [`@junctura/health-ui`](https://www.npmjs.com/package/@junctura/health-ui) | `ui/` | Có, xem mục 2 | Apache-2.0 |
| Bộ sinh dữ liệu mẫu, công cụ dựng demo | `seed/`, `demo/` | Không (chỉ module có sẵn của Node.js 24) | Apache-2.0 |

## 2. Thư viện của `@junctura/health-ui`

Đây là phụ thuộc đi cùng gói khi người dùng cài.

| Gói | Phiên bản | Giấy phép | Dùng để |
| --- | --- | --- | --- |
| react, react-dom | ^19 (peer dependency, người dùng gói tự cài) | MIT | Dựng giao diện |
| lucide-react | 1.71.0 | ISC | Biểu tượng |
| @fontsource-variable/inter | 5.3.0 | OFL-1.1 | Phông chữ Inter |
| @fontsource-variable/jetbrains-mono | 5.3.0 | OFL-1.1 | Phông chữ JetBrains Mono |
| @types/react, csstype | 19.3.0 / 3.2.3 | MIT | Kiểu TypeScript đi kèm |

**Phông chữ.** Inter và JetBrains Mono được phát hành theo [SIL Open Font License 1.1](https://openfontlicense.org/), cho phép dùng và phân phối kèm phần mềm. Phông là phụ thuộc thường, không nhúng sẵn vào gói và không bị sửa đổi.

## 3. Công cụ phát triển (không phân phối)

Chỉ dùng khi build và kiểm thử thư viện giao diện: TypeScript, Vite, Vitest, Testing Library, jsdom, Tailwind CSS, các công cụ đi kèm và phụ thuộc của chúng (khoảng 240 gói).

| Giấy phép | Số gói |
| --- | --- |
| MIT | 206 |
| ISC | 8 |
| MPL-2.0 | 13 |
| Apache-2.0 | 6 |
| BSD-2-Clause, BSD-3-Clause | 2 + 2 |
| MIT-0, 0BSD | 1 + 1 |
| CC-BY-4.0 | 1 |

Các gói MPL-2.0 là công cụ biên dịch (như `lightningcss`), dùng nguyên bản, không sửa và không đóng vào sản phẩm. Gói CC-BY-4.0 là dữ liệu trình duyệt hỗ trợ (`caniuse-lite`), chỉ dùng lúc build.

## 4. Dữ liệu và chuẩn mã

| Dữ liệu | Nguồn | Ghi chú |
| --- | --- | --- |
| Hồ sơ người bệnh mẫu (`seed/data/`) | Do bộ sinh `seed/generate.mjs` của dự án tạo ra từ bảng từ vựng nhóm tự viết | **Giả lập hoàn toàn**, không mô tả người thật |
| Mã chẩn đoán | ICD-10 (WHO) | Chỉ dùng mã trong dữ liệu giả lập |
| Mã vắc xin | CVX | Chỉ dùng mã trong dữ liệu giả lập |
