<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Junctura Health

[![Checks](https://github.com/vku2-open-source-2026/junctura-health/actions/workflows/ci.yml/badge.svg)](https://github.com/vku2-open-source-2026/junctura-health/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![REUSE](https://img.shields.io/badge/REUSE-3.3-green.svg)](REUSE.toml)
[![npm](https://img.shields.io/npm/v/@junctura/health-contracts?label=health-contracts)](https://www.npmjs.com/package/@junctura/health-contracts)

**Trao đổi   dữ liệu y tế giữa trạm y tế, bệnh viện, nhà thuốc và bảo hiểm: chỉ khi người bệnh đồng ý, chỉ phần cần thiết, và mọi lần truy cập đều để lại dấu vết.**

Junctura Health là Tầng 2 (lĩnh vực y tế) xây trên [Junctura DX-OS](https://github.com/vku2-open-source-2026/junctura-dxos). Repo này là **repo tổng hợp** của bộ năm ứng dụng: chứa hợp đồng năng lực dùng chung, thư viện giao diện dùng chung, dữ liệu mẫu giả lập và công cụ dựng môi trường demo.

## Mục lục

- [Bài toán](#bài-toán)
- [Giải pháp](#giải-pháp)
- [Kiến trúc](#kiến-trúc)
- [Hợp đồng năng lực](#hợp-đồng-năng-lực)
- [Bắt đầu nhanh](#bắt-đầu-nhanh)
- [Cấu trúc repo](#cấu-trúc-repo)
- [Kiểm thử](#kiểm-thử)
- [Tài liệu](#tài-liệu)
- [Đóng góp](#đóng-góp)
- [Giấy phép](#giấy-phép)

## Bài toán

Một người bệnh khám ở trạm y tế xã rồi được chuyển lên bệnh viện. Bệnh viện hỏi lại tiền sử, dị ứng, tiêm chủng; giấy chuyển tuyến đi bằng tay; nhà thuốc không biết đơn có xung đột dị ứng hay không; bảo hiểm phải xin cả hồ sơ để kiểm tra một khoản chi. Dữ liệu nằm rải rác, hoặc bị chia sẻ quá mức cần thiết.

## Giải pháp

Mỗi bên giữ dữ liệu của mình và chỉ trả lời khi được hỏi qua Junctura, theo một **hợp đồng năng lực** định nghĩa trước dữ liệu vào, dữ liệu ra, bên được gọi và mục đích được phép.

| Nguyên tắc | Cách thực hiện |
| --- | --- |
| Người bệnh quyết định | Mỗi truy cập cần đồng thuận của người bệnh, đúng mục đích; thu hồi được bất cứ lúc nào |
| Chỉ chia sẻ phần cần thiết | Dữ liệu trả về nhỏ nhất theo hợp đồng. Bảo hiểm chỉ nhận câu trả lời có/không, không nhận hồ sơ |
| Cấp cứu có kiểm soát | Truy cập khẩn cấp phải ghi lý do và được rà soát sau |
| Có thể kiểm chứng | Nhật ký chuỗi băm không sửa được; người bệnh xem lại ai đã truy cập dữ liệu của mình |
| An toàn khi hiển thị | Danh sách dị ứng rỗng luôn hiện là "chưa ghi nhận", không bao giờ là "không dị ứng" (xem trường `allergyState`) |

## Kiến trúc

```text
  Clinic      Hospital      MyHealth      Pharmacy      Insurance
     \           |             |             |            /
      └──────────┴──────┬──────┴─────────────┴───────────┘
                        ▼
              Junctura DX-OS (Tầng 1)
   định danh · đồng thuận · vé gọi dùng một lần · nhật ký chuỗi băm
```

Các ứng dụng không gọi thẳng nhau và không đọc database của nhau. Bên gọi xin vé từ Junctura; bên cung cấp đổi vé, kiểm tra đồng thuận và mục đích, rồi mới trả dữ liệu.

| Repo | Vai trò |
| --- | --- |
| [junctura-dxos](https://github.com/vku2-open-source-2026/junctura-dxos) | Tầng 1: định danh, đồng thuận, vé gọi, nhật ký chuỗi băm, Console quản trị |
| **junctura-health** (repo này) | Hợp đồng năng lực, thư viện giao diện, dữ liệu mẫu, môi trường demo |
| [junctura-clinic](https://github.com/vku2-open-source-2026/junctura-clinic) | Trạm y tế xã: hồ sơ, hàng chờ khám, tiêm chủng, chuyển tuyến |
| [junctura-hospital](https://github.com/vku2-open-source-2026/junctura-hospital) | Bệnh viện: tiếp nhận chuyển tuyến, cảnh báo dị ứng, truy cập cấp cứu |
| [junctura-myhealth](https://github.com/vku2-open-source-2026/junctura-myhealth) | Sổ sức khỏe: cấp và thu hồi đồng thuận, xem ai đã truy cập |
| [junctura-pharmacy](https://github.com/vku2-open-source-2026/junctura-pharmacy) | Nhà thuốc: xác minh đơn thuốc trước khi phát |
| [junctura-insurance](https://github.com/vku2-open-source-2026/junctura-insurance) | Bảo hiểm: xác minh chi phí, chỉ nhận có/không |

Thư viện dùng chung: [`@junctura/health-contracts`](https://www.npmjs.com/package/@junctura/health-contracts) (hợp đồng), [`@junctura/health-ui`](https://www.npmjs.com/package/@junctura/health-ui) (giao diện React), [`@junctura/server-client`](https://www.npmjs.com/package/@junctura/server-client) (SDK Tầng 1).

## Hợp đồng năng lực

Định nghĩa một lần trong [`contracts/`](contracts/README.md), cài bằng `npm install @junctura/health-contracts`.

| Năng lực | Bên cung cấp | Bên gọi | Mục đích | Cấp cứu |
| --- | --- | --- | --- | --- |
| `pre-visit-summary` | Clinic | Hospital | `treatment` | Có |
| `allergy-list` | Clinic | Hospital, Pharmacy | `treatment`, `dispensing` | Có |
| `vaccination-history` | Clinic | Hospital | `treatment` | Không |
| `referral-summary` | Clinic | Hospital | `referral_intake` | Không |
| `prescription-verify` | Hospital | Pharmacy | `dispensing` | Không |
| `claim-verify` | Hospital | Insurance | `claim_review` | Không |

## Bắt đầu nhanh

**Yêu cầu:** Node.js 24 (xem `.node-version`), Git. Dựng môi trường demo cần thêm Docker và [junctura-dxos](https://github.com/vku2-open-source-2026/junctura-dxos) đặt cạnh repo này.

### Build từ mã nguồn và kiểm thử

```sh
git clone https://github.com/vku2-open-source-2026/junctura-health.git
cd junctura-health
npm run check
npm test
```

Có sẵn `../junctura-dxos` (hoặc đặt `JUNCTURA_DXOS_DIR`) thì `npm test` còn đối chiếu hợp đồng với bộ kiểm tra của chính Junctura.

### Dựng môi trường demo

```sh
# 1. Trong thư mục junctura-dxos
npm run setup
npm run local:up

# 2. Trong repo này
npm run demo:setup
```

`demo:setup` tạo 55 tài khoản demo, đăng ký 5 ứng dụng, công bố 6 năng lực và cấp quyền gọi theo bảng trên; chạy lại nhiều lần vẫn an toàn. Chi tiết, cổng và file sinh ra: [`demo/README.md`](demo/README.md). Sau đó chạy từng ứng dụng theo README của nó, ví dụ [junctura-clinic](https://github.com/vku2-open-source-2026/junctura-clinic#readme).

> Chạy cả bộ bằng một lệnh `docker compose` đang được hoàn thiện, theo dõi ở [Issues](https://github.com/vku2-open-source-2026/junctura-health/issues).

### Thư viện giao diện

```sh
npm run ui:install
npm run ui:test
npm run ui:build
npm run ui:preview   # trang xem thử mọi thành phần
```

## Cấu trúc repo

```text
contracts/   hợp đồng năng lực (npm: @junctura/health-contracts)
ui/          thư viện giao diện (npm: @junctura/health-ui)
seed/        bộ sinh dữ liệu mẫu giả lập, xác định theo seed
demo/        dựng môi trường demo trên Junctura DX-OS
docs/        thiết kế, UX, tính năng từng ứng dụng, hướng dẫn dựng app mới
skills/      skill thiết kế giao diện cho người và Claude Code
tests/       kiểm thử hợp đồng, dữ liệu mẫu, demo
scripts/     kiểm tra cú pháp và tuân thủ REUSE
```

Dữ liệu mẫu là **50 người bệnh giả lập ở Đà Nẵng** do [`seed/`](seed/README.md) sinh ra; cùng seed luôn cho cùng kết quả. Không có thông tin người thật.

## Kiểm thử

| Lệnh | Kiểm tra |
| --- | --- |
| `npm run check` | Cú pháp mã nguồn và tính hợp lệ của hợp đồng |
| `npm run check:reuse` | Tuân thủ REUSE 3.3 (cần `pip install -r requirements-reuse.txt`) |
| `npm test` | Hợp đồng, dữ liệu mẫu, logic dựng demo |
| `npm run ui:test` | Thư viện giao diện |

Mọi lệnh trên chạy tự động trong [CI](.github/workflows/ci.yml) cho mỗi PR.

## Tài liệu

| Tài liệu | Nội dung |
| --- | --- |
| [docs/new-app.md](docs/new-app.md) | Dựng một ứng dụng Tầng 2 mới, từng bước |
| [docs/APPS.md](docs/APPS.md) | Tính năng và dữ liệu của từng ứng dụng; ranh giới phần AI |
| [docs/DESIGN.md](docs/DESIGN.md) | Nguyên tắc thiết kế, quy tắc an toàn hiển thị |
| [docs/UX.md](docs/UX.md) | Người dùng, luồng việc, bố cục |
| [contracts/README.md](contracts/README.md) | Quy tắc hợp đồng và cách đổi hợp đồng |
| [CHANGELOG.md](CHANGELOG.md) | Lịch sử thay đổi |

## Đóng góp

Xem [CONTRIBUTING.md](CONTRIBUTING.md). Báo lỗi và đề xuất tại [Issues](https://github.com/vku2-open-source-2026/junctura-health/issues).

## Giấy phép

[Apache License 2.0](LICENSE), xem thêm [NOTICE](NOTICE). Mỗi file nguồn có header SPDX; file không ghi chú thích được (JSON, dữ liệu) được khai trong [REUSE.toml](REUSE.toml). Repo tuân thủ [REUSE 3.3](https://reuse.software/spec-3.3/).
