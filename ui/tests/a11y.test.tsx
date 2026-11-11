// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { AiSummaryPanel, AlertBanner, AllergyStatus, AppShell, Card, ConsentBadge, DataTable, DisplayPrefsProvider, EmptyState, ErrorState, LandingPage, PatientBanner, PreviewFrame, SignInPage, Skeleton, SourceBadge, StatCard, Tabs, TextField, Timeline } from "../src";

async function violations(node: HTMLElement) {
  // color-contrast needs real layout, which jsdom lacks: covered by contrast.test.ts.
  const result = await axe.run(node, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  return result.violations.map(violation => `${violation.id}: ${violation.nodes.map(item => item.html).join(" | ")}`);
}

describe("axe", () => {
  it("landing page", async () => {
    const { container } = render(<LandingPage product="Clinic" headline="Hồ sơ" lead="Mô tả" onSignIn={() => {}} benefits={{ title: "Lợi ích", items: [{ title: "A", text: "a" }, { title: "B", text: "b" }] }} steps={{ title: "Cách dùng", items: [{ title: "Một", text: "x" }] }} faq={{ title: "Hỏi đáp", items: [{ q: "Câu hỏi?", a: "Trả lời." }] }} cta={{ title: "Bắt đầu" }} hero={<PreviewFrame label="Minh hoạ">x</PreviewFrame>} footer={{ links: [{ label: "GitHub", href: "https://example.org" }] }} />, { wrapper: DisplayPrefsProvider });
    expect(await violations(container)).toEqual([]);
  });
  it("sign-in page", async () => {
    const { container } = render(<SignInPage product="Clinic" subtitle="Đăng nhập" onSignIn={() => {}} onBack={() => {}} message="Phiên đã hết hạn" />, { wrapper: DisplayPrefsProvider });
    expect(await violations(container)).toEqual([]);
  });
  it("app shell with patient banner and content", async () => {
    const { container } = render(
      <DisplayPrefsProvider>
        <AppShell product="Clinic" nav={[{ id: "a", label: "Bệnh nhân" }, { id: "b", label: "Lịch" }]} current="a" onNavigate={() => {}} user={{ name: "BS A", role: "Bác sĩ" }} onSignOut={() => {}}
          banner={undefined}>
          <PatientBanner name="Nguyễn Văn A" recordId="HS-0001" birthYear={1980} sex="female" allergy={{ state: "recorded", items: ["Penicillin"] }} />
          <Tabs label="Hồ sơ" value="a" onChange={() => {}} items={[{ id: "a", label: "Tổng quan" }, { id: "b", label: "Khám" }]} />
          <Card title="Khám" count={1}><SourceBadge source="Clinic" unit="PK A" /><ConsentBadge state="granted" /></Card>
        </AppShell>
      </DisplayPrefsProvider>,
    );
    expect(await violations(container)).toEqual([]);
  });
  it("alerts, states and forms", async () => {
    const { container } = render(
      <div>
        <AlertBanner level="critical" title="Tương tác thuốc">Mô tả</AlertBanner>
        <AlertBanner level="info" title="Thông tin" />
        <AllergyStatus state="unavailable" reason="Không có đồng ý" />
        <EmptyState title="Trống" />
        <ErrorState onRetry={() => {}}>Mất kết nối</ErrorState>
        <Skeleton />
        <StatCard label="Lượt khám" value={12} />
        <TextField label="Tên" hint="Họ tên đầy đủ" />
        <AiSummaryPanel enabled kind="ai" summary="Tóm tắt" onGenerate={() => {}} />
        <Timeline label="Lịch sử" items={[{ id: "1", time: "2026-01-02T03:00:00Z", title: "Khám" }]} />
        <DataTable caption="Ds" rows={[{ id: "1", n: "A" }]} rowKey={row => row.id} columns={[{ key: "n", header: "Tên", sortValue: row => row.n }]} />
      </div>,
    );
    expect(await violations(container)).toEqual([]);
  });
});
