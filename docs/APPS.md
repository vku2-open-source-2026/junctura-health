<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Tính năng các ứng dụng Junctura Health

Mỗi ứng dụng là một **sản phẩm làm việc** của đúng nghề đó, dùng được độc lập. Junctura là lớp liên thông chạy bên dưới: các app chỉ trao đổi dữ liệu với nhau qua [hợp đồng năng lực](../contracts/README.md). Cách thiết kế giao diện nằm ở [`DESIGN.md`](DESIGN.md).

## 1. Nguyên tắc chung

- **Cấu trúc:** landing → đăng nhập bằng Junctura → không gian làm việc nhiều tab.
- **Dữ liệu riêng:** mỗi app có cơ sở dữ liệu SQLite riêng (mô-đun `node:sqlite` có sẵn của Node 24, không thêm thư viện), nạp dữ liệu mẫu ở lần chạy đầu từ `seed/` của repo này. App không đọc database của app khác.
- **Nhập liệu thật:** người dùng tạo và sửa dữ liệu của nghề mình; dữ liệu mẫu chỉ là điểm khởi đầu.
- **Qua Junctura:** muốn dữ liệu của app khác, app gọi năng lực bằng vé một lần với `context` (mục đích, người bệnh); muốn cung cấp, app đổi vé và trả đúng dữ liệu hợp đồng quy định.
- **Vai trò:** lấy từ tài khoản Junctura (`clinic-staff`, `physician`, `pharmacist`, `claims-assessor`, `patient`); tài khoản không thuộc app thì bị từ chối.
- **Mọi app có tab "Nhật ký"** cho các lần dữ liệu đi vào hoặc đi ra qua Junctura.

## 2. Clinic: trạm y tế

**Người dùng:** y sĩ, điều dưỡng, quản lý trạm. **Hỗ trợ nhiều trạm:** nhân viên thuộc một hay nhiều trạm; chọn trạm đang làm việc ở đầu trang; quản lý thấy tổng hợp các trạm mình phụ trách. Dữ liệu mẫu cần mở rộng thêm hai trạm.

| Tab | Chức năng |
| --- | --- |
| Tổng quan | Số ca hôm nay, hàng đợi, người bệnh có dị ứng nặng đang chờ, mũi tiêm quá hạn hoặc sắp đến hạn, phiếu chuyển tuyến đã gửi, việc cần làm |
| Tiếp đón | Tìm hoặc đăng ký người bệnh (họ tên, năm sinh, giới, phường, điện thoại, mã BHYT giả lập), nhận số, đánh dấu ưu tiên (khẩn, trẻ nhỏ, người cao tuổi) |
| Khám bệnh | Mở hồ sơ với thanh định danh; ghi lượt khám (lý do, sinh hiệu, chẩn đoán chọn từ danh mục ICD-10, xử trí); kê thuốc từ danh mục, có cảnh báo khi trùng dị ứng đã ghi nhận; xem tiền sử, dị ứng, thuốc đang dùng |
| Tiêm chủng | Lịch tiêm theo độ tuổi, mũi quá hạn, ghi mũi tiêm (vắc xin, mũi thứ mấy, lô, ngày) |
| Chuyển tuyến | Tạo phiếu (bệnh viện đích, mức khẩn, lý do, chẩn đoán sơ bộ, xử trí đã làm), theo dõi trạng thái, thấy bệnh viện đã truy cập khi nào |
| Báo cáo | Số ca theo ngày, nhóm bệnh, phường; tiêm chủng; chuyển tuyến; xuất CSV |
| Nhật ký | Mọi lần Junctura gọi năng lực của trạm: bên gọi, mục đích, có phải cấp cứu không, thời điểm, kết quả |
| Quản lý trạm | Nhân viên, vai trò, danh sách trạm |

**Dữ liệu nhập:** người bệnh, lượt khám, sinh hiệu, chẩn đoán, đơn thuốc, mũi tiêm, phiếu chuyển tuyến.
**Cung cấp qua Junctura:** `pre-visit-summary`, `allergy-list`, `vaccination-history`, `referral-summary`.
**Tóm tắt AI:** tóm tắt lịch sử khám trong hồ sơ.

## 3. Hospital: bệnh viện

**Người dùng:** nhân viên tiếp nhận, bác sĩ.

| Tab | Chức năng |
| --- | --- |
| Hàng đợi | Người bệnh đang chờ khám, sắp theo mức khẩn; trạng thái từng người |
| Tiếp nhận | Nhập mã người bệnh trên phiếu chuyển tuyến hoặc mã từ MyHealth; lấy `referral-summary` (mục đích `referral_intake`); nếu chưa có đồng thuận thì hiện trạng thái và đường đi tiếp (nhờ người bệnh cấp đồng thuận, hoặc truy cập cấp cứu) |
| Khám | Thanh định danh; tóm tắt trước khám và dị ứng nhận từ trạm, có nhãn nguồn và độ mới; tiêm chủng; ghi khám tại bệnh viện; kê đơn thuốc có cảnh báo dị ứng; tạo mã đơn |
| Cấp cứu | Khi bị chặn: nhập lý do, xác nhận hai bước, xem `pre-visit-summary` và `allergy-list` với dải "Truy cập cấp cứu"; lịch sử các lần cấp cứu |
| Đơn thuốc | Danh sách đơn đã kê, trạng thái đã phát hay chưa |
| Chi phí | Hồ sơ chi phí điều trị của từng lượt, trạng thái thanh toán bảo hiểm |
| Nhật ký | Các lần dữ liệu của bệnh viện được Junctura gọi và các lần bệnh viện gọi trạm |

**Dữ liệu nhập:** ghi khám, đơn thuốc, hồ sơ chi phí.
**Gọi qua Junctura:** `referral-summary`, `pre-visit-summary`, `allergy-list`, `vaccination-history`.
**Cung cấp qua Junctura:** `prescription-verify`, `claim-verify`.
**Tóm tắt AI:** tóm tắt hồ sơ nhận từ trạm thành một đoạn cho bác sĩ đọc nhanh.

## 4. MyHealth: sổ sức khỏe của tôi

**Người dùng:** người bệnh và người nhà. **Ưu tiên điện thoại**, chữ lớn, ngôn ngữ đời thường.

| Tab | Chức năng |
| --- | --- |
| Tổng quan | Bao nhiêu bên đang được xem dữ liệu của tôi, lần truy cập gần nhất, yêu cầu đang chờ tôi, nhắc tiêm |
| Đồng thuận | Cấp, gia hạn, thu hồi theo từng bên, từng mục đích, có hạn; lịch sử đồng thuận |
| Ai đã xem | Nhật ký truy cập dữ liệu của tôi, lọc theo bên và thời gian, truy cập cấp cứu được đánh dấu |
| Cấp cứu | Xem lại các lần truy cập cấp cứu: lý do, người thực hiện; xác nhận hợp lý hoặc báo cáo không hợp lý |
| Thông tin của tôi | Thông tin tự khai: liên hệ khẩn cấp, nhóm máu, ghi chú; mã QR hoặc mã để đưa cho nơi khám |
| Cài đặt | Cỡ chữ, sáng/tối, ngôn ngữ |

**Dữ liệu nhập:** thông tin tự khai, lựa chọn đồng thuận.
**Dùng qua Junctura:** đồng thuận, nhật ký truy cập và rà soát cấp cứu của chính người bệnh (các API dành cho chủ dữ liệu).
**Câu hỏi mở:** để người bệnh xem được hồ sơ do trạm và bệnh viện ghi, cần thêm một hợp đồng cho phép (ví dụ `health-record-view`, mục đích `patient_access`). Chốt ở một Issue riêng trước khi làm tab "Hồ sơ".
**Tóm tắt AI:** tóm tắt bằng ngôn ngữ đơn giản về những gì đã xảy ra với dữ liệu của tôi trong tháng.

## 5. Pharmacy: nhà thuốc

**Người dùng:** dược sĩ.

| Tab | Chức năng |
| --- | --- |
| Xác minh đơn | Nhập hoặc quét mã đơn; lấy `prescription-verify` (đơn có hợp lệ, hạn, danh sách thuốc, đã phát chưa); lấy `allergy-list` (mục đích `dispensing`); kết quả nhìn một lần: hợp lệ hay không, cảnh báo dị ứng |
| Phát thuốc | Xác nhận từng dòng thuốc, số lượng, lô; không cho phát khi đơn hết hạn hoặc đã phát |
| Lịch sử | Các lần đã phát và đã từ chối, kèm lý do |
| Kho | Danh mục thuốc, số lượng, hạn dùng, cảnh báo sắp hết và sắp hết hạn |
| Nhật ký | Các lần nhà thuốc gọi Junctura |

**Dữ liệu nhập:** phát thuốc, kho.
**Gọi qua Junctura:** `prescription-verify`, `allergy-list`.

## 6. Insurance: bảo hiểm

**Người dùng:** giám định viên.

| Tab | Chức năng |
| --- | --- |
| Hàng chờ | Yêu cầu thanh toán nhận được, lọc theo cơ sở, số tiền, trạng thái |
| Đối chiếu | Với mỗi yêu cầu, gọi `claim-verify` (mục đích `claim_review`); kết quả **chỉ có khớp hay không khớp**; ghi quyết định (chấp nhận, từ chối, yêu cầu giải trình) kèm lý do |
| Báo cáo | Tỷ lệ không khớp theo cơ sở, theo thời gian; tổng tiền chấp nhận và từ chối |
| Nhật ký | Các lần bảo hiểm gọi Junctura |

**Dữ liệu nhập:** quyết định giám định.
**Gọi qua Junctura:** `claim-verify`.
**Quy tắc riêng tư:** không bao giờ hiển thị chẩn đoán hay chi tiết điều trị; chỉ nhận câu trả lời có/không.

## 7. Landing của từng app

Mỗi app có landing riêng theo mẫu ở [`DESIGN.md`](DESIGN.md) mục 6. Ba giá trị chính:

| App | Ba điều cần nói với người dùng |
| --- | --- |
| Clinic | Ghi khám nhanh · Tiêm chủng không sót mũi · Chuyển tuyến không phải ghi lại từ đầu |
| Hospital | Nhận người bệnh đã có tóm tắt · Thấy dị ứng trước khi kê đơn · Có đường cấp cứu rõ ràng và được rà soát |
| MyHealth | Bạn quyết định ai được xem · Biết ai đã xem · Thu hồi bất cứ lúc nào |
| Pharmacy | Xác minh đơn trong vài giây · Cảnh báo dị ứng trước khi phát · Không cần xem toàn bộ hồ sơ |
| Insurance | Đối chiếu chi phí nhanh · Không nhận dữ liệu điều trị · Lý do quyết định được lưu lại |

## 8. AI tóm tắt

- **Chỉ tóm tắt** nội dung đã có trong hồ sơ. Không chẩn đoán, không đề xuất điều trị hay thuốc, không đưa ra quyết định.
- **Tắt mặc định.** Khi chưa cấu hình, app dùng tóm tắt theo mẫu có sẵn (không cần mô hình).
- **Khung gọi API tuỳ chọn:** cấu hình điểm cuối tương thích giao diện chat phổ biến (có thể là mô hình tự host). Hiện chỉ dựng khung, chưa gắn sâu vào luồng.
- **Luôn có nhãn:** "Tóm tắt do AI tạo, cần kiểm tra lại với hồ sơ gốc", kèm liên kết tới dữ liệu gốc.
- **Riêng tư:** chỉ gửi dữ liệu giả lập khi demo; khi dùng dịch vụ ngoài phải có thông báo rõ và đồng thuận của người bệnh; không ghi nội dung hồ sơ vào nhật ký ứng dụng.
- **Thành phần giao diện:** `AiSummaryPanel`.

## 9. Kịch bản demo qua các app

1. **MyHealth:** An cấp đồng thuận cho Bệnh viện Đà Nẵng xem tiền sử (mục đích điều trị, 120 ngày).
2. **Clinic:** y sĩ tạo phiếu chuyển tuyến `CT-2026-000123` cho An.
3. **Hospital:** tiếp nhận An, thấy tóm tắt trước khám từ trạm; khi kê Amoxicillin hiện cảnh báo dị ứng Penicillin nặng.
4. **Pharmacy:** xác minh đơn `DT-2026-004521`, cảnh báo dị ứng, phát thuốc.
5. **Insurance:** đối chiếu hồ sơ `HS-2026-00987`, kết quả khớp, không thấy chẩn đoán.
6. **MyHealth:** An xem ai đã truy cập dữ liệu của mình, rồi thu hồi đồng thuận của bệnh viện; bệnh viện thử lại và bị chặn.
7. **Cấp cứu (Bình):** Bình chưa đồng thuận, bệnh viện bị chặn, xin truy cập cấp cứu với lý do; Bình thấy lần truy cập trong MyHealth.

## 10. Mức độ làm

| App | Mức | Ghi chú |
| --- | --- | --- |
| Clinic | Sâu | Nhập liệu nhiều nhất, nhiều trạm |
| Hospital | Sâu | Luồng tiếp nhận, kê đơn, cấp cứu |
| MyHealth | Sâu | Đồng thuận và nhật ký là điểm khác biệt của Junctura |
| Pharmacy | Vừa | Xác minh, phát thuốc, kho đơn giản |
| Insurance | Vừa | Hàng chờ, đối chiếu, báo cáo |
