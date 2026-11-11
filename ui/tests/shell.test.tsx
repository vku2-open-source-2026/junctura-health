// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import { ActionList, AppShell, CommandSearch, DisplayPrefsProvider, LandingPage, Popover, QueueList, SegmentedControl, SignInPage, minutesWaiting } from "../src";

const NAV = [{ label: "Hôm nay", items: [{ id: "today", label: "Hôm nay" }, { id: "intake", label: "Tiếp đón" }] }, { label: "Người bệnh", items: [{ id: "patients", label: "Bệnh nhân", count: 3 }] }];
const STATIONS = [{ id: "s1", name: "Trạm Hoà Mỹ" }, { id: "s2", name: "Trạm An Hải" }];

function shell(extra: Partial<React.ComponentProps<typeof AppShell>> = {}) {
  return render(
    <DisplayPrefsProvider>
      <AppShell product="Clinic" nav={NAV} current="today" onNavigate={() => {}} user={{ name: "Phạm Thu Hà", role: "Bác sĩ" }} onSignOut={() => {}} {...extra}><p>Nội dung</p></AppShell>
    </DisplayPrefsProvider>,
  );
}

describe("AppShell", () => {
  it("renders navigation groups with headings and marks the current page", () => {
    shell();
    expect(screen.getAllByText("Người bệnh").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /Hôm nay/ }).some(button => button.getAttribute("aria-current") === "page")).toBe(true);
  });
  it("still accepts the flat navigation list of 0.1", () => {
    shell({ nav: [{ id: "a", label: "Một" }, { id: "b", label: "Hai" }] });
    expect(screen.getAllByRole("button", { name: "Một" }).length).toBeGreaterThan(0);
  });
  it("switches station and reports it", async () => {
    const onStationChange = vi.fn();
    shell({ unit: { name: "TTYT", stations: STATIONS, currentStationId: "s1", onStationChange } });
    await userEvent.click(screen.getByRole("button", { name: /Trạm đang làm việc: Trạm Hoà Mỹ/ }));
    await userEvent.click(screen.getByRole("button", { name: /Trạm An Hải/ }));
    expect(onStationChange).toHaveBeenCalledWith("s2");
  });
  it("opens quick find with the slash key, not while typing", async () => {
    const onSearch = vi.fn(() => []);
    shell({ search: { onSearch, onSelect: () => {} } });
    await userEvent.keyboard("/");
    expect(await screen.findByRole("combobox", { name: "Từ khoá tìm kiếm" })).toBeTruthy();
  });
  it("shows the notification count in the button name", () => {
    shell({ notifications: [{ id: "1", title: "A" }, { id: "2", title: "B" }] });
    expect(screen.getByRole("button", { name: "Thông báo, 2 mục" })).toBeTruthy();
  });
  it("has no axe violations", async () => {
    const { container } = shell({ unit: { name: "TTYT", stations: STATIONS, currentStationId: "s1" }, search: { onSearch: () => [], onSelect: () => {} }, notifications: [{ id: "1", title: "A" }] });
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(result.violations.map(violation => violation.id + ": " + violation.nodes.map(node => node.html).join(" | "))).toEqual([]);
  });
});

describe("CommandSearch", () => {
  it("searches, moves with arrows and selects with Enter", async () => {
    const onSelect = vi.fn();
    const onSearch = vi.fn((query: string) => [{ id: "1", title: `An ${query}` }, { id: "2", title: "Bình" }]);
    render(<CommandSearch open onClose={() => {}} onSearch={onSearch} onSelect={onSelect} />);
    await userEvent.type(screen.getByRole("combobox"), "ng");
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2));
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith({ id: "2", title: "Bình" });
  });
  it("ignores a slow earlier response", async () => {
    let release: (value: { id: string; title: string }[]) => void = () => {};
    const slow = new Promise<{ id: string; title: string }[]>(resolve => { release = resolve; });
    const onSearch = vi.fn((query: string) => (query === "ab" ? slow : [{ id: "n", title: "Mới" }]));
    render(<CommandSearch open onClose={() => {}} onSearch={onSearch} onSelect={() => {}} />);
    await userEvent.type(screen.getByRole("combobox"), "ab");
    await userEvent.type(screen.getByRole("combobox"), "c");
    await waitFor(() => expect(screen.getByText("Mới")).toBeTruthy());
    release([{ id: "o", title: "Cũ" }]);
    await Promise.resolve();
    expect(screen.queryByText("Cũ")).toBeNull();
  });
  it("says so when nothing is found", async () => {
    render(<CommandSearch open onClose={() => {}} onSearch={() => []} onSelect={() => {}} />);
    await userEvent.type(screen.getByRole("combobox"), "zz");
    expect(await screen.findByText("Không tìm thấy kết quả")).toBeTruthy();
  });
});

describe("Popover", () => {
  it("closes on Escape and returns focus to the button", async () => {
    render(<Popover label="Menu" trigger="Mở">{() => <button type="button">Mục</button>}</Popover>);
    const trigger = screen.getByRole("button", { name: "Mở" });
    await userEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await userEvent.keyboard("{Escape}");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });
});

describe("QueueList", () => {
  const now = new Date("2026-11-11T03:00:00Z");
  const items = [{ id: "1", ticket: "A01", name: "Nguyễn A", since: "2026-11-11T02:10:00Z", priority: "urgent" as const }, { id: "2", ticket: "A02", name: "Trần B", since: "2026-11-11T02:55:00Z" }];
  it("computes waiting minutes and flags long waits in words", () => {
    expect(minutesWaiting("2026-11-11T02:10:00Z", now)).toBe(50);
    expect(minutesWaiting(undefined, now)).toBeNull();
    render(<QueueList label="Hàng" items={items} now={now} />);
    expect(screen.getByText(/Chờ 50 phút \(lâu\)/)).toBeTruthy();
    expect(screen.getByText("Chờ 5 phút")).toBeTruthy();
    expect(screen.getByText("Khẩn")).toBeTruthy();
  });
  it("names each action after the person", async () => {
    const onCall = vi.fn();
    render(<QueueList label="Hàng" items={items} now={now} onCall={onCall} />);
    await userEvent.click(screen.getByRole("button", { name: "Gọi vào: Trần B" }));
    expect(onCall).toHaveBeenCalledWith(items[1]);
  });
  it("explains an empty queue", () => {
    render(<QueueList label="Hàng" items={[]} empty="Chưa có ai chờ." />);
    expect(screen.getByText("Chưa có ai chờ.")).toBeTruthy();
  });
});

describe("ActionList and SegmentedControl", () => {
  it("runs the item action", async () => {
    const onAction = vi.fn();
    render(<ActionList label="Việc" items={[{ id: "1", tone: "warn", title: "Mũi tiêm quá hạn", actionLabel: "Mở", onAction }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Mở" }));
    expect(onAction).toHaveBeenCalled();
  });
  it("selects exactly one option", async () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="Lọc" value="a" onChange={onChange} options={[{ value: "a", label: "Tất cả" }, { value: "b", label: "Dị ứng" }]} />);
    expect(screen.getByRole("radio", { name: "Tất cả" }).getAttribute("aria-checked")).toBe("true");
    await userEvent.click(screen.getByRole("radio", { name: "Dị ứng" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });
});

describe("breadcrumbs and sign-in", () => {
  it("shows group, section and the open record once each", () => {
    render(
      <DisplayPrefsProvider>
        <AppShell product="Clinic" nav={[{ label: "Hôm nay", items: [{ id: "today", label: "Hôm nay" }] }, { label: "Người bệnh", items: [{ id: "patients", label: "Bệnh nhân" }] }]} current="patients" onNavigate={() => {}} breadcrumbs={["Nguyễn Văn An"]}>x</AppShell>
      </DisplayPrefsProvider>,
    );
    const trail = screen.getByRole("navigation", { name: "Vị trí hiện tại" });
    expect(trail.textContent).toBe("ClinicNgười bệnhBệnh nhânNguyễn Văn An");
    expect(trail.querySelector("[aria-current=page]")?.textContent).toBe("Nguyễn Văn An");
  });
  it("does not repeat a section named like its group", () => {
    render(
      <DisplayPrefsProvider>
        <AppShell product="Clinic" nav={[{ label: "Hôm nay", items: [{ id: "today", label: "Hôm nay" }] }]} current="today" onNavigate={() => {}}>x</AppShell>
      </DisplayPrefsProvider>,
    );
    expect(screen.getByRole("navigation", { name: "Vị trí hiện tại" }).textContent).toBe("ClinicHôm nay");
  });
  it("sign-in page calls back and shows the message", async () => {
    const onSignIn = vi.fn(); const onBack = vi.fn();
    render(<SignInPage product="Clinic" onSignIn={onSignIn} onBack={onBack} message="Phiên đã hết hạn" />, { wrapper: DisplayPrefsProvider });
    expect(screen.getByText("Phiên đã hết hạn")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /Đăng nhập với Junctura/ }));
    await userEvent.click(screen.getByRole("button", { name: /Về trang giới thiệu/ }));
    expect(onSignIn).toHaveBeenCalledOnce(); expect(onBack).toHaveBeenCalledOnce();
  });
  it("landing page shows only the sections it is given", () => {
    render(<LandingPage product="Clinic" headline="H" lead="L" onSignIn={() => {}} faq={{ title: "Hỏi đáp", items: [{ q: "Q?", a: "A." }] }} />, { wrapper: DisplayPrefsProvider });
    expect(screen.getByRole("button", { name: "Hỏi đáp" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Lợi ích" })).toBeNull();
  });
});
