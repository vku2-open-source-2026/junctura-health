<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Môi trường demo

`npm run demo:setup` chuẩn bị một hệ thống Junctura DX-OS đang chạy cho kịch bản Junctura Health. Mọi thao tác đi qua Gateway thật, giữ nguyên tắc tách vai của Junctura: người đề xuất và người duyệt là hai tài khoản khác nhau.

## Chuẩn bị

1. Clone `junctura-dxos` **cạnh** repo này (hoặc đặt `JUNCTURA_DXOS_DIR` trong `.env`), rồi trong thư mục đó:

   ```sh
   npm run setup
   npm run local:up
   ```

2. Trong repo này:

   ```sh
   npm run demo:setup
   ```

Cần Docker đang chạy vì lệnh dùng công cụ vận hành của Junctura DX-OS (`scripts/lib/demo-stack.mjs`) từ thư mục bên cạnh; không có mã nào được chép sang repo này.

## Lệnh tạo ra gì

| Thành phần | Chi tiết |
| --- | --- |
| Tài khoản | 55 tài khoản từ `seed/data/accounts.json` (5 nhân viên, 50 người bệnh), cùng một mật khẩu demo |
| Ứng dụng | 5 ứng dụng (`health-clinic`, `health-hospital`, `health-myhealth`, `health-pharmacy`, `health-insurance`), mỗi ứng dụng có client backend và client web (PKCE) `health-<tên>-web` |
| Năng lực | 6 năng lực từ `contracts/`, đã kiểm tra, duyệt và công bố |
| Grant | 7 grant theo đúng bảng bên cung cấp / bên gọi của hợp đồng, hạn 90 ngày |
| Quản trị | `quantri.soyte` được quyền duyệt và rà soát trong Console |

Chạy lại bao nhiêu lần cũng được: cái gì đã có thì giữ nguyên.

## File sinh ra (không commit)

Tất cả nằm trong `.junctura/demo/`, đã được `.gitignore`:

| File | Nội dung |
| --- | --- |
| `<repo-app>.env` | Thông tin kết nối riêng của từng ứng dụng (ví dụ `junctura-clinic.env`): `JUNCTURA_URL`, `JUNCTURA_APP_ID`, client backend và secret, client web, cổng |
| `accounts.env` | Mật khẩu demo dùng chung, sinh ngẫu nhiên một lần nếu không đặt `DEMO_PASSWORD` |
| `subjects.json` | Ánh xạ `subject` trong dữ liệu mẫu sang `subject` thật do Keycloak cấp |

Lệnh yêu cầu Keycloak giữ đúng `subject` của dữ liệu mẫu. Nếu Keycloak cấp `subject` khác, lệnh sẽ báo, và ứng dụng nạp dữ liệu bằng `withSubjects(dataset, mapping)` từ `seed/generate.mjs`.

## Cổng và địa chỉ

| Ứng dụng | Giao diện web | Địa chỉ cung cấp năng lực |
| --- | --- | --- |
| junctura-clinic | http://localhost:5181 | `https://clinic.provider.internal:8443` |
| junctura-hospital | http://localhost:5182 | `https://hospital.provider.internal:8443` |
| junctura-myhealth | http://localhost:5183 | |
| junctura-pharmacy | http://localhost:5184 | |
| junctura-insurance | http://localhost:5185 | |

## Cho Junctura gọi được ứng dụng cung cấp

Sau khi chạy xong, lệnh in ra các bước này (thực hiện trong thư mục `junctura-dxos`):

```sh
npm run provider:pki -- clinic hospital
# thêm vào .env:
#   C4A_ENABLED=true
#   C4A_INTERNAL_PROVIDER_ORIGINS=["https://clinic.provider.internal:8443","https://hospital.provider.internal:8443"]
docker compose -f compose.yaml -f compose.providers.yaml up -d core
```

## Lưu ý

- Chỉ dùng cho môi trường local/demo. Tài khoản và mật khẩu demo không được dùng cho hệ thống thật.
- Dữ liệu y tế chỉ nằm ở tầng này (`seed/` và `demo/`); `junctura-dxos` (Tầng 1) không còn lệnh seed y tế riêng, nên Console chỉ hiện bộ ứng dụng do `npm run demo:setup` đăng ký.
