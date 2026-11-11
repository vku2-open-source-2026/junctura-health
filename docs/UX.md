<!--
SPDX-FileCopyrightText: 2026 Junctura Contributors
SPDX-License-Identifier: Apache-2.0
-->

# Phân tích trải nghiệm và bố cục ứng dụng

Tài liệu này đi từ người dùng và việc họ phải làm, rồi mới tới bố cục. Quy tắc hiển thị an toàn nằm ở [`DESIGN.md`](DESIGN.md), tính năng từng app ở [`APPS.md`](APPS.md). Phần này trả lời: màn hình nào cần có, vì sao đặt ở đó, và người dùng đi qua chúng thế nào. Lấy Clinic làm ví dụ chính vì là app có luồng việc dài nhất; mục 7 nói các app còn lại dùng lại ra sao.

## 1. Bối cảnh làm việc ở Clinic

- Trạm y tế phường hoặc phòng khám nhỏ, một đến ba người cùng dùng một máy, người bệnh đến liên tục.
- Một ca khám ngắn, vài phút. Y sĩ vừa nhìn người bệnh vừa nhập liệu, hay bị ngắt quãng (gọi người kế tiếp, điện thoại, người nhà hỏi).
- Nhiều người bệnh cao tuổi hoặc trẻ nhỏ; có người không nhớ rõ tiền sử và dị ứng. Sai ở dị ứng và thuốc là sai nghiêm trọng nhất.
- Mạng và máy không ổn định. Mất dữ liệu đang gõ là mất thời gian của cả hàng người chờ.
- Trạm có thể có hơn một điểm làm việc (tiếp đón, phòng khám, phòng tiêm); quản lý phụ trách nhiều trạm.

## 2. Người dùng

| Vai trò | Việc chính | Điều họ cần nhất | Điều làm họ bỏ app |
| --- | --- | --- | --- |
| Điều dưỡng, tiếp đón | Tìm hoặc đăng ký người bệnh, đo sinh hiệu, xếp hàng, tiêm chủng | Tìm trong vài giây, ít ô bắt buộc, thấy ai đang chờ | Phải mở nhiều trang để đăng ký một người |
| Y sĩ, bác sĩ | Khám, ghi bệnh án, kê thuốc, chuyển tuyến | Thấy dị ứng và tiền sử ngay, kê thuốc có cảnh báo, gọi người kế tiếp một thao tác | Hồ sơ rải rác, cảnh báo ở trang khác, mất dữ liệu đang nhập |
| Quản lý trạm | Theo dõi ca, mũi tiêm quá hạn, chuyển tuyến, báo cáo, nhân viên | Thấy cái gì tồn đọng, xuất số liệu | Báo cáo phải tự tổng hợp |
| Người kiểm tra (đơn vị chủ quản) | Xem ai đã truy cập dữ liệu và khi nào | Nhật ký lọc được, có mục đích và kết quả | Nhật ký không đọc được |

## 3. Nhịp một ngày

| Lúc | Người dùng muốn |
| --- | --- |
| Đầu ngày | Biết hôm nay có bao nhiêu người hẹn, mũi tiêm đến hạn, phiếu chuyển tuyến đang chờ phản hồi |
| Trong ngày | Lặp một vòng: tiếp đón, gọi vào, khám và ghi, kê thuốc, tiêm hoặc chuyển tuyến, hoàn tất, gọi người kế tiếp |
| Giữa ca, bị ngắt | Quay lại đúng người đang khám dở, dữ liệu còn nguyên |
| Cuối ngày | Biết còn ca nào chưa hoàn tất; đóng ca |
| Cuối tháng | Xuất báo cáo ca, nhóm bệnh, tiêm chủng, chuyển tuyến |

Hệ quả: màn hình đầu tiên phải là **việc đang cần làm** (hàng đợi và tồn đọng), không phải biểu đồ.

## 4. User story của Clinic

Ưu tiên: **P1** làm trong bản đầu, **P2** bản sau.

| Mã | Vai trò | Tôi muốn | Để | Ưu tiên |
| --- | --- | --- | --- | --- |
| C1 | Điều dưỡng | tìm người bệnh bằng họ tên, số điện thoại, mã hồ sơ hoặc mã BHYT từ bất kỳ màn hình nào | không phải mở trang tìm kiếm | P1 |
| C2 | Điều dưỡng | đăng ký người bệnh mới chỉ với các trường thật sự cần, nhận số thứ tự | đưa vào hàng đợi trong dưới một phút | P1 |
| C3 | Điều dưỡng | đánh dấu ưu tiên (khẩn, trẻ nhỏ, người cao tuổi) | người cần được khám trước | P1 |
| C4 | Y sĩ | thấy hàng đợi, mức ưu tiên và thời gian chờ, bấm một nút để gọi người tiếp theo | không phải đọc giấy | P1 |
| C5 | Y sĩ | mở hồ sơ và thấy ngay tên, tuổi, trạng thái dị ứng, cảnh báo đang có | không bỏ sót an toàn | P1 |
| C6 | Y sĩ | ghi lượt khám (lý do, sinh hiệu, chẩn đoán từ danh mục, xử trí) và dữ liệu tự lưu nháp | không mất khi bị ngắt | P1 |
| C7 | Y sĩ | kê thuốc từ danh mục và được cảnh báo khi thuốc trùng dị ứng đã ghi nhận | tránh kê sai | P1 |
| C8 | Y sĩ | xem tiền sử khám, thuốc đang dùng, tiêm chủng của người bệnh | quyết định đúng | P1 |
| C9 | Điều dưỡng | thấy mũi tiêm quá hạn hoặc sắp đến hạn, ghi mũi tiêm (vắc xin, mũi thứ mấy, lô) | tiêm đủ và đúng lịch | P1 |
| C10 | Y sĩ | tạo phiếu chuyển tuyến (bệnh viện, mức khẩn, lý do, xử trí đã làm), theo dõi trạng thái | người bệnh đến viện được tiếp nhận nhanh | P1 |
| C11 | Y sĩ | biết bệnh viện đã xem phiếu khi nào | yên tâm phiếu đã tới | P2 |
| C12 | Y sĩ | xem tóm tắt hồ sơ do AI tạo, có nhãn nguồn, khi đơn vị bật tính năng | đọc nhanh người bệnh có nhiều lượt khám | P2 |
| C13 | Quản lý | thấy việc tồn đọng: ca chưa hoàn tất, mũi tiêm quá hạn, phiếu chưa được phản hồi | xử lý trước khi thành sự cố | P1 |
| C14 | Quản lý | báo cáo theo ngày, nhóm bệnh, phường, tiêm chủng, xuất CSV | nộp báo cáo | P2 |
| C15 | Quản lý | xem nhật ký mọi lần Junctura gọi dữ liệu của trạm (bên gọi, mục đích, cấp cứu, kết quả) | biết dữ liệu đi đâu | P1 |
| C16 | Quản lý | quản lý nhân viên, vai trò và các trạm | cấp quyền đúng người | P2 |
| C17 | Mọi vai trò | đổi trạm đang làm việc mà không đăng nhập lại | một người làm ở nhiều trạm | P1 |
| C18 | Mọi vai trò | đổi cỡ chữ và chế độ sáng tối | dùng thoải mái cả ngày | P1 |

## 5. Nguyên tắc bố cục rút ra

1. **Mở app là thấy việc cần làm.** Trang chủ là "Hôm nay": hàng đợi, tồn đọng, việc đến hạn. Số liệu tổng hợp để ở Báo cáo.
2. **Người bệnh là ngữ cảnh.** Khi đã mở một người bệnh, mọi thứ trong vùng làm việc thuộc về người đó. Thanh định danh luôn cố định ở trên cùng, kèm trạng thái dị ứng.
3. **Hàng đợi luôn trong tầm tay.** Đang khám vẫn thấy ai tiếp theo và có nút "Hoàn tất và gọi người kế tiếp".
4. **Tìm kiếm toàn cục.** Một ô tìm ở thanh trên, phím `/`, tìm theo họ tên, điện thoại, mã hồ sơ, mã BHYT; kết quả đi thẳng vào hồ sơ.
5. **Nhập liệu tại chỗ, không mất dữ liệu.** Biểu mẫu chia mục ngắn, lưu nháp tự động, chuyển tab không mất nội dung; có bước xác nhận khi hoàn tất ca.
6. **An toàn nằm trong luồng.** Cảnh báo dị ứng hiện ngay trong lúc chọn thuốc, không để ở trang riêng.
7. **Nói rõ nguồn dữ liệu.** Dữ liệu nhận từ nơi khác luôn có nhãn nguồn, độ mới và trạng thái đồng ý.
8. **Bảng chỉ cho danh sách thật** (bệnh nhân, nhật ký, báo cáo). Hàng đợi là danh sách thẻ hành động, lịch sử là dòng thời gian, phần còn lại là biểu mẫu và khối thông tin ngắn.
9. **Một việc chính mỗi màn hình**, các việc phụ ở cột bên.

## 6. Kiến trúc thông tin của Clinic

```
Thanh bên trái
  [Trạm đang làm việc  v]
  HÔM NAY
    Hôm nay            (hàng đợi, tồn đọng, việc đến hạn)   <- trang mở đầu
    Tiếp đón           (tìm hoặc đăng ký, nhận số)
  NGƯỜI BỆNH
    Bệnh nhân          (danh sách, tìm kiếm)
    Tiêm chủng         (đến hạn, quá hạn, ghi mũi tiêm)
    Chuyển tuyến       (phiếu đã gửi và trạng thái)
  QUẢN LÝ
    Báo cáo
    Nhật ký Junctura
    Trạm và nhân viên
  [Tên, vai trò, menu người dùng]

Thanh trên cùng:   [Ô tìm nhanh  /]            [Thông báo]  [Menu người dùng]

Hồ sơ người bệnh (mở từ bất kỳ đâu):
  Thanh định danh cố định: tên, mã, tuổi, dị ứng, nút "Hoàn tất ca"
  Tab: Tóm tắt | Khám | Thuốc | Tiêm chủng | Chuyển tuyến | Lịch sử
  Cột bên phải: Cảnh báo | Ca đang khám (số thứ tự, thời gian chờ) | Hàng đợi (3 người kế tiếp)
```

### Màn hình "Hôm nay"

```
Tiêu đề: Hôm nay, 11/11 · Trạm Hoà Mỹ                  [Đăng ký người bệnh]
Dải số ngắn trên một dòng: 24 lượt · 5 đang chờ · 2 chờ quá 30 phút

Cột chính                                   Cột phải
  Đang chờ khám (5)   [Gọi người tiếp theo]   Cần xử lý
    thẻ: số, tên, tuổi, ưu tiên, chờ bao lâu    - 2 người dị ứng nặng đang chờ
  Đang khám (1)                                 - 3 mũi tiêm đến hạn hôm nay
    thẻ có nút "Mở hồ sơ"                       - 1 phiếu chuyển tuyến chưa phản hồi
  Hoàn tất hôm nay (12)  (thu gọn)             Hoạt động gần đây (dòng thời gian)
```

Số liệu không đứng thành bốn ô lớn: chỉ một dải ngắn, vì người dùng cần hành động, không cần ngắm số.

### Hồ sơ người bệnh

- **Tóm tắt:** dị ứng, bệnh nền, thuốc đang dùng, lượt khám gần nhất, mũi tiêm đến hạn; ô tóm tắt AI nếu bật.
- **Khám:** biểu mẫu chia mục (lý do khám, sinh hiệu, chẩn đoán, xử trí); tự lưu nháp; nút "Hoàn tất ca".
- **Thuốc:** danh sách thuốc đang dùng và kê mới; cảnh báo dị ứng ngay hàng thuốc.
- **Tiêm chủng:** lịch theo tuổi, mũi quá hạn, ghi mũi tiêm.
- **Chuyển tuyến:** các phiếu của người này và tạo phiếu mới.
- **Lịch sử:** dòng thời gian mọi lượt khám, tiêm, chuyển tuyến, kèm nguồn.

## 7. Dùng lại cho các app khác

Mọi app dùng cùng khung (thanh bên, thanh trên, tìm nhanh, menu người dùng, tiêu đề trang, vùng làm việc có cột bên). Khác nhau ở nội dung:

| App | Trang mở đầu | Khác biệt về bố cục |
| --- | --- | --- |
| Hospital | Hàng đợi tiếp nhận theo mức khẩn | Bước tiếp nhận (nhập mã phiếu) và nhánh cấp cứu là luồng riêng, có dải "Truy cập cấp cứu" |
| MyHealth | Tổng quan: ai đang xem dữ liệu của tôi | Điện thoại là chính: thanh điều hướng dưới, chữ lớn, mỗi màn hình một việc |
| Pharmacy | Xác minh đơn | Một ô nhập mã nằm giữa màn hình, kết quả "hợp lệ hay không" nhìn một lần, rồi mới phát thuốc |
| Insurance | Hàng yêu cầu xác minh | Kết quả chỉ có/không và lý do; không hiện dữ liệu y tế chi tiết |

## 8. Cách kiểm tra bố cục

- **Đếm bước:** đăng ký một người vào hàng đợi không quá 3 thao tác; gọi người tiếp theo 1 thao tác; mở hồ sơ từ ô tìm không quá 2.
- **Bàn phím:** `/` tìm kiếm, mũi tên trong kết quả, Enter mở; mọi nút có thể tới bằng Tab, có vòng focus.
- **Ngắt quãng:** chuyển tab hoặc sang người khác rồi quay lại thì nội dung đang nhập còn nguyên.
- **Màn hình:** máy tính 1280 px, máy tính bảng 768 px, điện thoại 390 px; chữ cỡ lớn (19 px) không vỡ bố cục.
- **Trạng thái:** mỗi màn hình có đủ trạng thái trống, đang tải, lỗi, không đủ quyền.
