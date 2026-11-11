<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Dựng một ứng dụng Tầng 2 mới

Hướng dẫn cho người làm một ứng dụng Junctura Health mới (Hospital, Pharmacy, MyHealth, Insurance hoặc ứng dụng khác). Làm theo thứ tự;  mỗi bước nói rõ **dùng lại gì** và **tự viết gì**.

## 1. Nguyên tắc: dùng lại Tầng 1, không viết lại

[Junctura DX-OS](https://github.com/vku2-open-source-2026/junctura-dxos) (Tầng 1) đã có sẵn những phần dưới đây. Ứng dụng gọi qua SDK hoặc API, không tự viết lại.

| Việc | Ai làm | Cách dùng |
| --- | --- | --- |
| Đăng nhập, định danh người dùng | Tầng 1 (Keycloak, OIDC) | Giao diện đăng nhập bằng PKCE; máy chủ kiểm tra token (xem bước 4) |
| Đồng thuận của người bệnh | Tầng 1 | Khai `purpose` và `dataSubject` khi gọi; Tầng 1 kiểm tra đồng thuận |
| Gọi năng lực của app khác, vé dùng một lần | Tầng 1 | `@junctura/server-client`: `execute`, `redeemTicket` |
| Nhật ký không sửa được (chuỗi băm) cho các lần gọi năng lực | Tầng 1 | Tự động; xem trong Console |
| Đăng ký ứng dụng, duyệt, công bố năng lực, cấp grant | Tầng 1 | `npm run demo:setup` ở repo này làm cho cả 5 app demo |
| Lưu bản ghi đơn giản, tệp, quy trình duyệt (BPMN) | Tầng 1 | `createRecord`, `getRecord`, `putObject`, `startWorkflow` |
| Định nghĩa năng lực dùng chung | Repo này | `@junctura/health-contracts` |
| Giao diện y tế dùng chung | Repo này | `@junctura/health-ui` |
| Nghiệp vụ của app, giao diện, phân quyền theo vai trò trong app | **App tự làm** | |
| Nhật ký thao tác nội bộ của app (ai xem, ai sửa trong app) | **App tự làm** | Khác với nhật ký trao đổi qua Junctura |

Hai lưu ý:

- **Không gọi thẳng app khác và không đọc database của app khác.** Mọi trao đổi đi qua Junctura.
- **Kho bản ghi của Tầng 1 (`createRecord`, `getRecord`) là kho JSON đơn giản**: mỗi bản ghi tối đa 64 KiB, danh sách tối đa 100 dòng, không lọc, không tìm kiếm. Dữ liệu đơn giản thì dùng kho này. Nếu app cần tìm, lọc, sắp xếp, đếm (ví dụ tìm người bệnh không dấu) mà phải dùng cơ sở dữ liệu riêng, hãy ghi lý do ngắn vào README của app. Clinic làm theo cách này.

## 2. Chuẩn bị môi trường

- Node.js 24 (xem `.node-version`), Docker và Docker Compose.
- Clone `junctura-dxos` và `junctura-health` **cùng một thư mục cha** với repo app của bạn.
- Chạy Tầng 1 và đăng ký các app demo (xem [`demo/README.md`](../demo/README.md)):

  ```sh
  # trong junctura-dxos
  npm run setup
  npm run local:up
  # trong junctura-health
  npm run demo:setup
  ```

- `demo:setup` ghi thông tin kết nối riêng của từng app vào `junctura-health/.junctura/demo/junctura-<tên>.env` (không commit). Các biến chính:

  | Biến | Ý nghĩa |
  | --- | --- |
  | `JUNCTURA_URL` | Địa chỉ Gateway của Tầng 1 |
  | `JUNCTURA_APP_ID` | ID của ứng dụng đã đăng ký |
  | `JUNCTURA_APP_CLIENT_ID`, `JUNCTURA_APP_CLIENT_SECRET` | Tài khoản kỹ thuật của máy chủ app (bí mật, không đưa ra trình duyệt) |
  | `JUNCTURA_WEB_CLIENT_ID`, `JUNCTURA_ISSUER` | Client đăng nhập của giao diện (PKCE) và nhà cấp định danh |
  | `WEB_PORT` | Cổng giao diện: Clinic 5181, Hospital 5182, MyHealth 5183, Pharmacy 5184, Insurance 5185 |
  | `PROVIDER_HOST`, `PROVIDER_PORT` | Địa chỉ HTTPS để Junctura gọi năng lực của app (chỉ app cung cấp năng lực) |

## 3. Tạo khung ứng dụng

Chưa có bộ khởi tạo tự động. Cách nhanh nhất là **sao chép khung của [`junctura-clinic`](https://github.com/vku2-open-source-2026/junctura-clinic)** rồi đổi tên:

```
junctura-<tên>/
  server/      máy chủ Node: cấu hình, kiểm tra token, API, nghiệp vụ
  web/         giao diện React + Vite dựng trên @junctura/health-ui
  tests/       kiểm thử máy chủ (node --test)
  scripts/     check.mjs (header SPDX, không đóng gói thư viện), check-reuse.mjs
  .github/     ci.yml, mẫu Issue và PR
  LICENSE, LICENSES/, NOTICE, REUSE.toml, requirements-reuse.txt
  README.md, CHANGELOG.md, CONTRIBUTING.md, .env.example, .node-version
```

Sau khi sao chép: đổi tên gói trong `package.json`, `README.md`, cổng, ID client web; **xóa mã nghiệp vụ của Clinic**, chỉ giữ phần khung (cấu hình, đăng nhập, kiểm tra token, router, `scripts/`, CI).

## 4. Cài gói và đăng nhập

```sh
npm install @junctura/server-client @junctura/health-contracts   # máy chủ
npm --prefix web install @junctura/health-ui                     # giao diện
```

- **Đăng nhập (giao diện):** luồng PKCE với `JUNCTURA_WEB_CLIENT_ID`. Mật khẩu chỉ nhập trên trang của Junctura, ứng dụng không bao giờ thấy.
- **Kiểm tra token (máy chủ):** mỗi API kiểm tra chữ ký RS256, nhà cấp, `azp` và hạn của token, rồi lấy vai trò từ danh sách tài khoản của app. Dùng lại `server/jwt.mjs` của Clinic.
- **Vai trò:** lấy từ tài khoản Junctura. Vai trò theo app: Clinic `clinic-staff`, Hospital `physician`, Pharmacy `pharmacist`, Insurance `claims-assessor`, MyHealth `patient`. Tài khoản không thuộc app thì trả 403. Thao tác ghi phải kiểm tra quyền ở **máy chủ**, không chỉ ẩn nút trên giao diện.

## 5. Cung cấp năng lực (nếu app là bên cung cấp)

Bảng bên cung cấp và bên gọi nằm ở [README gốc](../README.md#hợp-đồng-năng-lực). Các bước của bên cung cấp:

1. Dùng định nghĩa trong hợp đồng, không tự đặt schema:

   ```js
   import { buildManifest, checkContext, validateValue, getContract } from "@junctura/health-contracts";
   const manifest = buildManifest("allergy-list", process.env.JUNCTURA_APP_ID); // đã được demo:setup công bố
   ```

2. Mở một điểm cuối **HTTPS** ở `PROVIDER_HOST:PROVIDER_PORT` (tạo chứng chỉ bằng `npm run provider:pki -- <tên>` trong `junctura-dxos`). Junctura gửi `POST` với `{ invocationId, capability, input }` và tiêu đề `Authorization` mang vé.
3. **Đổi vé trước khi làm bất cứ việc gì**, rồi kiểm tra context theo hợp đồng:

   ```js
   import { createJuncturaClient } from "@junctura/server-client";
   const junctura = createJuncturaClient({
     baseUrl: process.env.JUNCTURA_URL,
     clientId: process.env.JUNCTURA_APP_CLIENT_ID,
     clientSecret: process.env.JUNCTURA_APP_CLIENT_SECRET,
   });

   const redeemed = await junctura.redeemTicket({ authorization: req.headers.authorization, invocationId: body.invocationId, input: body.input });
   if (!redeemed.active) return reply(403);
   const decision = checkContext("allergy-list", redeemed.context);
   if (!decision.allowed) return reply(403, { error: decision.reason });
   ```

4. Lấy người bệnh từ `redeemed.context.dataSubject` (không lấy từ `input`), tạo dữ liệu **tối thiểu**, kiểm tra bằng `validateValue(getContract(slug).outputSchema, output)` rồi trả `200` với đúng `{ "output": ... }`.
5. Vé chỉ dùng một lần. Vé không hợp lệ hoặc đã dùng thì `active:false`: trả 403, không trả dữ liệu.

## 6. Gọi năng lực của app khác (nếu app là bên gọi)

```js
const execution = await junctura.execute(
  { kind: "capability", capability: { capabilityId, version, manifestDigest } }, // lấy từ junctura.discover()
  { /* input theo hợp đồng */ },
  undefined,
  { purpose: "treatment", dataSubject: patientSubject },   // purpose phải nằm trong hợp đồng
);
const result = await junctura.waitForExecution(execution.executionId);
```

- `purpose` phải nằm trong danh sách `purposes` của hợp đồng; app phải nằm trong `consumers`.
- Chưa có đồng thuận của người bệnh thì Junctura chặn. Giao diện phải hiện rõ "không xem được vì chưa có đồng thuận", không hiện như dữ liệu rỗng.
- Cấp cứu: thêm `emergency: true` và `justification`; chỉ với năng lực có `emergencyAccess: true`, và bị rà soát sau.
- Hiển thị dữ liệu nhận qua Junctura kèm nguồn và thời điểm (`SourceBadge`, `StaleNotice`).

## 7. Giao diện

- Dùng `@junctura/health-ui` cho khung ứng dụng, thanh người bệnh, cảnh báo dị ứng, bảng, form, hộp thoại. Đọc [`docs/DESIGN.md`](DESIGN.md) (quy tắc an toàn hiển thị) và [`docs/UX.md`](UX.md); tính năng từng app ở [`docs/APPS.md`](APPS.md).
- Xem thử mọi thành phần: `npm run ui:preview` trong repo này. Màn hình thật tham khảo ở `junctura-clinic/web/src`.
- Skill [`junctura-health-design`](../skills/junctura-health-design/SKILL.md) giúp Claude Code làm đúng chuẩn.
- Dữ liệu y tế: danh sách dị ứng rỗng hiển thị "chưa ghi nhận dị ứng", **không bao giờ** là "không dị ứng".

## 8. Kiểm thử và tài liệu

- Kiểm thử máy chủ (`node --test`): phân quyền, kiểm tra đầu vào, đúng định dạng hợp đồng, vé không hợp lệ.
- Kiểm thử giao diện (Vitest): màn hình chính, form, trạng thái lỗi và trạng thái trống.
- `README.md` của app: mục "Yêu cầu", "Build từ mã nguồn", "Chạy", năng lực cung cấp và gọi, vai trò, biến môi trường.
- `CHANGELOG.md`: ghi mọi thay đổi đáng chú ý vào mục `Unreleased`.

## 9. Quy trình làm việc

1. Mỗi việc là **một Issue** (mẫu "Công việc / Task").
2. Tạo nhánh từ `main` theo Issue: `feat/<việc>`, `fix/<việc>`, `docs/<việc>`.
3. Commit theo Conventional Commits. Không push thẳng lên `main`.
4. Mở PR: title tiếng Anh theo Conventional Commits, mô tả tiếng Việt theo mẫu, có `Closes #<số Issue>`. Cần CI xanh và một người khác duyệt.
5. **Muốn đổi hợp đồng năng lực**: mở PR ở repo `junctura-health` (thư mục `contracts/`), không sửa ở repo app. Đổi không tương thích thì tăng major.

## 10. Danh sách kiểm trước khi mở PR

- [ ] `npm run check`, `npm run check:reuse`, `npm test` xanh; giao diện: `npm run web:test`, `npm run build`
- [ ] Mọi file nguồn có header SPDX ở đầu file (mẫu trong `CONTRIBUTING.md`); file không ghi chú thích được thì khai trong `REUSE.toml`
- [ ] Không chép thư viện vào repo; `node_modules/` không có trong commit
- [ ] Không có bí mật (`.env`, khóa, token) trong commit; `.env.example` mô tả biến
- [ ] Chỉ dùng dữ liệu giả lập
- [ ] Thao tác ghi kiểm tra quyền ở máy chủ
- [ ] Không gọi thẳng app khác, không đọc database của app khác
- [ ] Giao diện dùng thành phần dùng chung, đúng quy tắc an toàn hiển thị
- [ ] README và CHANGELOG đã cập nhật
