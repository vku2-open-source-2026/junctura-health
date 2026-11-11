// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AI_LABEL, AiSummaryPanel, AllergyStatus, AlertBanner, ConfirmDialog, DataTable, EmergencyDialog, PatientBanner, StaleNotice, Tabs, TextField } from "../src";

describe("AllergyStatus", () => {
  it("keeps the four states distinct", () => {
    const labels = (["recorded", "none-known", "not-recorded", "unavailable"] as const).map(state => {
      const { container, unmount } = render(<AllergyStatus state={state} items={["Penicillin"]} />);
      const text = container.querySelector("p")!.textContent!;
      unmount();
      return text;
    });
    expect(new Set(labels).size).toBe(4);
    expect(labels).toContain("Chưa ghi nhận dị ứng");
    expect(labels).toContain("Không có dị ứng đã biết");
  });
  it("lists allergens only when recorded", () => {
    render(<AllergyStatus state="recorded" items={["Penicillin", "Tôm"]} />);
    expect(screen.getByText("Penicillin, Tôm")).toBeTruthy();
  });
});

describe("AlertBanner", () => {
  it("names the level in text, and critical uses role=alert", () => {
    render(<AlertBanner level="critical" title="Tương tác thuốc" />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Nghiêm trọng");
    expect(screen.getByText("Nghiêm trọng").className).not.toContain("sr-only");
  });
});

describe("StaleNotice", () => {
  it("warns in words when data is old", () => {
    render(<StaleNotice updatedAt="2020-01-01" now={new Date("2026-01-01")} />);
    expect(screen.getByText(/có thể đã cũ/)).toBeTruthy();
  });
  it("handles a missing date", () => {
    render(<StaleNotice updatedAt={null} />);
    expect(screen.getByText("Chưa rõ ngày cập nhật")).toBeTruthy();
  });
});

describe("Tabs", () => {
  it("moves with arrow keys, Home and End", async () => {
    const onChange = vi.fn();
    render(<Tabs label="Hồ sơ" value="a" onChange={onChange} items={[{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }]} />);
    const first = screen.getByRole("tab", { name: "A" });
    first.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("b");
    await userEvent.keyboard("{End}");
    expect(onChange).toHaveBeenLastCalledWith("c");
    expect(first.getAttribute("tabindex")).toBe("0");
  });
});

describe("DataTable", () => {
  const rows = [{ id: "1", name: "Bình" }, { id: "2", name: "An" }];
  it("sorts by a sortable column and sets aria-sort", async () => {
    render(<DataTable caption="Ds" rows={rows} rowKey={row => row.id} columns={[{ key: "name", header: "Tên", sortValue: row => row.name }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Tên" }));
    const cells = screen.getAllByRole("cell").map(cell => cell.textContent);
    expect(cells).toEqual(["An", "Bình"]);
    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe("ascending");
  });
  it("shows the empty text", () => {
    render(<DataTable caption="Ds" rows={[]} rowKey={() => "x"} columns={[{ key: "n", header: "N" }]} empty="Trống" />);
    expect(screen.getByText("Trống")).toBeTruthy();
  });
});

describe("TextField", () => {
  it("ties the error to the control", () => {
    render(<TextField label="Lý do" error="Bắt buộc" />);
    const input = screen.getByLabelText("Lý do");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(screen.getByRole("alert").id);
  });
});

describe("ConfirmDialog", () => {
  it("opens, and cancel is available", async () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog open title="Xoá?" description="Không hoàn tác" confirmLabel="Xoá" danger onConfirm={() => {}} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole("button", { name: "Huỷ", hidden: true }));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe("EmergencyDialog", () => {
  it("requires a reason and a second confirmation", async () => {
    const onConfirm = vi.fn();
    render(<EmergencyDialog open patientLabel="Nguyễn Văn A" onConfirm={onConfirm} onCancel={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục", hidden: true }));
    expect(screen.getByText(/ít nhất 10 ký tự/)).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Lý do truy cập khẩn cấp/), { target: { value: "Bệnh nhân co giật, không liên lạc được người nhà" } });
    await userEvent.click(screen.getByRole("button", { name: "Tiếp tục", hidden: true }));
    expect(onConfirm).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận truy cập khẩn cấp", hidden: true }));
    expect(onConfirm).toHaveBeenCalledWith("Bệnh nhân co giật, không liên lạc được người nhà");
  });
});

describe("AiSummaryPanel", () => {
  it("is off by default text and never shows a summary when disabled", () => {
    render(<AiSummaryPanel enabled={false} summary="Bí mật" />);
    expect(screen.queryByText("Bí mật")).toBeNull();
    expect(screen.getByText(/đang tắt/)).toBeTruthy();
  });
  it("always carries the warning label next to an AI summary", () => {
    render(<AiSummaryPanel enabled kind="ai" summary="Khám 3 lần" sourceHref="#goc" />);
    expect(screen.getByText(AI_LABEL)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Xem hồ sơ gốc" })).toBeTruthy();
  });
});

describe("PatientBanner", () => {
  it("shows identity and allergy state together", () => {
    render(<PatientBanner name="Nguyễn Văn A" recordId="HS-0001" birthYear={1980} sex="male" allergy={{ state: "not-recorded" }} />);
    expect(screen.getByRole("heading", { name: "Nguyễn Văn A" })).toBeTruthy();
    expect(screen.getByText("Chưa ghi nhận dị ứng")).toBeTruthy();
    expect(screen.getByText("HS-0001")).toBeTruthy();
  });
});
