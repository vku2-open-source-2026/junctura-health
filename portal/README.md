<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Cổng Junctura Health (portal)

Ứng dụng giao diện của **Tầng 2**, không gian y tế liên thông do Sở Y tế điều phối. Gồm hai phần:

- **Phần công khai** (`#/`, `#/hop-dong`, `#/quy-trinh`, `#/co-so`): Tầng 2 là gì, hợp đồng dữ liệu, quy trình liên thông và các cơ sở tham gia. Dữ liệu lấy lúc build từ `contracts/`, `workflows/` và `demo/plan.mjs`, không gọi API.
- **Không gian làm việc** (cần đăng nhập Junctura, OIDC + PKCE, client `health-portal-web`), theo thứ tự H → P → D của đề OLP:
  - **H · Con người số, Làm việc** (`#/lam-viec`): việc hôm nay của cơ sở, bảng tin của Sở Y tế, danh bạ liên thông (`/v1/directory`).
  - **P · Quy trình số, Hồ sơ** (`#/ho-so`): mở hồ sơ liên thông (chuyển tuyến, xác minh đơn thuốc, xác minh chi phí) kèm biểu mẫu điều phối (mức khẩn, cơ sở nhận, ghi chú), hoàn tất bước của cơ sở mình, trao đổi và tệp đính kèm. Chạy trên API workflow của Tầng 1; hồ sơ không chứa bệnh án.
  - **D · Dữ liệu số, Điều hành** (`#/dieu-hanh`): số liệu sống cho Sở Y tế: hồ sơ chờ theo cơ sở, thời gian xử lý, trao đổi dữ liệu (nhật ký chuỗi băm của Tầng 1), bản đồ dữ liệu của từng cơ sở (chỉ số đếm, không nội dung), chia sẻ dữ liệu và năng lực theo hợp đồng.
  - **I · Trí tuệ số**: làm sau.

  Cơ sở của tài khoản lấy từ `seed/data/accounts.json`; các trang D, danh bạ và danh sách hồ sơ cần quyền `audit.read` mà `demo:setup` cấp cho tài khoản nhân viên. Link cũ `#/dieu-phoi` chuyển về `#/lam-viec`.

Người bệnh không đăng nhập ở đây: họ quản lý đồng thuận trong ứng dụng **Sổ sức khỏe (MyHealth)** của Tầng 3. Chuỗi giao diện tiếng Việt nằm trong `src/strings.ts` và `src/desk/strings.ts`.

## Backend (`portal/server/`)

Backend nhỏ của Cổng (`/api`, cùng origin, Node 24 + `node:http` + `@junctura/server-client`, không framework): lưu bản ghi **bảng tin** (`bang-tin`), **ghi chú** và **tệp đính kèm trên hồ sơ liên thông** (`ghi-chu`, `tep-dinh-kem`) vào Tầng 1 như một ứng dụng Junctura thật (client backend `health-portal-backend`; tệp lưu bằng `/v2/objects`, metadata là bản ghi `/v2/data`). Xác thực bằng token người dùng của client web `health-portal-web` (RS256 qua JWKS, kiểm `iss`/`exp`/`azp`); người bệnh bị từ chối (403), tác giả luôn lấy từ token.

| Biến môi trường | Ý nghĩa |
| --- | --- |
| `PORT`, `HOST` | Lắng nghe, mặc định `127.0.0.1:5190` |
| `JUNCTURA_URL` | Gateway Tầng 1 (HTTPS, hoặc HTTP loopback khi dev) |
| `JUNCTURA_APP_CLIENT_ID`, `JUNCTURA_APP_CLIENT_SECRET` | Client backend của ứng dụng `junctura-health-portal` (từ `.junctura/demo/junctura-health-portal.env`) |
| `OIDC_ISSUER` | Issuer mà token phải mang trong `iss` (mặc định lấy `JUNCTURA_ISSUER`) |
| `OIDC_KEYS_URL` | Tuỳ chọn: nơi lấy JWKS khi issuer không truy cập được từ trong container |

Hợp đồng API nằm ở `.orchestrator/api-contract.md` (dùng nội bộ). Chạy: `npm --prefix portal/server install && npm --prefix portal/server start`; test: `npm --prefix portal/server test`. Dev mode của giao diện chuyển tiếp `/api` tới `http://127.0.0.1:5190`; trong Docker service `api` của `portal/compose.yaml` đứng sau Caddy (`PORTAL_API_UPSTREAM`).

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
