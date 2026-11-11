// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { FileBarChart, LayoutDashboard, ScrollText, Send, Settings, Syringe, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ActionList, AiSummaryPanel, AlertBanner, AppShell, Badge, Button, DataTable, EmptyState, FormSection, IdChip, PageHeader, PatientBanner, QueueList, Section,
  SegmentedControl, SelectField, SourceBadge, StatStrip, StaleNotice, Tabs, TextAreaField, TextField, Timeline, WorkspaceLayout, ageFromBirthYear, formatDate, type AllergyState, type SearchResult,
} from "../src";
import { MEDICINES, PATIENTS, QUEUE, VACCINES, VISITS, type DemoPatient } from "./data";

const NAV = [
  { label: "Hôm nay", items: [{ id: "today", label: "Hôm nay", icon: <LayoutDashboard className="size-4" />, count: 4 }, { id: "intake", label: "Tiếp đón", icon: <UserPlus className="size-4" /> }] },
  { label: "Người bệnh", items: [{ id: "patients", label: "Bệnh nhân", icon: <Users className="size-4" /> }, { id: "vaccination", label: "Tiêm chủng", icon: <Syringe className="size-4" />, count: 3 }, { id: "referrals", label: "Chuyển tuyến", icon: <Send className="size-4" /> }] },
  { label: "Quản lý", items: [{ id: "reports", label: "Báo cáo", icon: <FileBarChart className="size-4" /> }, { id: "audit", label: "Nhật ký Junctura", icon: <ScrollText className="size-4" /> }, { id: "staff", label: "Trạm và nhân viên", icon: <Settings className="size-4" /> }] },
];

const ALLERGY_BADGE: Record<AllergyState, { label: string; tone: "danger" | "ok" | "warn" | "neutral" }> = {
  recorded: { label: "Có dị ứng", tone: "danger" }, "none-known": { label: "Không có dị ứng đã biết", tone: "ok" }, "not-recorded": { label: "Chưa ghi nhận dị ứng", tone: "warn" }, unavailable: { label: "Không xem được", tone: "neutral" },
};
const byId = (id: string) => PATIENTS.find(patient => patient.id === id)!;
const NOW = new Date("2026-11-11T09:30:00+07:00");

function Today({ open }: { open: (id: string) => void }) {
  const waiting = QUEUE.map(item => ({ item, patient: byId(item.patientId) }));
  const asItem = ({ item, patient }: (typeof waiting)[number]) => ({
    id: item.id, ticket: item.ticket, name: patient.name, priority: item.priority, note: item.note, since: new Date(NOW.getTime() - item.minutes * 60000).toISOString(),
    meta: `${ageFromBirthYear(patient.birthYear)} tuổi · ${patient.sex === "male" ? "Nam" : "Nữ"}`,
    flags: patient.allergy.state === "recorded" ? <Badge tone="danger">Dị ứng: {patient.allergy.items?.join(", ")}</Badge> : undefined,
  });
  return (
    <WorkspaceLayout asideLabel="Việc cần xử lý"
      aside={<>
        <Section title="Cần xử lý" count={3}>
          <ActionList label="Việc cần xử lý" items={[
            { id: "a1", tone: "danger", title: "2 người dị ứng nặng đang chờ", detail: "Phạm Thu Dung (Sulfonamide), Nguyễn Văn An (Penicillin)", actionLabel: "Xem", onAction: () => open("HS-0004") },
            { id: "a2", tone: "warn", title: "3 mũi tiêm đến hạn hôm nay", actionLabel: "Mở lịch tiêm" },
            { id: "a3", tone: "brand", title: "1 phiếu chuyển tuyến chưa phản hồi", detail: "Gửi Bệnh viện Đà Nẵng lúc 08:10", actionLabel: "Theo dõi" },
          ]} />
        </Section>
        <Section title="Hoạt động gần đây">
          <Timeline label="Hoạt động gần đây" items={[
            { id: "h1", time: "2026-11-11T02:25:00Z", title: "Hoàn tất ca A06", description: "Trần Văn Hùng", tone: "ok" },
            { id: "h2", time: "2026-11-11T02:10:00Z", title: "Bệnh viện Đà Nẵng xem phiếu chuyển tuyến", description: "Qua Junctura, mục đích tiếp nhận", tone: "brand" },
          ]} />
        </Section>
      </>}>
      <PageHeader title="Hôm nay" meta="Thứ Tư, 11/11/2026 · Trạm Hoà Mỹ" actions={<Button icon={<UserPlus aria-hidden className="size-4" />}>Đăng ký người bệnh</Button>} />
      <StatStrip items={[{ label: "Lượt hôm nay", value: 24 }, { label: "Đang chờ", value: 4, tone: "warn" }, { label: "Chờ quá 30 phút", value: 1, tone: "danger" }, { label: "Đã hoàn tất", value: 19, tone: "ok" }]} />
      <Section title="Đang chờ khám" count={waiting.length} actions={<Button variant="secondary" onClick={() => open(waiting[0].patient.id)}>Gọi người tiếp theo</Button>}>
        <QueueList label="Đang chờ khám" now={NOW} items={waiting.map(asItem)} onCall={item => open(waiting.find(row => row.item.id === item.id)!.patient.id)} />
      </Section>
      <Section title="Đang khám" count={1}>
        <QueueList label="Đang khám" now={NOW} items={[{ id: "cur", ticket: "A06", name: "Hoàng Thị Lan", meta: "47 tuổi · Nữ", note: "Đã khám 6 phút" }]} onOpen={() => open("HS-0002")} />
      </Section>
    </WorkspaceLayout>
  );
}

function Patients({ open }: { open: (id: string) => void }) {
  const [filter, setFilter] = useState<"all" | "allergy" | "elder" | "child">("all");
  const [text, setText] = useState("");
  const rows = useMemo(() => PATIENTS.filter(patient => {
    const age = ageFromBirthYear(patient.birthYear);
    const matchFilter = filter === "all" || (filter === "allergy" && patient.allergy.state === "recorded") || (filter === "elder" && age >= 60) || (filter === "child" && age < 6);
    const query = text.trim().toLowerCase();
    return matchFilter && (!query || `${patient.name} ${patient.id} ${patient.phone}`.toLowerCase().includes(query));
  }), [filter, text]);
  return (
    <div className="space-y-5">
      <PageHeader title="Bệnh nhân" description="Tìm và mở hồ sơ. Bấm tên để vào hồ sơ." actions={<Button icon={<UserPlus aria-hidden className="size-4" />}>Đăng ký người bệnh</Button>} />
      <div className="flex flex-wrap items-end gap-3">
        <SegmentedControl label="Lọc nhóm" value={filter} onChange={setFilter} options={[{ value: "all", label: "Tất cả", count: PATIENTS.length }, { value: "allergy", label: "Có dị ứng" }, { value: "elder", label: "Cao tuổi" }, { value: "child", label: "Trẻ nhỏ" }]} />
        <div className="w-full sm:w-72"><TextField label="Lọc theo tên, số điện thoại, mã" value={text} onChange={event => setText(event.target.value)} /></div>
      </div>
      <DataTable caption="Danh sách bệnh nhân" rows={rows} rowKey={row => row.id} onRowClick={row => open(row.id)} empty="Không có người bệnh phù hợp."
        columns={[
          { key: "name", header: "Họ tên", sortValue: row => row.name, render: row => row.name },
          { key: "id", header: "Mã hồ sơ", mono: true },
          { key: "age", header: "Tuổi", sortValue: row => ageFromBirthYear(row.birthYear), render: row => ageFromBirthYear(row.birthYear) },
          { key: "ward", header: "Phường", sortValue: row => row.ward },
          { key: "allergy", header: "Dị ứng", render: row => <Badge tone={ALLERGY_BADGE[row.allergy.state].tone}>{ALLERGY_BADGE[row.allergy.state].label}</Badge> },
          { key: "lastVisit", header: "Khám gần nhất", sortValue: row => row.lastVisit, render: row => formatDate(row.lastVisit) },
        ]} />
    </div>
  );
}

function Record({ patient, back, toast }: { patient: DemoPatient; back: () => void; toast: (message: string) => void }) {
  const [tab, setTab] = useState("summary");
  const [medicine, setMedicine] = useState("");
  const allergic = patient.allergy.state === "recorded" && medicine === "amoxicillin" && patient.allergy.items?.includes("Penicillin");
  const rest = QUEUE.filter(item => item.patientId !== patient.id).slice(0, 3);
  return (
    <div className="-mx-4 -mt-5 sm:-mx-6">
      <PatientBanner name={patient.name} recordId={patient.id} birthYear={patient.birthYear} sex={patient.sex} allergy={patient.allergy}
        extra={<button type="button" onClick={back} className="text-brand underline underline-offset-2">Về danh sách</button>}
        actions={<Button onClick={() => toast("Đã hoàn tất ca và gọi người kế tiếp (A08)")}>Hoàn tất ca</Button>} />
      <div className="space-y-5 px-4 pt-5 sm:px-6">
        <Tabs label="Hồ sơ người bệnh" value={tab} onChange={setTab} items={[{ id: "summary", label: "Tóm tắt" }, { id: "exam", label: "Khám" }, { id: "meds", label: "Thuốc" }, { id: "vaccines", label: "Tiêm chủng", count: 1 }, { id: "referral", label: "Chuyển tuyến" }, { id: "history", label: "Lịch sử", count: VISITS.length }]} />
        <WorkspaceLayout asideLabel="Ca đang khám"
          aside={<>
            <Section title="Ca đang khám"><p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm"><span className="font-mono font-semibold text-brand">A05</span> · vào lúc 09:12 · đã khám 18 phút</p></Section>
            <Section title="Cần xử lý"><ActionList label="Cần xử lý" items={[{ id: "r1", tone: "warn", title: "Mũi MMR mũi 2 quá hạn", detail: "Hạn 15/10/2026", actionLabel: "Ghi mũi tiêm", onAction: () => setTab("vaccines") }]} /></Section>
            <Section title="Tiếp theo"><QueueList compact label="Người kế tiếp" now={NOW} items={rest.map(item => ({ id: item.id, ticket: item.ticket, name: byId(item.patientId).name, priority: item.priority, since: new Date(NOW.getTime() - item.minutes * 60000).toISOString() }))} /></Section>
          </>}>
          {tab === "summary" && <>
            {patient.allergy.state === "recorded" && <AlertBanner level="warning" title="Có dị ứng đã ghi nhận">Tránh: {patient.allergy.items?.join(", ")}. Hệ thống sẽ cảnh báo khi kê thuốc cùng nhóm.</AlertBanner>}
            <Section title="Tình trạng hiện tại">
              <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                <div><dt className="text-sm text-muted">Bệnh nền</dt><dd className="font-medium">{patient.conditions.join(", ") || "Chưa ghi nhận"}</dd></div>
                <div><dt className="text-sm text-muted">Thuốc đang dùng</dt><dd className="font-medium">{patient.meds.length ? patient.meds.join("; ") : "Chưa ghi nhận"}</dd></div>
                <div><dt className="text-sm text-muted">Liên hệ</dt><dd className="font-medium">{patient.phone} · {patient.ward}</dd></div>
                <div><dt className="text-sm text-muted">Khám gần nhất</dt><dd className="font-medium">{formatDate(patient.lastVisit)}</dd></div>
              </dl>
            </Section>
            <Section title="Lượt khám gần đây"><Timeline label="Lượt khám gần đây" items={VISITS.slice(0, 2)} /></Section>
            <AiSummaryPanel enabled kind="ai" summary="3 lượt khám trong 12 tháng, chủ yếu theo dõi huyết áp; chuyển tuyến 1 lần tháng 5." sourceHref="#history" />
          </>}
          {tab === "exam" && (
            <form className="space-y-6" onSubmit={event => { event.preventDefault(); toast("Đã lưu lượt khám"); }}>
              <p role="status" className="text-sm text-muted">Tự lưu nháp lúc 09:41. Chuyển tab không làm mất nội dung.</p>
              <FormSection title="Lý do khám" description="Triệu chứng chính, bao lâu."><div className="sm:col-span-2"><TextAreaField label="Lý do khám" required rows={3} defaultValue="Đau đầu, chóng mặt 3 ngày" /></div></FormSection>
              <FormSection title="Sinh hiệu" description="Nhập số đo, đơn vị đã có sẵn.">
                <TextField label="Nhiệt độ (°C)" inputMode="decimal" defaultValue="36.8" /><TextField label="Huyết áp (mmHg)" defaultValue="150/90" />
                <TextField label="Mạch (lần/phút)" inputMode="numeric" defaultValue="82" /><TextField label="SpO₂ (%)" inputMode="numeric" defaultValue="97" />
              </FormSection>
              <FormSection title="Chẩn đoán" description="Chọn từ danh mục ICD-10."><SelectField label="Chẩn đoán chính" options={[{ value: "I10", label: "I10 – Tăng huyết áp vô căn" }, { value: "E11", label: "E11 – Đái tháo đường type 2" }]} placeholder="Chọn chẩn đoán" /><TextField label="Ghi chú" /></FormSection>
              <FormSection title="Xử trí"><div className="sm:col-span-2"><TextAreaField label="Xử trí" rows={3} /></div></FormSection>
              <div className="flex gap-2 border-t border-line pt-4"><Button type="submit">Lưu lượt khám</Button><Button type="button" variant="secondary" onClick={() => setTab("meds")}>Tiếp: kê thuốc</Button></div>
            </form>
          )}
          {tab === "meds" && <>
            <Section title="Đang dùng"><ul className="divide-y divide-line rounded-xl border border-line bg-surface">{(patient.meds.length ? patient.meds : ["Chưa có thuốc đang dùng"]).map(med => <li key={med} className="px-4 py-2.5">{med}</li>)}</ul></Section>
            <Section title="Kê thuốc mới">
              <div className="max-w-md space-y-3">
                <SelectField label="Thuốc" value={medicine} onChange={event => setMedicine(event.target.value)} options={MEDICINES} placeholder="Chọn thuốc" />
                {allergic && <AlertBanner level="critical" title="Trùng dị ứng đã ghi nhận">Người bệnh dị ứng Penicillin. Amoxicillin thuộc nhóm penicillin, không nên kê.</AlertBanner>}
                <Button disabled={!medicine || !!allergic} onClick={() => toast("Đã thêm thuốc vào đơn")}>Thêm vào đơn</Button>
              </div>
            </Section>
          </>}
          {tab === "vaccines" && <Section title="Lịch tiêm"><ul className="divide-y divide-line rounded-xl border border-line bg-surface">{VACCINES.map(v => (
            <li key={v.id} className="flex flex-wrap items-center gap-3 px-4 py-3"><div className="min-w-0 flex-1"><p className="font-medium">{v.name}</p><p className="text-sm text-muted">{v.dose} · hạn {formatDate(v.due)}</p></div>
              <Badge tone={v.state === "overdue" ? "danger" : v.state === "soon" ? "warn" : "ok"}>{v.state === "overdue" ? "Quá hạn" : v.state === "soon" ? "Sắp đến hạn" : "Đã tiêm"}</Badge>
              {v.state !== "done" && <Button variant="secondary" onClick={() => toast("Đã mở biểu mẫu ghi mũi tiêm")}>Ghi mũi tiêm</Button>}</li>))}</ul></Section>}
          {tab === "referral" && <EmptyState title="Chưa có phiếu chuyển tuyến" action={<Button>Tạo phiếu chuyển tuyến</Button>}>Phiếu gửi qua Junctura, bệnh viện nhận thấy tóm tắt và dị ứng khi người bệnh đồng ý.</EmptyState>}
          {tab === "history" && <Section title="Toàn bộ lịch sử"><div className="mb-3 flex flex-wrap gap-2"><SourceBadge source="Junctura Clinic" unit="Trạm Hoà Mỹ" /><StaleNotice updatedAt="2026-10-30" /><IdChip value={patient.id} /></div><Timeline label="Lịch sử" items={VISITS} /></Section>}
        </WorkspaceLayout>
      </div>
    </div>
  );
}

export function ClinicDemo({ toast }: { toast: (message: string) => void }) {
  const [nav, setNav] = useState("today");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [station, setStation] = useState("s1");
  const open = (id: string) => { setPatientId(id); };
  const go = (id: string) => { setPatientId(null); setNav(id); };
  const onSearch = (query: string): SearchResult[] => PATIENTS.filter(p => `${p.name} ${p.id} ${p.phone}`.toLowerCase().includes(query.toLowerCase()))
    .map(p => ({ id: p.id, title: p.name, subtitle: `${p.id} · ${p.phone} · ${p.ward}`, badge: p.allergy.state === "recorded" ? <Badge tone="danger">Dị ứng</Badge> : undefined }));
  const patient = patientId ? byId(patientId) : null;
  return (
    <AppShell product="Clinic" nav={NAV} current={patient ? "patients" : nav} onNavigate={go}
      unit={{ name: "Trung tâm Y tế Hải Châu", stations: [{ id: "s1", name: "Trạm Hoà Mỹ", detail: "Phường Hoà Mỹ" }, { id: "s2", name: "Trạm An Hải", detail: "Phường An Hải" }, { id: "s3", name: "Trạm Mỹ Khê", detail: "Phường Mỹ Khê" }], currentStationId: station, onStationChange: setStation }}
      user={{ name: "Phạm Thu Hà", role: "Bác sĩ", unit: "Trạm Hoà Mỹ" }} onSignOut={() => {}}
      search={{ onSearch, onSelect: result => open(result.id) }}
      notifications={[{ id: "n1", tone: "danger", title: "Người dị ứng nặng đang chờ", detail: "Phạm Thu Dung, số A07", time: "5 phút trước", onClick: () => open("HS-0004") }, { id: "n2", title: "Phiếu chuyển tuyến được tiếp nhận", detail: "Bệnh viện Đà Nẵng", time: "09:05" }]}>
      {patient ? <Record patient={patient} back={() => setPatientId(null)} toast={toast} />
        : nav === "today" ? <Today open={open} />
        : nav === "patients" ? <Patients open={open} />
        : <div className="space-y-5"><PageHeader title={NAV.flatMap(group => group.items).find(item => item.id === nav)?.label ?? ""} /><EmptyState title="Màn hình này chưa dựng trong bản xem thử">Xem Hôm nay, Bệnh nhân và hồ sơ người bệnh để thấy bố cục.</EmptyState></div>}
    </AppShell>
  );
}
