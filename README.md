<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Junctura Health

[![Checks](https://github.com/vku2-open-source-2026/junctura-health/actions/workflows/ci.yml/badge.svg)](https://github.com/vku2-open-source-2026/junctura-health/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![REUSE](https://img.shields.io/badge/REUSE-3.3-green.svg)](REUSE.toml)

**Junctura Health** là Tầng 2 của [Junctura DX-OS](https://github.com/vku2-open-source-2026/junctura-dxos) trong lĩnh vực y tế. Các ứng dụng độc lập (trạm y tế, bệnh viện, nhà thuốc, bảo hiểm, sổ sức khỏe của người bệnh) chia sẻ dữ liệu qua Junctura. Dữ liệu chỉ được chia sẻ khi người bệnh đồng ý, đúng mục đích, và người bệnh xem lại được ai đã truy cập.

Repo này là **repo tổng hợp**: chạy cả hệ thống bằng một lệnh, chứa hợp đồng năng lực dùng chung, dữ liệu mẫu giả lập và kịch bản demo.

> Trạng thái: đang xây dựng. Theo dõi tiến độ ở [Issues](https://github.com/vku2-open-source-2026/junctura-health/issues) và [CHANGELOG](CHANGELOG.md).

## Bài toán

Người bệnh khám ở trạm y tế xã, được chuyển tuyến lên bệnh viện. Bệnh viện phải hỏi lại tiền sử, dị ứng, tiêm chủng; giấy chuyển tuyến đi bằng tay; bảo hiểm phải xin cả hồ sơ để kiểm tra một khoản chi. Junctura Health cho các bên trao đổi đúng phần dữ liệu cần thiết, có đồng thuận, có nhật ký không sửa được.

## Các ứng dụng

| Repo | Vai trò |
| --- | --- |
| [junctura-dxos](https://github.com/vku2-open-source-2026/junctura-dxos) | Tầng 1: định danh, đồng thuận, vé gọi năng lực dùng một lần, nhật ký chuỗi băm, BPMN, Console quản trị |
| [junctura-health](https://github.com/vku2-open-source-2026/junctura-health) | Repo tổng hợp: compose, hợp đồng năng lực, dữ liệu mẫu, kịch bản demo |
| [junctura-clinic](https://github.com/vku2-open-source-2026/junctura-clinic) | Trạm y tế xã: hồ sơ ban đầu, tiêm chủng, gửi chuyển tuyến; cung cấp tóm tắt trước khám và danh sách dị ứng |
| [junctura-hospital](https://github.com/vku2-open-source-2026/junctura-hospital) | Bệnh viện: tiếp nhận chuyển tuyến, màn khám, cảnh báo dị ứng, truy cập cấp cứu có rà soát |
| [junctura-myhealth](https://github.com/vku2-open-source-2026/junctura-myhealth) | Sổ sức khỏe của tôi: cấp và thu hồi đồng thuận, xem ai đã truy cập dữ liệu của mình |
| [junctura-pharmacy](https://github.com/vku2-open-source-2026/junctura-pharmacy) | Nhà thuốc: xác minh đơn thuốc trước khi phát |
| [junctura-insurance](https://github.com/vku2-open-source-2026/junctura-insurance) | Bảo hiểm: xác minh chi phí, chỉ nhận câu trả lời có/không |

Mọi ứng dụng chỉ trao đổi với nhau qua Junctura, không gọi thẳng nhau và không đọc database của nhau. SDK dùng chung: [`@junctura/server-client`](https://www.npmjs.com/package/@junctura/server-client).

## Tài liệu thiết kế và tính năng

- [`docs/DESIGN.md`](docs/DESIGN.md): người dùng và bối cảnh, nguyên tắc, quy tắc an toàn hiển thị (thanh định danh, dị ứng, cảnh báo), nhận diện nối với Junctura Console, truy cập, nội dung tiếng Việt, danh sách thành phần dùng chung.
- [`docs/APPS.md`](docs/APPS.md): tính năng, các tab, dữ liệu nhập và dữ liệu lấy qua Junctura của từng ứng dụng; ranh giới của phần AI.
- [`ui/`](ui/README.md): thư viện giao diện dùng chung [`@junctura/health-ui`](https://www.npmjs.com/package/@junctura/health-ui) (React): thành phần an toàn y tế, token, chế độ sáng/tối, cỡ chữ. Cả năm ứng dụng dùng chung để giao diện thống nhất. `npm run ui:preview` mở trang xem thử mọi thành phần.
- [`skills/junctura-health-design`](skills/junctura-health-design/SKILL.md): skill cho người và Claude Code làm giao diện đúng chuẩn (chép vào `.claude/skills/` của repo app hoặc `~/.claude/skills/` để Claude Code tự dùng).

## Hợp đồng năng lực

Sáu năng lực dùng chung được định nghĩa một lần trong [`contracts/`](contracts/README.md): dữ liệu vào/ra, bên cung cấp, bên được gọi, mục đích được phép và có cho truy cập cấp cứu hay không.

| Năng lực | Bên cung cấp | Bên gọi | Mục đích | Cấp cứu |
| --- | --- | --- | --- | --- |
| `pre-visit-summary` | Clinic | Hospital | `treatment` | Có |
| `allergy-list` | Clinic | Hospital, Pharmacy | `treatment`, `dispensing` | Có |
| `vaccination-history` | Clinic | Hospital | `treatment` | Không |
| `referral-summary` | Clinic | Hospital | `referral_intake` | Không |
| `prescription-verify` | Hospital | Pharmacy | `dispensing` | Không |
| `claim-verify` | Hospital | Insurance | `claim_review` | Không |

## Dữ liệu mẫu

`npm run seed:generate` sinh 50 người bệnh giả lập ở Đà Nẵng (hồ sơ trạm y tế, chuyển tuyến, đơn thuốc, hồ sơ thanh toán) và danh sách tài khoản demo. Cùng một seed luôn ra cùng một kết quả. Xem [`seed/README.md`](seed/README.md).

## Môi trường demo

Với `junctura-dxos` đang chạy ở thư mục bên cạnh, `npm run demo:setup` tạo tài khoản demo, đăng ký 5 ứng dụng, công bố 6 năng lực và cấp grant theo hợp đồng. Xem [`demo/README.md`](demo/README.md).

## Yêu cầu

- Docker và Docker Compose
- Node.js 24 (xem `.node-version`)

## Build từ mã nguồn

```sh
git clone https://github.com/vku2-open-source-2026/junctura-health.git
cd junctura-health
npm run check
npm test
```

`npm test` kiểm tra hợp đồng; nếu có sẵn thư mục `../junctura-dxos` (hoặc đặt `JUNCTURA_DXOS_DIR`), test còn đối chiếu manifest với bộ kiểm tra của chính Junctura.

Thư viện giao diện (cần Node 24):

```sh
npm run ui:install
npm run ui:test
npm run ui:build
```

Hướng dẫn chạy cả hệ thống sẽ được bổ sung khi compose hoàn thiện.

## Đóng góp

Xem [CONTRIBUTING.md](CONTRIBUTING.md). Báo lỗi và đề xuất ở [Issues](https://github.com/vku2-open-source-2026/junctura-health/issues).

## Giấy phép

Mã nguồn phát hành theo [Apache License 2.0](LICENSE); xem thêm [NOTICE](NOTICE). Mỗi file nguồn ghi giấy phép bằng header SPDX; file không ghi chú thích được (JSON, dữ liệu) được khai trong [REUSE.toml](REUSE.toml). Repo tuân thủ [REUSE 3.3](https://reuse.software/spec-3.3/).

Dữ liệu người bệnh trong repo là dữ liệu giả lập do chính bộ sinh của dự án tạo ra ([`seed/`](seed/README.md)), không chứa thông tin người thật và không dùng công cụ hay bộ dữ liệu bên ngoài.
