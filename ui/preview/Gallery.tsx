// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { Activity, CalendarDays, FileText, Pill, Users } from "lucide-react";
import { useState } from "react";
import {
  AiSummaryPanel, AlertBanner, AllergyStatus, AppShell, Badge, Button, Card, ConfirmDialog, ConsentBadge, DataTable, DisplayPrefsProvider, EmergencyBar, EmergencyDialog,
  EmptyState, ErrorState, IdChip, LandingPage, PatientBanner, PermissionState, SelectField, Skeleton, SourceBadge, StaleNotice, StatCard, Tabs, TextAreaField, TextField,
  Timeline, ToastProvider, useToast,
} from "../src";

const rows = [
  { id: "HS-0001", name: "Nguyễn Văn An", visits: 12, last: "2026-10-30" },
  { id: "HS-0002", name: "Trần Thị Bình", visits: 3, last: "2026-09-02" },
  { id: "HS-0003", name: "Lê Hoàng Cường", visits: 7, last: "2026-11-05" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-3"><h2 className="text-lg font-semibold">{title}</h2>{children}</section>;
}

function Components() {
  const [tab, setTab] = useState("overview");
  const [confirm, setConfirm] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [active, setActive] = useState(false);
  const { notify } = useToast();
  return (
    <div className="space-y-8 p-5">
      {active && <EmergencyBar reason="Bệnh nhân co giật, không liên lạc được người nhà" onEnd={() => setActive(false)} />}
      <PatientBanner name="Nguyễn Văn An" recordId="HS-0001" birthYear={1984} sex="male" allergy={{ state: "recorded", items: ["Penicillin", "Tôm"] }}
        actions={<Button variant="secondary" onClick={() => setEmergency(true)}>Truy cập khẩn cấp</Button>} />
      <Section title="Trạng thái dị ứng (4 trạng thái khác nhau)">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AllergyStatus state="recorded" items={["Penicillin"]} />
          <AllergyStatus state="none-known" />
          <AllergyStatus state="not-recorded" />
          <AllergyStatus state="unavailable" reason="Chưa có đồng ý chia sẻ" />
        </div>
      </Section>
      <Section title="Mức cảnh báo">
        <div className="space-y-2">
          <AlertBanner level="critical" title="Tương tác thuốc nghiêm trọng">Warfarin và Aspirin: tăng nguy cơ chảy máu.</AlertBanner>
          <AlertBanner level="warning" title="Cảnh báo">Toa thuốc sắp hết hạn.</AlertBanner>
          <AlertBanner level="notice" title="Lưu ý">Người bệnh đã từ chối chia sẻ hồ sơ tiêm chủng.</AlertBanner>
          <AlertBanner level="info" title="Thông tin">Đồng bộ lần cuối lúc 08:00.</AlertBanner>
        </div>
      </Section>
      <Section title="Nguồn, độ mới, đồng ý">
        <div className="flex flex-wrap gap-2">
          <SourceBadge source="Junctura Clinic" unit="PK Hoà Mỹ" /><StaleNotice updatedAt="2026-11-01" /><StaleNotice updatedAt="2023-02-01" />
          <ConsentBadge state="granted" /><ConsentBadge state="denied" /><ConsentBadge state="expired" /><ConsentBadge state="unknown" />
          <IdChip value="CT-2026-0042" label="mã chuyển tuyến" /><Badge tone="ok">Đã xác minh</Badge>
        </div>
      </Section>
      <Section title="Số liệu">
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard label="Lượt khám hôm nay" value={24} icon={<Activity className="size-4" />} />
          <StatCard label="Chờ xử lý" value={5} tone="warn" hint="Quá 30 phút: 2" />
          <StatCard label="Đã hoàn tất" value={19} tone="ok" />
          <StatCard label="Cảnh báo" value={1} tone="danger" />
        </div>
      </Section>
      <Section title="Tab, bảng, dòng thời gian">
        <Tabs label="Hồ sơ" value={tab} onChange={setTab} items={[{ id: "overview", label: "Tổng quan" }, { id: "visits", label: "Lượt khám", count: 12 }, { id: "meds", label: "Thuốc" }]} />
        <DataTable caption="Danh sách bệnh nhân" rows={rows} rowKey={row => row.id}
          columns={[{ key: "id", header: "Mã", mono: true, sortValue: row => row.id }, { key: "name", header: "Họ tên", sortValue: row => row.name }, { key: "visits", header: "Lượt khám", align: "right", sortValue: row => row.visits }, { key: "last", header: "Gần nhất", sortValue: row => row.last }]} />
        <Card title="Lịch sử khám" count={2}>
          <Timeline label="Lịch sử khám" items={[
            { id: "1", time: "2026-10-30T02:15:00Z", title: "Khám nội tổng quát", description: "BS. Phạm Thu Hà · PK Hoà Mỹ", tone: "brand" },
            { id: "2", time: "2026-08-12T07:40:00Z", title: "Tiêm vắc-xin cúm", description: "Trạm Y tế phường 3" },
          ]} />
        </Card>
      </Section>
      <Section title="Biểu mẫu">
        <Card><div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Họ tên" required hint="Như trên giấy tờ" />
          <TextField label="Số điện thoại" error="Số điện thoại không hợp lệ" defaultValue="0912" />
          <SelectField label="Trạm" placeholder="Chọn trạm" options={[{ value: "a", label: "Phòng khám A" }, { value: "b", label: "Trạm B" }]} />
          <TextAreaField label="Ghi chú" />
        </div></Card>
      </Section>
      <Section title="Tóm tắt AI (chỉ tóm tắt)">
        <div className="grid gap-3 lg:grid-cols-3">
          <AiSummaryPanel enabled={false} />
          <AiSummaryPanel enabled kind="ai" summary="3 lượt khám trong 12 tháng; đơn thuốc gần nhất ngày 30/10/2026." sourceHref="#goc" onGenerate={() => {}} />
          <AiSummaryPanel enabled kind="template" summary="Tăng huyết áp, đang dùng 2 thuốc." sourceHref="#goc" />
        </div>
      </Section>
      <Section title="Trạng thái rỗng, lỗi, không quyền, đang tải">
        <div className="grid gap-3 lg:grid-cols-2">
          <EmptyState title="Chưa có lượt khám">Lượt khám mới sẽ hiện ở đây.</EmptyState>
          <ErrorState onRetry={() => {}}>Không kết nối được máy chủ. Thử lại sau ít phút.</ErrorState>
          <PermissionState>Cần đồng ý của người bệnh để xem mục này.</PermissionState>
          <Card><Skeleton /></Card>
        </div>
      </Section>
      <Section title="Hộp thoại và thông báo">
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" onClick={() => setConfirm(true)}>Xoá lịch hẹn</Button>
          <Button variant="secondary" onClick={() => setEmergency(true)}>Truy cập khẩn cấp</Button>
          <Button onClick={() => notify("Đã lưu hồ sơ", "ok")}>Thông báo thành công</Button>
          <Button variant="ghost" loading>Đang lưu</Button>
        </div>
      </Section>
      <ConfirmDialog open={confirm} title="Xoá lịch hẹn?" description="Lịch hẹn 09:00 ngày 12/11 của Nguyễn Văn An sẽ bị xoá và không thể khôi phục." confirmLabel="Xoá lịch hẹn" danger onConfirm={() => setConfirm(false)} onCancel={() => setConfirm(false)} />
      <EmergencyDialog open={emergency} patientLabel="Nguyễn Văn An (HS-0001)" onCancel={() => setEmergency(false)} onConfirm={() => { setEmergency(false); setActive(true); }} />
    </div>
  );
}

export function Gallery() {
  const [view, setView] = useState<"landing" | "app">("app");
  const [nav, setNav] = useState("patients");
  return (
    <DisplayPrefsProvider>
      <ToastProvider>
        <div className="flex gap-2 bg-surface-2 p-2 text-sm">
          <Button variant={view === "landing" ? "primary" : "secondary"} onClick={() => setView("landing")}>Landing</Button>
          <Button variant={view === "app" ? "primary" : "secondary"} onClick={() => setView("app")}>Ứng dụng</Button>
        </div>
        {view === "landing" ? (
          <LandingPage product="Clinic" headline="Hồ sơ khám bệnh gọn, an toàn, chia sẻ khi người bệnh đồng ý" lead="Tiếp nhận, khám và chuyển tuyến trên một màn hình, dữ liệu liên thông qua Junctura."
            onSignIn={() => {}} note="Tài khoản do đơn vị cấp" values={[
              { icon: <Users className="size-5" />, title: "Một hồ sơ, nhiều trạm", text: "Theo dõi người bệnh qua các trạm trong cùng phòng khám." },
              { icon: <FileText className="size-5" />, title: "Chia sẻ có đồng ý", text: "Mỗi lần xem dữ liệu liên thông đều có phiếu một lần và nhật ký." },
              { icon: <Pill className="size-5" />, title: "Dị ứng luôn hiển thị", text: "Trạng thái dị ứng nằm cố định trên đầu hồ sơ." },
            ]} footer="Phát hành theo Apache-2.0" />
        ) : (
          <AppShell product="Clinic" nav={[{ id: "patients", label: "Bệnh nhân", icon: <Users className="size-5" /> }, { id: "schedule", label: "Lịch hẹn", icon: <CalendarDays className="size-5" />, count: 4 }, { id: "stats", label: "Thống kê", icon: <Activity className="size-5" /> }]}
            current={nav} onNavigate={setNav} user={{ name: "BS. Phạm Thu Hà", role: "Bác sĩ", unit: "PK Hoà Mỹ" }} onSignOut={() => {}}>
            <Components />
          </AppShell>
        )}
      </ToastProvider>
    </DisplayPrefsProvider>
  );
}
