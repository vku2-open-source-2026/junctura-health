<!--
SPDX-FileCopyrightText: 2026 Junctura Contributors
SPDX-License-Identifier: Apache-2.0
-->

# ui-compat — Điểm nhập Giao diện Y tế trên RC @junctura/ui

Điểm nhập (`src/index.ts`) là hình đích của `@junctura/health-ui` sau khi tách giao diện dùng chung: tái xuất toàn bộ 21 thành phần, token và tiện ích dùng chung từ `@junctura/ui` (RC của Junctura Workspace), giữ lại bằng tên riêng các thành phần đặc thù Y tế (`PatientBanner`, `AllergyStatus`/`AlertBanner`/`StaleNotice`/`SourceBadge`/`ConsentBadge`, `EmergencyBar`/`EmergencyDialog`, `QueueList`/`ActionList`, `AiSummaryPanel`), và thêm `HealthFrame` — bộ khung dùng AppShell của RC ôm PatientBanner của Y tế để chứng minh hai gói dựng cùng một cây React với cùng một bộ token.

Gói này **không nằm trong build thường** của `ui/` hay `portal/`: nó chỉ được cài và chạy bởi `scripts/check-ui-compat.mjs`, nên khi RC chưa phát hành, các build Y tế vẫn dùng nguyên trạng.

## Bản tương thích

- Kho Workspace: `junctura-workspace` tại commit `73171dae8d50031a6d52c8dde7cfcd82bebb68ef`.
- RC: `@junctura/ui` `0.1.0-rc` đọc từ đúng bản trên; script từ chối chạy nếu phiên bản trong checkout lệch.
- `@junctura/health-ui` `0.3.0` từ `ui/` của repo này; cả hai gói đều được nạp bằng tarball `npm pack` (đúng artifact phát hành), nên UI-compat luôn tiêu thụ một bản React duy nhất như khi phát hành thật.

## Chạy kiểm tra

Script tự build RC và Health UI khi thiếu `dist/`, đóng gói RC thành tarball (đúng artifact sẽ phát hành), cài tarball vào gói này kèm các phụ thuộc đã khai báo, rồi chạy `typecheck`, `test` và `build` tại chỗ:

```sh
node scripts/check-ui-compat.mjs
```

Chuẩn bị một lần (nếu chưa có):

```sh
git clone https://github.com/vku2-open-source-2026/junctura-workspace .junctura-workspace
git -C .junctura-workspace checkout 73171dae8d50031a6d52c8dde7cfcd82bebb68ef
npm run ui:install && npm run ui:build
```

`node_modules/` của gói này chỉ tồn tại sau lệnh kiểm, không có lockfile, và không có gì được phát hành hay lưu vào git.
