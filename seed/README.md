<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Dữ liệu mẫu giả lập

Toàn bộ dữ liệu ở đây là **giả lập**, do bộ sinh của dự án (`generate.mjs`) tạo ra từ bộ từ vựng nhóm tự viết (`catalog.mjs`). Không có người thật, không dùng bộ dữ liệu hay công cụ bên ngoài. Mã chẩn đoán theo ICD-10 (WHO), mã vắc xin theo CVX.

```sh
npm run seed:generate   # ghi lại seed/data/*.json
npm run seed:check      # báo lỗi nếu dữ liệu đã commit không khớp bộ sinh
```

Cùng seed (`junctura-health/v1`) luôn ra các file giống hệt nhau từng byte.

## Các file

| File | Ứng dụng dùng | Nội dung |
| --- | --- | --- |
| `data/clinic.json` | junctura-clinic | 50 người bệnh: dị ứng, bệnh mạn, thuốc đang dùng, lượt khám, tiêm chủng; phiếu chuyển tuyến |
| `data/hospital.json` | junctura-hospital | Đơn thuốc và hồ sơ chi phí điều trị |
| `data/insurance.json` | junctura-insurance | Yêu cầu thanh toán bảo hiểm nhận được (có vài yêu cầu không khớp bệnh viện) |
| `data/accounts.json` | Junctura (Keycloak) | Tài khoản demo: nhân viên các cơ sở và mỗi người bệnh một tài khoản |

Mỗi người bệnh có `subject` cố định. Tài khoản Keycloak được tạo với đúng `subject` đó, nên `context.dataSubject` khi gọi năng lực trỏ thẳng tới hồ sơ người bệnh. **Không lưu mật khẩu**: khi dựng hệ thống demo, mật khẩu lấy từ `.env`.

## Hai người bệnh trong kịch bản demo

| Tài khoản | Người bệnh | Dùng trong cảnh |
| --- | --- | --- |
| `benhnhan.an` | Nguyễn Văn An, 1968, dị ứng Penicillin nặng, tăng huyết áp, đái tháo đường; chuyển tuyến `CT-2026-000123`, đơn `DT-2026-004521`, hồ sơ `HS-2026-00987` | Đồng thuận, chuyển tuyến, tóm tắt trước khám, cảnh báo dị ứng khi kê Amoxicillin, nhà thuốc, bảo hiểm, thu hồi đồng thuận |
| `benhnhan.binh` | Trần Thị Bình, 1975, dị ứng Aspirin, hen phế quản; chưa đồng thuận | Bị chặn khi không có đồng thuận, rồi truy cập cấp cứu |

Dữ liệu của An khớp với `contracts/examples/`.

## Ngày tháng

Mọi ngày được tính quanh ngày tham chiếu `2026-11-01`. Khi nạp vào hệ thống demo, gọi `rebase(dataset, "YYYY-MM-DD")` để dời tất cả các ngày đi cùng một khoảng, nhờ đó đơn thuốc vẫn còn hạn và lượt khám vẫn là "gần đây".

## Ánh xạ sang hợp đồng

`views.mjs` là cách tham chiếu chuyển bản ghi thành output của từng hợp đồng (`preVisitSummary`, `allergyList`, ...). Kết quả `null`/`undefined` nghĩa là không có bản ghi của đúng người bệnh đó; bên cung cấp phải từ chối, không trả dữ liệu của người khác.
