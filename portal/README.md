<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Cổng Junctura Health (portal)

Ứng dụng web công khai của Tầng 2: trang giới thiệu không gian năng lực y tế dùng chung, và khu vực người bệnh đăng nhập để **quản lý đồng thuận** và **xem ai đã truy cập dữ liệu của mình** (MyHealth rút gọn). Chạy trực tiếp trên lõi Junctura bằng API `/v1/me/*`; mọi chuỗi giao diện tiếng Việt nằm trong `src/strings.ts`.

## Chạy dev

```sh
npm run portal:install
npm run portal:test        # vitest + testing-library
npm run portal:typecheck
npm run portal:build       # ra portal/dist
npm --prefix portal run dev   # http://localhost:5180, proxy /v1 và /identity tới JUNCTURA_URL (mặc định http://127.0.0.1:8080)
```

Yêu cầu: Node 24. Mật khẩu demo do `npm run demo:setup` tạo ra (xem [demo/README.md](../demo/README.md)); client `health-portal-web` được lệnh đó tạo sẵn.

## Cấu hình

- `public/config.json` nạp lúc chạy (không bake secret; bản thật không commit — đã có `.gitignore`). Mẫu ở `public/config.example.json`:

```json
{ "juncturaUrl": "", "issuer": "https://<host>/identity/realms/junctura", "clientId": "health-portal-web" }
```

- `juncturaUrl` rỗng = cùng origin (triển khai qua reverse proxy bên dưới). Khi đó `issuer` vẫn là URL công khai của realm Junctura.
- Thiếu `config.json` (ví dụ dev mới clone), cổng dùng cấu hình mặc định cho môi trường dev: cùng origin qua proxy của Vite.

## Đăng nhập

OIDC Authorization Code + PKCE (S256) tự viết, không dùng thư viện: `state` và `code_verifier` nằm trong `sessionStorage` chỉ trong lúc redirect; access token chỉ giữ trong bộ nhớ (`src/auth.ts`). Endpoint suy ra từ `issuer`, không gọi discovery: trình duyệt sang `issuer` công khai để đăng nhập và đăng xuất (trang đăng nhập giữ cookie trên host đó), còn đổi code lấy token đi qua `/identity` cùng origin của cổng, nên CSP `connect-src 'self'` vẫn giữ và không cần CORS. Gọi API qua `src/api.ts`: `request()` gắn Bearer và 401 sẽ đưa cổng về trạng thái chưa đăng nhập.

## Docker

```sh
docker build -f portal/Dockerfile -t junctura-health-portal .    # từ gốc repo (bundle dùng ../ui, ../contracts)
docker compose -f portal/compose.yaml up -d                      # cổng 5180
```

`compose.yaml` mặc định chỉ mở cổng trên `127.0.0.1` (đổi bằng `PORTAL_BIND`), vì bản chạy thật luôn đứng sau một reverse proxy có TLS. `compose.yaml` cần biến `JUNCTURA_UPSTREAM` (URL của stack Junctura) và mount `portal/config.json` (read-only). `Caddyfile` phục vụ `dist/` và reverse proxy `/v1/*`, `/v2/*`, `/identity/*` về stack, kèm header bảo mật cơ bản. CSP `style-src` cho phép `unsafe-inline` cho các kiểu nội tuyến của React; ngoài ra chỉ còn `self`.

## Triển khai trên subdomain

Ví dụ `health.junctura.studio`, cùng máy với stack Junctura và Caddy hệ thống:

1. DNS: bản ghi `A` cho `health.<domain>` (hoặc wildcard `*.<domain>`) trỏ về máy chủ.
2. `portal/config.json`:

   ```json
   { "juncturaUrl": "", "issuer": "https://junctura.studio/identity/realms/junctura", "clientId": "health-portal-web" }
   ```

   `issuer` là issuer công khai của Junctura, đúng bằng `PUBLIC_URL` của Junctura DX-OS cộng `/identity/realms/junctura`. Trang đăng nhập nằm ở đó; API và đổi token vẫn đi qua proxy cùng origin của cổng.
3. Chạy cổng: `JUNCTURA_UPSTREAM=http://host.docker.internal:8080 docker compose -f portal/compose.yaml up -d --build`.
4. Thêm site vào Caddy hệ thống, Caddy tự xin chứng chỉ TLS:

   ```caddy
   health.junctura.studio {
   	reverse_proxy 127.0.0.1:5180
   }
   ```

   Web app của từng cơ sở theo cùng mẫu: `clinic.junctura.studio` tới cổng `5181`, `hospital` `5182`, `myhealth` `5183`, `pharmacy` `5184`, `insurance` `5185`.
5. Mở redirect cho subdomain: `npm run demo:setup -- --tenant <tenant> --domain junctura.studio` (xem [demo/README.md](../demo/README.md#chạy-trên-tên-miền-thật)).
