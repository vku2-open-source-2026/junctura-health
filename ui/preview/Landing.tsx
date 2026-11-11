// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { BellRing, ClipboardList, FileText, Lock, Pill, ShieldCheck, Stethoscope, Syringe, Users } from "lucide-react";
import { AlertBanner, Badge, LandingPage, PreviewFrame, StatStrip, type LandingProps } from "../src";

/** A small, fictional picture of the Today screen. */
export const HeroPicture = () => (
  <PreviewFrame label="Minh hoạ màn hình Hôm nay của Clinic" title="Clinic · Hôm nay">
    <div className="space-y-3">
      <StatStrip items={[{ label: "Người bệnh", value: 50 }, { label: "Dị ứng nặng", value: 1, tone: "danger" }, { label: "Tiêm quá hạn", value: 12, tone: "warn" }, { label: "Chuyển tuyến", value: 4 }]} />
      <AlertBanner level="critical" title="1 người bệnh có dị ứng nặng">Kiểm tra trước khi kê thuốc hoặc tiêm.</AlertBanner>
      <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm"><span className="font-medium">Nguyễn Văn An</span><Badge tone="warn">Chưa ghi nhận dị ứng</Badge></div>
    </div>
  </PreviewFrame>
);

export const landingProps: Omit<LandingProps, "onSignIn"> = {
  product: "Clinic",
  badge: "Trạm y tế, phòng khám nhỏ",
  headline: "Hồ sơ khám bệnh gọn, an toàn, chia sẻ khi người bệnh đồng ý",
  lead: "Tiếp đón, khám, tiêm chủng và chuyển tuyến trên một màn hình. Dữ liệu liên thông với bệnh viện và nhà thuốc qua Junctura, không sao chép ra ngoài.",
  note: "Tài khoản do đơn vị cấp. Dữ liệu trong bản demo là dữ liệu giả lập.",
  hero: <HeroPicture />,
  benefits: { title: "Làm việc nhanh hơn, ít sai sót hơn", lead: "Thiết kế cho một ca trực đông người, máy yếu, người dùng không rành công nghệ.", items: [
    { icon: <ShieldCheck className="size-5" />, title: "Dị ứng luôn ở đầu hồ sơ", text: "Chưa ghi nhận không bao giờ bị hiểu là không dị ứng." },
    { icon: <ClipboardList className="size-5" />, title: "Việc cần làm hôm nay", text: "Mũi tiêm quá hạn, phiếu chuyển tuyến và người bệnh cần chú ý hiện ngay màn hình đầu." },
    { icon: <FileText className="size-5" />, title: "Chia sẻ có đồng ý", text: "Bệnh viện chỉ xem được khi người bệnh đồng ý, mỗi lần đều có nhật ký." },
  ] },
  steps: { title: "Một ca khám trong ba bước", items: [
    { title: "Tiếp đón", text: "Tìm hoặc tạo hồ sơ, đưa vào hàng chờ của trạm." },
    { title: "Khám và xử trí", text: "Ghi sinh hiệu, chẩn đoán, thuốc và mũi tiêm." },
    { title: "Chuyển tuyến khi cần", text: "Lập phiếu, bệnh viện nhận qua Junctura." },
  ] },
  audiences: { title: "Mỗi người một việc, một màn hình", items: [
    { icon: <Users className="size-5" />, title: "Tiếp đón", text: "Đăng ký, hàng chờ, gọi vào đúng trạm." },
    { icon: <Stethoscope className="size-5" />, title: "Bác sĩ, y sĩ", text: "Hồ sơ, dị ứng, thuốc đang dùng, lịch sử khám." },
    { icon: <Syringe className="size-5" />, title: "Tiêm chủng", text: "Mũi đã tiêm, mũi sắp đến hạn, ghi mũi mới." },
  ] },
  trust: { title: "Riêng tư là mặc định", items: [
    { icon: <Lock className="size-5" />, title: "Đăng nhập một lần qua Junctura", text: "Không lưu mật khẩu trong ứng dụng." },
    { icon: <BellRing className="size-5" />, title: "Mã nguồn mở", text: "Giấy phép Apache-2.0, kiểm tra được từng dòng." },
    { icon: <Pill className="size-5" />, title: "AI chỉ tóm tắt", text: "Mặc định tắt, không chẩn đoán, luôn dẫn về hồ sơ gốc." },
  ] },
  faq: { title: "Câu hỏi thường gặp", items: [
    { q: "Dữ liệu có rời khỏi trạm không?", a: "Chỉ khi người bệnh đồng ý và đúng mục đích, qua Junctura." },
    { q: "Máy yếu có dùng được không?", a: "Có. Giao diện nhẹ, chữ lớn và thao tác bằng bàn phím." },
  ] },
  cta: { title: "Sẵn sàng cho ca trực hôm nay?", lead: "Đăng nhập bằng tài khoản Junctura của trạm." },
  footer: { links: [{ label: "Mã nguồn", href: "https://github.com/vku2-open-source-2026/junctura-clinic" }, { label: "Giấy phép", href: "https://www.apache.org/licenses/LICENSE-2.0" }] },
};

export const ClinicLanding = ({ onSignIn }: { onSignIn: () => void }) => <LandingPage {...landingProps} onSignIn={onSignIn} />;
