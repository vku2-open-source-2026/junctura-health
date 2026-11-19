<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Cổng Junctura Health (portal)

Trang web **công khai, chỉ đọc** của Tầng 2: giới thiệu không gian năng lực y tế dùng chung, danh mục hợp đồng năng lực và các cơ sở tham gia. Không đăng nhập và không gọi API nào của Junctura lúc chạy; dữ liệu lấy lúc build từ `contracts/` và `demo/plan.mjs`. Người bệnh quản lý đồng thuận trong ứng dụng **Sổ sức khỏe (MyHealth)** của Tầng 3, không phải trên cổng này. Mọi chuỗi giao diện tiếng Việt nằm trong `src/strings.ts`.

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

`compose.yaml` mặc định chỉ mở cổng trên `127.0.0.1` (đổi bằng `PORTAL_BIND`), vì bản chạy thật luôn đứng sau một reverse proxy có TLS. `Caddyfile` chỉ phục vụ tệp tĩnh của `dist/`, kèm header bảo mật; CSP `connect-src 'self'` giữ được vì trang không gọi API ngoài nào. CSP `style-src` cho phép `unsafe-inline` cho các kiểu nội tuyến của React; ngoài ra chỉ còn `self`.

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

   Web app của từng cơ sở theo cùng mẫu: `clinic.junctura.studio` tới cổng `5181`, `hospital` `5182`, `myhealth` `5183`, `pharmacy` `5184`, `insurance` `5185`. Cổng chỉ hiển thị nội dung tĩnh, nên không cần đăng ký redirect hay web origin nào.
4. Tên miền `health.<domain>` chỉ dùng cho tài liệu của demo; ứng dụng của năm cơ sở thì dùng `npm run demo:setup -- --tenant <tenant> --domain junctura.studio` (xem [demo/README.md](../demo/README.md#chạy-trên-tên-miền-thật)).
