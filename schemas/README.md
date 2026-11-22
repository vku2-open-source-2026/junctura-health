<!-- SPDX-FileCopyrightText: 2026 Junctura Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Lược đồ bản ghi của gói Y tế

Thư mục này giữ bản nháp lược đồ cho mọi collection bản ghi mà Danh mục Y tế (`registry`) và
5 app Y tế (`clinic`, `hospital`, `pharmacy`, `insurance`, `myhealth`) sẽ đăng ký qua
`PUT /v2/data-schemas/{collection}`. Mỗi tệp JSON là đúng phần thân yêu cầu
(`CollectionSchemaWrite`): `schema` (chỉ các từ khoá được phép: `type`, `required`,
`properties`, `enum`, `minLength`, `maxLength`, `pattern`, `minimum`, `maximum`, `items`,
`format` cho `date`/`date-time`), `indexed`, `uniqueKey`, `searchable`, `sensitive`.

Quy ước chung:

- `uniqueKey` là mã định danh nghiệp vụ của bản ghi (mã người bệnh, mã phiếu, mã đơn thuốc…);
  khi có, trường đó cũng nằm trong `required` và `indexed`, và giá trị phải khớp
  `^[A-Za-z0-9_-]{1,128}$`. Chỉ đặt khoá duy nhất khi trường khoá đã được nguồn dữ liệu
  định nghĩa và có quy tắc tạo giá trị; mã ICD-10 có dấu chấm (`J06.9`) không khớp mẫu khoá
  của lõi, nên `registry/icd10` chỉ đánh chỉ mục `code` mà không đặt khoá duy nhất.
- Giá trị có thể là `null` (ví dụ `birthYear` của hồ sơ tiếp nhận người chưa biết năm sinh)
  được khai báo không gắn `type`; app giữ nguyên phần kiểm tra của mình (số nguyên trong
  khoảng, hoặc `null`). Định dạng lược đồ của lõi chưa hỗ trợ kiểu kết hợp `integer | null`.
- `indexed` chỉ gồm trường dùng để lọc hoặc sắp xếp thật sự; không đánh chỉ mục trường nhạy
  cảm dạng văn bản tự do.
- `sensitive` gồm mọi trường định danh hoặc y tế của người (họ tên, năm sinh, số định danh,
  điện thoại, địa chỉ, chẩn đoán, dị ứng, thuốc, ghi chú khám) và các mã/tiền liên kết tới
  hồ sơ cá nhân (mã đơn, mã phiếu, mã claim, khoản tiền của từng claim).
- Chỉ khai báo trường thấy trong mã nguồn hoặc dữ liệu mẫu của từng app; trường chưa có
  nguồn (ví dụ `status` của Pharmacy) được khai báo không gắn `type` hoặc bỏ hẳn.

## Điều kiện trước khi đăng ký

- **Cấp cứu (`hospital_emergency_requests_v1`)**: writer cập nhật bản ghi hai lần — gắn
  `executionId` và ghi `endedAt` — bằng `PATCH` qua `update()`. Lõi yêu cầu header
  `If-Match` cho collection đã đăng ký: writer phải đọc `ETag` mới của bản ghi, gửi
  `If-Match`, và khi xung đột phiên bản thì đọc lại bản ghi rồi đối chiếu trước khi thử lại.
- **Clinic chuyển SQLite sang bản ghi Core**: `no_known_allergies` đổi từ `0/1` sang
  boolean; thuộc tính tùy chọn đang có SQL `NULL` bị bỏ khỏi JSON khi xuất.
- **MyHealth**: trường tùy chọn chưa khai được biểu diễn bằng chuỗi rỗng `""` (đúng dạng
  `shape()` trả về); `updatedAt` luôn có ở mọi bản ghi đã lưu.

| App chủ | Collection | Mô tả | Khoá duy nhất | Trường chỉ mục | Trường nhạy cảm |
|---|---|---|---|---|---|
| registry | `patients` | Danh mục người bệnh dùng chung cho nhóm app Y tế | `patientId` | `patientId` | `patientId`, `subject`, `patientName`, `birthYear`, `sex`, `ward`, `phone`, `insuranceNo` |
| registry | `icd10` | Danh mục mã bệnh ICD-10 | — | `code` | — |
| registry | `drugs` | Danh mục thuốc (tên + hàm lượng) | — | `name` | — |
| registry | `vaccines` | Danh mục vắc xin (mã, tên, số mũi của lịch tiêm) | `code` | `code` | — |
| registry | `service_prices` | Bảng giá dịch vụ — chưa có nguồn, để trống | — | — | — |
| clinic | `clinic_patients` | Hồ sơ người bệnh của trạm | `patientId` | `patientId`, `subject` | `patientId`, `subject`, `patientName`, `birthYear`, `sex`, `ward`, `phone`, `insuranceNo`, `noKnownAllergies` |
| clinic | `clinic_allergies` | Dị ứng đã ghi nhận của người bệnh | — | `patientId` | `patientId`, `substance`, `severity`, `reaction` |
| clinic | `clinic_conditions` | Bệnh mạn tính | — | `patientId`, `since` | `patientId`, `code`, `name`, `since` |
| clinic | `clinic_medications` | Thuốc đang dùng / đã ngừng | — | `patientId`, `since`, `stoppedOn` | `patientId`, `name`, `dose`, `since`, `stoppedOn` |
| clinic | `clinic_encounters` | Lần khám (lý do, chẩn đoán, sinh hiệu, đơn, dặn dò) | — | `patientId`, `date` | `patientId`, `date`, `reason`, `diagnosis`, `vitals`, `notes`, `advice`, `prescriptions`, `by` |
| clinic | `clinic_vaccinations` | Mũi tiêm đã ghi | — | `patientId`, `code`, `date` | `patientId`, `vaccine`, `code`, `date`, `doseNumber`, `lot`, `by` |
| clinic | `clinic_queue` | Hàng chờ khám trong ngày | — | `day`, `ticket`, `state`, `patientId`, `stationId` | `patientId`, `reason`, `by` |
| clinic | `clinic_referrals` | Phiếu chuyển tuyến | `referralId` | `referralId`, `patientId`, `issuedAt`, `status` | `referralId`, `patientId`, `reason`, `provisionalDiagnosis`, `treatmentGiven`, `by` |
| clinic | `clinic_settings` | Cài đặt trạm (`aiSummary`/`aiModel`, giá trị boolean) | `key` | `key` | — |
| hospital | `hospital_admissions_v1` | Tiếp nhận người bệnh chuyển tuyến | `operationId` | `operationId`, `patientSubject`, `referralId`, `urgency` | `patientSubject`, `patientName`, `birthYear`, `sex`, `referralId`, `createdBy` |
| hospital | `hospital_costs_v1` | Chi phí điều trị (hạng mục, tổng tiền, mã hồ sơ BHXH) | `requestId` | `requestId`, `admissionId`, `patientSubject`, `claimId` | `patientSubject`, `patientName`, `birthYear`, `sex`, `items`, `amountVnd`, `claimId`, `admissionId`, `noteId`, `createdBy` |
| hospital | `hospital_exam_notes_v1` | Ghi chú khám (lý do, khai thác, chẩn đoán, kế hoạch) | `requestId` | `requestId`, `admissionId`, `patientSubject` | `patientSubject`, `reason`, `findings`, `diagnosis`, `plan`, `admissionId`, `createdBy` |
| hospital | `hospital_prescriptions_v1` | Đơn thuốc bệnh viện kê | `requestId` | `requestId`, `admissionId`, `issuedAt`, `patientSubject`, `prescriptionCode` | `patientSubject`, `patientName`, `birthYear`, `sex`, `items`, `overrideReason`, `allergyReview`, `prescriptionCode`, `admissionId`, `noteId`, `createdBy` |
| hospital | `hospital_emergency_requests_v1` | Yêu cầu truy cập cấp cứu (tóm tắt, dị ứng) | `operationId` | `operationId` | `patientSubject`, `justification`, `createdBy` |
| pharmacy | `dispensations` | Lần phát thuốc theo mã đơn — chưa có writer làm nguồn | — | `prescriptionCode` | `prescriptionCode`, `items`, `reason` |
| pharmacy | `settings` | Cài đặt nhà thuốc — chưa có nguồn, để trống | — | — | — |
| pharmacy | `stock-receipts` | Phiếu nhập kho (thuốc, lô, số lượng, hạn dùng) — chưa có writer làm nguồn | — | `name`, `expiresOn` | — |
| insurance | `insurance_claims` | Yêu cầu thanh toán chờ giám định | `claimId` | `claimId`, `subject`, `submittedAt` | `subject`, `requestedAmountVnd` |
| insurance | `checks` | Kết quả đối chiếu có/không của từng lần kiểm | — | `claimId`, `at` | `claimId`, `assessor`, `assessorName` |
| insurance | `decisions` | Quyết định giám định (chấp nhận, từ chối, yêu cầu giải trình) | — | `claimId`, `kind`, `at` | `claimId`, `amountVnd`, `assessor`, `assessorName`, `reason` |
| insurance | `settlements` | Đợt chi trả các hồ sơ đã chấp nhận | `settlementId` | `settlementId`, `at` | `claimIds`, `createdBy`, `createdByName` |
| myhealth | `myhealth_profiles` | Thông tin người bệnh tự khai (liên hệ khẩn cấp, nhóm máu, ghi chú) | `subject` | `subject` | `subject`, `contactName`, `contactPhone`, `bloodType`, `note` |

Ghi chú khác:

- `call-log`, `staff-actions`, bảng `audit` không có collection riêng; chúng chuyển sang
  nhật ký của Tầng 1. `stations` chuyển sang directory; `flagged_access` của MyHealth
  chuyển sang phần nhật ký truy cập của MyHealth, không phải bản ghi nghiệp vụ.
- Tồn kho nhà thuốc là trường số (`quantity` trong `stock-receipts`) để lõi có thể trừ
  nguyên tử.
- `kind` (`hospital-*-v1`) được khai báo bằng `enum` một phần tử vì mã nguồn kiểm tra giá
  trị này trên mọi bản ghi đọc về.
- `createdBy` của Hospital được khai báo kèm `required` lồng (`subject`, `displayName`) ở
  những schema mà reader kiểm tra hai trường này khi đọc.
- `executionId` và `endedAt` của yêu cầu cấp cứu bắt đầu là `null` nên không gắn `type`;
  quy tắc UUID và ngày giờ vẫn do app kiểm tra khi đọc.
- App Pharmacy chỉ còn thấy qua mã nguồn của repo này là lớp đọc bản ghi chung
  (`.orchestrator/ref/schemas/pharmacy-records.mjs`); chưa có writer hay fixture cho ba
  collection của Pharmacy trong nguồn đã chép. Ba lược đồ chỉ giữ phần có căn cứ
  (`prescriptionCode`, tên/hàm lượng/số lượng/lô từ hợp đồng `prescription-verify` và
  `docs/APPS.md`) và đang chờ nguồn từ repo pharmacy; `settings` để trống hoàn toàn.

## Câu hỏi

1. **Pharmacy**: nguồn thật của `dispensations`, `settings` và `stock-receipts` nằm ở repo
   junctura-pharmacy, không có trong tài liệu đã chép. Cần writer và fixture của cả ba
   collection để chốt: tên trường thật, bộ giá trị `status` (đã phát / đã từ chối), hình
   dạng `settings`, các trường của phiếu nhập kho (mã phiếu nhập, người nhập, đơn giá?).
   Chưa đặt khoá duy nhất trên `dispensations` vì cần xác minh một đơn có thể bị từ chối rồi
   phát lại hay không trước khi dùng `prescriptionCode` làm khoá.
2. **`registry/drugs`**: khoá tự nhiên là cặp `name` + `strength` nhưng `uniqueKey` chỉ nhận
   một trường. Hiện chưa đặt khoá duy nhất; cần chốt (thêm trường khoá tổng hợp hay chấp nhận
   trùng).
3. **`registry/service_prices`**: đã bỏ hai trường phác thảo `service`/`priceVnd`; lược đồ
   để trống cho đến khi có danh mục bảng giá thật làm nguồn.
4. **`insurance/decisions`**: bộ giá trị của `kind` (chấp nhận / từ chối / yêu cầu giải trình)
   không thấy giá trị chuẩn trong mã; hiện để chuỗi tự do.
5. **`clinic_patients`**: cột `created_at` (thời điểm tạo gốc) chưa đưa vào bản ghi; cần chốt
   có cần giữ khi nhập dữ liệu cũ không. `updatedAt` và `vaccinationsUpdatedAt` đã chốt giữ
   lại vì các bản tóm tắt dùng chúng.
6. **Workspace**: thiết kế yêu cầu mã hồ sơ Workspace trên bản ghi Clinic, nhưng writer
   Clinic hiện tại chưa có tên trường cho nó; chốt ánh xạ trước khi đăng ký.
