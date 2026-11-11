<!--
SPDX-FileCopyrightText: 2026 Junctura Contributors
SPDX-License-Identifier: Apache-2.0
-->

# @junctura/health-ui

Thư viện giao diện React dùng chung cho năm ứng dụng Junctura Health (Clinic, Hospital, MyHealth, Pharmacy, Insurance). Cài một lần, mọi app có cùng token, cùng thành phần an toàn y tế và cùng cách hiển thị. Quy tắc thiết kế: [`docs/DESIGN.md`](../docs/DESIGN.md).

## Cài đặt

```sh
npm install @junctura/health-ui react react-dom
```

Cần React 19. Phông Inter và JetBrains Mono là phụ thuộc thường (giấy phép SIL OFL), không nhúng sẵn trong gói.

## Dùng

```tsx
import "@junctura/health-ui/fonts.css";
import "@junctura/health-ui/styles.css";
import { DisplayPrefsProvider, ToastProvider, AppShell, PatientBanner } from "@junctura/health-ui";
```

- `styles.css`: stylesheet đủ dùng (token + các lớp Tailwind mà thành phần cần).
- App có Tailwind 4 riêng: nhập `@junctura/health-ui/tokens.css` rồi thêm thư viện vào `@source` để dùng chung token và viết bố cục riêng:

```css
@import "tailwindcss";
@import "@junctura/health-ui/tokens.css";
@source "../node_modules/@junctura/health-ui/dist/index.js";
```

Bọc ứng dụng trong `DisplayPrefsProvider` (cỡ chữ 16 / 17,5 / 19 px, chế độ sáng/tối, nhớ trong trình duyệt) và `ToastProvider` (thông báo có vùng `aria-live`).

## Thành phần

| Nhóm | Thành phần |
| --- | --- |
| Khung | `AppShell` (nhóm điều hướng, chọn trạm, tìm nhanh `/`, thông báo, menu tài khoản), `LandingPage`, `JuncturaMark`, `TextSizeSelector`, `ThemeToggle` |
| Bố cục | `PageHeader`, `WorkspaceLayout` (cột chính + cột bên), `Section`, `FormSection`, `StatStrip`, `SegmentedControl`, `Popover`, `CommandSearch` |
| An toàn y tế | `PatientBanner`, `AllergyStatus` (4 trạng thái), `AlertBanner` (4 mức), `SourceBadge`, `StaleNotice`, `ConsentBadge`, `EmergencyBar`, `EmergencyDialog`, `ConfirmDialog` |
| Dữ liệu | `QueueList` (hàng đợi dạng hành động), `ActionList` (việc cần xử lý), `DataTable` (sắp xếp được, bàn phím), `Timeline`, `StatCard`, `IdChip`, `Card`, `Badge` |
| Nhập liệu | `Button`, `TextField`, `TextAreaField`, `SelectField`, `Tabs` |
| Trạng thái | `EmptyState`, `ErrorState`, `PermissionState`, `Skeleton`, `ToastProvider` |
| AI | `AiSummaryPanel`: chỉ tóm tắt, mặc định tắt, luôn kèm nhãn "Tóm tắt do AI tạo, cần kiểm tra lại với hồ sơ gốc" |

Điều thư viện bảo đảm: "chưa ghi nhận dị ứng" và "không có dị ứng đã biết" là hai trạng thái khác nhau; mức cảnh báo luôn có chữ và biểu tượng, không chỉ màu; truy cập khẩn cấp bắt buộc có lý do và hai bước xác nhận.

## Phát triển

```sh
npm install
npm run preview     # trang xem thử mọi thành phần tại http://127.0.0.1:5190
npm test            # thành phần, axe (khả năng truy cập), tương phản token
npm run typecheck
npm run build
```

## Phát hành

Đẩy tag `ui-vX.Y.Z` (khớp `version` trong `package.json`); workflow `publish-ui` kiểm thử, rồi phát hành lên npm kèm provenance. Cần secret `NPM_TOKEN` trong repo.

Giấy phép Apache-2.0.
