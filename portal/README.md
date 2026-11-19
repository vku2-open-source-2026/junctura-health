<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Cổng Junctura Health (portal)

Ứng dụng giao diện của **Tầng 2**, không gian y tế liên thông do Sở Y tế điều phối. Gồm hai phần:

- **Phần công khai** (`#/`, `#/hop-dong`, `#/quy-trinh`, `#/co-so`): Tầng 2 là gì, hợp đồng dữ liệu, quy trình liên thông và các cơ sở tham gia. Dữ liệu lấy lúc build từ `contracts/`, `workflows/` và `demo/plan.mjs`, không gọi API.
- **Bàn điều phối liên thông** (`#/dieu-phoi`): nhân viên cơ sở và Sở Y tế đăng nhập bằng Junctura (OIDC + PKCE, client `health-portal-web`). Nhân viên mở hồ sơ liên thông (chuyển tuyến, xác minh đơn thuốc, xác minh chi phí) và hoàn tất bước của cơ sở mình; Sở Y tế theo dõi hồ sơ đang chờ ở đâu. Mọi thao tác gọi API workflow của Tầng 1 (`/v1/workflows/*`); hồ sơ chỉ mang mã tham chiếu, không chứa bệnh án. Cơ sở của tài khoản lấy từ `seed/data/accounts.json`; danh sách hồ sơ cần quyền `audit.read` mà `demo:setup` cấp cho các tài khoản nhân viên.

Người bệnh không đăng nhập ở đây: họ quản lý đồng thuận trong ứng dụng **Sổ sức khỏe (MyHealth)** của Tầng 3. Chuỗi giao diện tiếng Việt nằm trong `src/strings.ts` và `src/desk/strings.ts`.

## Chạy dev

```sh
npm run portal:install
npm run portal:test        # vitest + testing-library
npm run portal:typecheck
npm run portal:build       # ra portal/dist
npm --prefix portal run dev   # http://localhost:5180
```

Yêu cầu: Node 24.

## Docker

```sh
docker build -f portal/Dockerfile -t junctura-health-portal .    # từ gốc repo (bundle dùng ../ui, ../contracts)
docker compose -f portal/compose.yaml up -d                      # cổng 5180
```

`compose.yaml` mặc định chỉ mở cổng trên `127.0.0.1` (đổi bằng `PORTAL_BIND`), vì bản chạy thật luôn đứng sau một reverse proxy có TLS. `Caddyfile` phục vụ tệp tĩnh của `dist/` và chuyển `/v1/*`, `/identity/*` tới stack Junctura (`JUNCTURA_UPSTREAM`), nên trình duyệt chỉ nói chuyện với một origin và CSP `connect-src 'self'` giữ được; trang quản trị Keycloak (`/identity/admin`) bị chặn. CSP `style-src` cho phép `unsafe-inline` cho các kiểu nội tuyến của React; ngoài ra chỉ còn `self`.

## Triển khai trên subdomain

Ví dụ `health.junctura.studio`, cùng máy với stack Junctura và Caddy hệ thống:

1. DNS: bản ghi `A` cho `health.<domain>` (hoặc wildcard `*.<domain>`) trỏ về máy chủ.
2. Chạy cổng: `docker compose -f portal/compose.yaml up -d --build`.
3. Thêm site vào Caddy hệ thống, Caddy tự xin chứng chỉ TLS:

   ```caddy
   health.junctura.studio {
   	reverse_proxy 127.0.0.1:5180
   }
   ```

   Web app của từng cơ sở theo cùng mẫu: `clinic.junctura.studio` tới cổng `5181`, `hospital` `5182`, `myhealth` `5183`, `pharmacy` `5184`, `insurance` `5185`. Origin `https://health.<domain>` của cổng được `demo:setup --domain` thêm vào client `health-portal-web`.
4. Đăng ký origin cho cổng và năm ứng dụng: `npm run demo:setup -- --tenant <tenant> --domain junctura.studio` (xem [demo/README.md](../demo/README.md#chạy-trên-tên-miền-thật)).
