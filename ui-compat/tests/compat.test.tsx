// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import * as health from "@junctura/health-ui";
import * as rc from "@junctura/ui";
import { DisplayPrefsProvider } from "@junctura/ui";
import { AI_LABEL, AllergyStatus, Button, HealthFrame } from "../src";

// The shared surface that moved to the @junctura/ui RC, exercised by name.
const SHARED = [
  "AppShell", "Button", "Badge", "Card", "DataTable", "Dialog", "Tabs", "Timeline",
  "ToastProvider", "useToast", "StatCard", "StatStrip", "Popover", "CommandSearch",
  "DisplayPrefsProvider", "TextSizeSelector", "ThemeToggle", "IdChip", "PreviewFrame",
  "SignInPage", "LandingPage", "JuncturaMark", "TextField", "cn", "formatDate", "formatNumber",
];

// The surface that must stay Health-specific: present on @junctura/health-ui, absent from the RC.
const HEALTH_ONLY = [
  "PatientBanner", "AllergyStatus", "AlertBanner", "alertLevelLabel", "StaleNotice",
  "SourceBadge", "ConsentBadge", "EmergencyBar", "EmergencyDialog", "QueueList",
  "AiSummaryPanel", "AI_LABEL",
];

describe("export surface of the pinned @junctura/ui RC", () => {
  it("exposes the shared exports Health builds on", () => {
    expect(SHARED.filter(name => !(name in rc))).toEqual([]);
  });
  it("carries no Health-specific exports", () => {
    expect(HEALTH_ONLY.filter(name => name in rc)).toEqual([]);
  });
});

describe("export surface of @junctura/health-ui", () => {
  it("keeps the Health-specific exports", () => {
    expect(HEALTH_ONLY.filter(name => !(name in health))).toEqual([]);
  });
});

describe("Health UI on the RC shell", () => {
  it("renders the shared frame around the health patient banner", () => {
    render(
      <DisplayPrefsProvider>
        <HealthFrame
          product="Junctura Health"
          nav={[{ id: "today", label: "Hôm nay" }, { id: "cases", label: "Hồ sơ" }]}
          current="today"
          onNavigate={() => {}}
          user={{ name: "Trần Thị Mai", role: "Y tá" }}
          patient={{ name: "Lê Văn An", recordId: "HS-0001", allergy: { state: "none-known" } }}
        >
          <p>Nội dung khám</p>
        </HealthFrame>
      </DisplayPrefsProvider>,
    );
    expect(screen.getByText("Lê Văn An")).toBeTruthy();
    expect(screen.getByText("Nội dung khám")).toBeTruthy();
    expect(screen.getAllByText("Trần Thị Mai").length).toBeGreaterThan(0);
    // The RC shell shows the nav in the side bar and in the phone bottom bar.
    expect(screen.getAllByRole("button", { name: "Hôm nay" }).length).toBeGreaterThan(0);
  });
  it("renders shared and Health-specific components side by side", () => {
    render(
      <div>
        <Button>Tải thêm</Button>
        <AllergyStatus state="recorded" items={["Penicillin"]} />
        <p>{AI_LABEL}</p>
      </div>,
    );
    expect(screen.getByRole("button", { name: "Tải thêm" })).toBeTruthy();
    expect(screen.getByText("Penicillin")).toBeTruthy();
    expect(screen.getByText(AI_LABEL)).toBeTruthy();
  });
});
