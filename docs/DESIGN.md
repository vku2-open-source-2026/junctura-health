<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Hướng dẫn thiết kế Junctura Health

Tài liệu này là nguồn chung cho giao diện của cả năm ứng dụng y tế (Clinic, Hospital, MyHealth, Pharmacy, Insurance). Mục tiêu: một người dùng chuyển từ app này sang app khác vẫn thấy cùng một hệ thống, và không màn hình nào làm người dùng hiểu nhầm một dữ kiện y tế.

Tính năng từng app nằm ở [`APPS.md`](APPS.md). Thành phần dùng chung sẽ nằm ở thư viện `@junctura/health-ui` (xây theo tài liệu này).

## 1. Ranh giới hai tầng

- **Tầng 1 (`junctura-dxos`)** không có nghiệp vụ y tế: định danh, đồng thuận, năng lực, nhật ký, Console quản trị.
- **Tầng 2 (repo này và bốn repo app)** mới có người bệnh, đơn thuốc, chuyển tuyến. Mọi dữ liệu và màn hình y tế nằm ở đây.
- Giao diện y tế **không** được thêm vào Console. Console tự có thông tin khi các app đăng ký ứng dụng, năng lực và grant qua API của Junctura.

## 2. Người dùng và bối cảnh

| Ứng dụng | Người dùng | Thiết bị và môi trường | Nhu cầu chính | Hệ quả thiết kế |
| --- | --- | --- | --- | --- |
| Clinic | Y sĩ, điều dưỡng trạm xã | Máy tính dùng chung, mạng chậm, nhiều người bệnh trong ngày | Tìm người bệnh trong vài giây, ghi lượt khám nhanh, thấy ngay dị ứng | Tìm kiếm toàn cục, form ngắn, phím tắt, dị ứng luôn nằm trong thanh định danh |
| Hospital | Bác sĩ, tiếp nhận | Máy tính để bàn, áp lực thời gian, quyết định lâm sàng | Biết đúng người bệnh, biết dữ liệu từ đâu và mới tới mức nào, xin truy cập cấp cứu khi bị chặn | Thanh định danh cố định, nhãn nguồn và độ mới trên mọi dữ liệu nhận từ nơi khác, luồng cấp cứu có lý do |
| MyHealth | Người bệnh, người nhà, nhiều người lớn tuổi | Điện thoại là chính, ít quen công nghệ | Hiểu mình đã đồng ý điều gì, ai đã xem, thu hồi dễ | Chữ lớn, ngôn ngữ đời thường, hành động rõ, bố cục một cột trên điện thoại |
| Pharmacy | Dược sĩ | Quầy thuốc, thao tác nhanh, đôi khi máy tính bảng | Biết đơn có hợp lệ, còn hạn, đã phát chưa, có dị ứng không | Kết quả xác minh nhìn một lần là hiểu, nút to, ít nhập liệu |
| Insurance | Giám định viên | Máy tính, xử lý nhiều hồ sơ liên tiếp | Đối chiếu nhanh, ghi quyết định có lý do | Bảng dày thông tin, duyệt bằng bàn phím, chỉ nhận câu trả lời có/không |
| Console (Tầng 1) | Quản trị hệ thống | Máy tính | Quản lý ứng dụng, grant, kiểm toán | Đã có sẵn; là chuẩn thị giác cho các app trên |

## 3. Nguyên tắc

1. **An toàn trước tiên.** Khi đẹp mắt xung đột với việc người dùng hiểu đúng một dữ kiện y tế, ưu tiên hiểu đúng.
2. **Một người bệnh, một ngữ cảnh.** Khi đang mở hồ sơ, luôn thấy đang xem ai. Không để dữ liệu của hai người cùng hiện một màn hình.
3. **Nói rõ nguồn và độ mới.** Dữ liệu nhận qua Junctura luôn ghi "Từ <cơ sở> · cập nhật <ngày>". Dữ liệu nhập tại chỗ ghi khác đi, để không lẫn.
4. **Đồng thuận nhìn thấy được.** Mọi lần xem dữ liệu của người khác nói rõ mục đích, và trạng thái đồng thuận hiện ngay cạnh dữ liệu.
5. **Ít bước cho việc lặp lại.** Việc làm hàng chục lần mỗi ngày (tìm người bệnh, ghi lượt khám) phải làm được bằng bàn phím và không quá ba bước.
6. **Không dựa vào màu.** Mọi trạng thái có thêm biểu tượng hình và chữ.
7. **Tiếng Việt tự nhiên và nhất quán.** Cùng một khái niệm dùng cùng một từ ở mọi app.
8. **Một hệ thiết kế cho cả bộ.** Không app nào tự chọn màu, font, khoảng cách hay kiểu nút riêng; dùng thư viện dùng chung.

## 4. Quy tắc an toàn hiển thị

Các quy tắc này bắt buộc với mọi app có màn hình chứa dữ liệu người bệnh.

### 4.1. Thanh định danh người bệnh

- Hiện khi mở hồ sơ **một** người bệnh; không hiện ở danh sách nhiều người.
- Đặt ở đầu vùng nội dung, rộng hết chiều ngang, dính ở trên khi cuộn, không bị phần tử khác che.
- Gồm theo thứ tự: **họ và tên**, **năm sinh (tuổi)**, **giới**, **mã người bệnh**. Mỗi mục có nhãn.
- **Không cắt ngắn tên.** Thanh xuống dòng chứ không dùng dấu "…".
- Giá trị chưa biết viết "Chưa rõ" ngay sau nhãn, không dùng "-" hay "?".
- Có vùng phụ thu gọn được (liên hệ, ghi chú); trạng thái dị ứng nằm ở thanh chính, không giấu trong vùng thu gọn.

### 4.2. Bốn trạng thái dị ứng

Dị ứng luôn thuộc đúng một trong bốn trạng thái. Không bao giờ gộp "chưa ghi nhận" với "không có".

| Nhãn | Khi nào dùng |
| --- | --- |
| **Có dị ứng đã ghi nhận** | Có ít nhất một dị ứng. Liệt kê chất, mức độ, phản ứng, ngày cập nhật |
| **Không có dị ứng đã biết** | Chỉ khi nhân viên y tế đã xác nhận là không có |
| **Chưa ghi nhận dị ứng** | Hồ sơ chưa có dữ liệu dị ứng |
| **Không xem được dị ứng** | Không có đồng thuận, không có quyền hoặc mất kết nối tới nơi giữ dữ liệu |

Dị ứng mức nặng luôn nổi bật hơn các mức khác, kể cả khi thu gọn.

### 4.3. Cảnh báo

| Mức | Ý nghĩa | Hành vi |
| --- | --- | --- |
| Nghiêm trọng | Có thể gây hại ngay (ví dụ kê thuốc trùng dị ứng nặng) | Chặn thao tác, buộc xác nhận có lý do, đọc được bằng trình đọc màn hình (`role="alert"`) |
| Cảnh báo | Cần chú ý trước khi tiếp tục | Hiện nổi bật, không chặn |
| Lưu ý | Thông tin nên biết | Hiện trong dòng, không chiếm chú ý |
| Thông tin | Trạng thái hệ thống | Hiện nhẹ |

- Mỗi mức có **màu, biểu tượng hình và chữ**; phân biệt được cả khi hiển thị đen trắng.
- Cùng một cảnh báo dùng cùng biểu tượng và cùng câu chữ ở mọi app.
- Không nhấp nháy. Không dùng cảnh báo cho việc không quan trọng, vì cảnh báo dùng quá nhiều sẽ bị bỏ qua.
- Cảnh báo dựa trên dữ liệu đã ghi nhận (ví dụ thuốc trùng chất dị ứng), không phải gợi ý điều trị.

### 4.4. Dữ liệu từ nơi khác

- Huy hiệu nguồn: "Từ Trạm Y tế Hòa Khánh Bắc · cập nhật 28/10/2026".
- Dữ liệu cũ hơn ngưỡng của từng loại (đề xuất: dị ứng 12 tháng, thuốc đang dùng 3 tháng) hiện thêm lưu ý "Dữ liệu có thể đã cũ".
- Dữ liệu bị từ chối vì thiếu đồng thuận **không** hiện như dữ liệu rỗng: hiện trạng thái "Chưa có đồng thuận" cùng việc có thể làm tiếp.

### 4.5. Truy cập cấp cứu

- Chỉ ở năng lực cho phép cấp cứu (tóm tắt trước khám, danh sách dị ứng).
- Buộc nhập lý do, xác nhận hai bước, nói rõ "Lần truy cập này sẽ được người bệnh và đơn vị quản lý xem lại".
- Khi đang xem dữ liệu bằng cấp cứu, dải màu cố định trên đầu: "Truy cập cấp cứu · lý do: …".

### 4.6. Hành động không hoàn tác

Thu hồi đồng thuận, huỷ đơn, gửi phiếu chuyển tuyến: hộp xác nhận nêu rõ **việc sẽ xảy ra** ("Bệnh viện Đà Nẵng sẽ không xem được tiền sử của bạn nữa"), nút xác nhận mang tên hành động ("Thu hồi đồng thuận"), không dùng "OK".

### 4.7. Định dạng

- Ngày `dd/mm/yyyy`, giờ 24 giờ, múi giờ Việt Nam; số theo `vi-VN` (1.234,5).
- Mã định danh (`CT-…`, `DT-…`, `HS-…`) dùng font đơn cách và có nút sao chép.

## 5. Nhận diện thị giác

Lấy từ Junctura Console (`junctura-dxos`, `console/src/index.css` và `docs/CONSOLE.md`) để hai tầng trông cùng một sản phẩm. Nếu Console đổi, đổi theo.

| Token | Giá trị sáng | Dùng cho |
| --- | --- | --- |
| Stone Ink | `#172F3D` | Chữ chính, cấu trúc tối |
| Junctura Blue | `#176B80` | Màu tương tác chính (nút, liên kết, focus) |
| Mediterranean Teal | `#18877A` | Thành công, trạng thái tốt |
| Warm Sandstone | `#C58B62` | Điểm nhấn phụ (không dùng làm màu chữ) |
| Nền ứng dụng | `#F4F6F6` | Nền trang |
| Bề mặt | `#FFFFFF` | Thẻ, bảng |
| Viền | `#DCE3E5` | Đường viền |
| Cảnh báo | `#A8772F` (nền `#FBF4EE`) | Mức cảnh báo, lưu ý |
| Lỗi | `#B4453F` (nền `#F8E9E8`) | Mức nghiêm trọng, lỗi |
| Thông tin | `#176B80` (nền `#E5F0F3`) | Thông tin |

- Chế độ tối dùng bộ giá trị tương ứng của Console (`.dark`), người dùng chọn được và máy nhớ lựa chọn.
- **Font:** Inter cho giao diện, JetBrains Mono cho mã và định danh. Cỡ chữ gốc 17,5 px; người dùng chọn 16 / 17,5 / 19 px. MyHealth mặc định cỡ lớn.
- **Hình khối:** bo góc 4 / 8 / 12 / 16 px, bóng nhẹ. Khoảng cách theo bội số của 4 px.
- **Nhận diện từng app:** mọi app dùng cùng màu tương tác; khác nhau ở tên, biểu tượng riêng (cùng bộ nét) và mô tả. Không dùng màu riêng cho từng app để tránh người dùng nhầm màu với mức cảnh báo.
- **Tương phản:** kiểm tra từng cặp màu chữ và nền bằng công cụ trước khi dùng; không dùng Sandstone làm màu chữ trên nền sáng. Console ghi chú chưa kiểm định WCAG đầy đủ, nên chúng ta kiểm lại ở thư viện dùng chung.

## 6. Bố cục

- **Landing** (trước đăng nhập): tên và vai trò của app, ba giá trị chính theo người dùng của app đó, nút "Đăng nhập với Junctura", liên kết tới tài liệu và mã nguồn. Cho biết app kết nối với Junctura ra sao. Không giới thiệu dài dòng.
- **Đăng nhập**: chuyển sang Junctura (OpenID Connect, PKCE); quay về đúng trang đang mở.
- **Không gian làm việc**: đầu trang (logo app, chọn cơ sở nếu có, tìm kiếm toàn cục, cỡ chữ, sáng/tối, tài khoản) + thanh điều hướng (thanh bên trên máy tính, thanh dưới trên điện thoại ở MyHealth) + vùng nội dung. Mỗi tab có tiêu đề, thao tác chính và bộ lọc ở vị trí cố định.
- **Mọi màn hình có đủ bốn trạng thái**: đang tải (khung chờ, không xoay vô tận), rỗng (nói việc tiếp theo nên làm), lỗi (nguyên nhân + cách thử lại + không lộ chi tiết kỹ thuật), không đủ quyền (nói ai cấp quyền).
- **Điện thoại**: một cột, vùng chạm tối thiểu 44 px ở MyHealth.

## 7. Truy cập (WCAG 2.2 mức AA)

- Tương phản chữ ≥ 4,5:1, thành phần giao diện ≥ 3:1; vùng chạm tối thiểu 24×24 px (44 px ở MyHealth).
- Dùng được hoàn toàn bằng bàn phím; vòng focus luôn thấy; thứ tự Tab theo thứ tự hiển thị.
- Mọi ô nhập có nhãn thật; lỗi gắn với ô và đọc được bằng trình đọc màn hình; thông báo tạm dùng vùng `aria-live`.
- `lang="vi"`; phóng to 200% không mất nội dung; tôn trọng `prefers-reduced-motion`.
- Màu không là kênh thông tin duy nhất.

Chúng ta tự kiểm tra và ghi kết quả; đây **không phải** chứng nhận.

## 8. Nội dung tiếng Việt

| Dùng | Không dùng |
| --- | --- |
| người bệnh | bệnh nhân, khách |
| đồng thuận | consent, cho phép chung chung |
| chuyển tuyến | refer |
| tóm tắt trước khám | pre-visit summary |
| truy cập cấp cứu | emergency access |
| nhật ký truy cập | log, audit |
| trạm y tế | clinic (trong chữ hiển thị) |

- Câu ngắn, động từ rõ, nói với người dùng ("Bạn đã đồng ý cho Bệnh viện Đà Nẵng xem tiền sử đến 12/01/2027").
- Thông báo lỗi có ba phần: chuyện gì xảy ra, vì sao (nếu biết), làm gì tiếp.
- Không dùng viết tắt lạ; BHYT, CCCD, ICD-10 được dùng khi người dùng nghề đã quen.
- Dữ liệu y khoa trong ví dụ và màn hình demo luôn là dữ liệu giả, ghi rõ ở chân trang của bản demo.

## 9. Thành phần dùng chung (`@junctura/health-ui`)

| Thành phần | Mô tả |
| --- | --- |
| `AppShell` | Đầu trang, điều hướng, vùng nội dung, chọn cơ sở, tìm kiếm toàn cục |
| `LandingPage` | Khung landing theo mẫu mục 6 |
| `PatientBanner` | Thanh định danh (mục 4.1) |
| `AllergyStatus` | Bốn trạng thái dị ứng (mục 4.2) |
| `AlertBanner`, `InlineNotice` | Bốn mức cảnh báo (mục 4.3) |
| `SourceBadge`, `StaleNotice` | Nguồn và độ mới của dữ liệu (mục 4.4) |
| `ConsentBadge` | Trạng thái đồng thuận kèm mục đích và hạn |
| `EmergencyBar`, `EmergencyDialog` | Truy cập cấp cứu (mục 4.5) |
| `ConfirmDialog` | Hành động không hoàn tác (mục 4.6) |
| `Button`, `Badge`, `Card`, `Tabs`, `DataTable`, `FormField` | Thành phần nền |
| `IdChip` | Mã định danh đơn cách có nút sao chép |
| `Timeline` | Lượt khám, nhật ký truy cập |
| `StatCard`, `Chart` | Chỉ số và biểu đồ theo bảng màu Console |
| `EmptyState`, `ErrorState`, `Skeleton`, `Toast` | Trạng thái và thông báo |
| `TextSizeSelector`, `ThemeToggle`, `LocaleText` | Cỡ chữ, sáng/tối, định dạng ngày số |
| `AiSummaryPanel` | Khung hiển thị tóm tắt do AI tạo (xem `APPS.md`, mục AI) |

## 10. Tham khảo

Chúng ta chỉ lấy **nguyên tắc**, không chép mã, biểu tượng hay nhãn hiệu của bên thứ ba.

- NHS, Common User Interface: [Patient Banner](https://pacharanero.github.io/nhs-cui/patient-identification-and-information-entry-and-display/patben) (thanh định danh, bốn trạng thái dị ứng) và [Alert symbol design](https://pacharanero.github.io/nhs-cui/consistent-navigation/alertsymbdes) (cảnh báo có hình, màu, chữ; nhất quán).
- NHS Service Manual, [Service standard 16: make your service clinically safe](https://service-manual.nhs.uk/service-standard/16-make-your-service-clinically-safe).
- NIST, [NISTIR 7804-1: Technical Evaluation, Testing, and Validation of the Usability of EHR](https://www.nist.gov/document/nistir7804-1werb100615pdf).
- W3C, [WCAG 2.2](https://www.w3.org/TR/WCAG22/).
- Junctura Console: `docs/CONSOLE.md` mục 1 và `console/src/index.css` trong `junctura-dxos`.

## 11. Giới hạn

Đây là hướng dẫn thiết kế của một dự án mã nguồn mở. Nó **không phải** thiết bị y tế, không thay thế đánh giá rủi ro lâm sàng và chưa được người làm lâm sàng kiểm định. Mọi dữ liệu trong dự án là dữ liệu giả lập.
