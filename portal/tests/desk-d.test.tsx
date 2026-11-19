// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { DeskProvider, type DeskApi, type DeskStaff } from "../src/desk";
import { DATA_ROUTES, dataPageFor } from "../src/desk/d";
import {
  durationStatsByWorkflow,
  emergencyEvents,
  eventFamilyCounts,
  waitingByFacility,
  type AppStats,
  type AuditEventItem,
  type AuditEventList,
} from "../src/desk/d/logic";
import { dataStrings as d, eventLabel } from "../src/desk/d/strings";
import type { ExecutionItem, ExecutionList, WorkflowSummary } from "../src/desk/data";
import { CONTRACT_VIEWS } from "../src/space/data";
import { deskStrings as s, facilityLabel } from "../src/desk/strings";

afterEach(() => { window.location.hash = ""; });

// ---------------------------------------------------------------- fake DeskApi

const failure = (status: number, code: string | null = null) => Object.assign(new Error("api"), { status, code });

const makeApi = (get: (path: string) => unknown): { api: DeskApi; gets: string[] } => {
  const gets: string[] = [];
  return {
    gets,
    api: {
      getJson: async path => {
        gets.push(path);
        const result = get(path);
        if (result instanceof Error) throw result;
        return result as never;
      },
      postJson: async () => { throw new Error("not used here"); },
      getBlob: async () => { throw new Error("not used here"); },
      postBytes: async () => { throw new Error("not used here"); },
    },
  };
};

const staffOf = (facility: DeskStaff["facility"]): DeskStaff => ({
  username: `nv-${facility}`,
  displayName: "Trần Sở Y Tế",
  facility,
});

const renderPage = (page: ReactNode, api: DeskApi) =>
  render(<DeskProvider staff={staffOf("so-y-te")} api={api} signOut={() => {}}>{page}</DeskProvider>);

// ---------------------------------------------------------------- fixtures

const CLINIC_ID = "aaaaaaaa-1111-4111-8111-000000000001";
const HOSPITAL_ID = "aaaaaaaa-1111-4111-8111-000000000002";
const CLINIC_NAME = "Trạm Y tế phường Hòa Khánh Bắc";
const HOSPITAL_NAME = "Bệnh viện Đà Nẵng";

const STATS: AppStats = {
  generatedAt: "2026-11-19T09:00:00Z",
  totals: { applications: 2, activeApplications: 2, activeLast24h: 2, activeLast7d: 2, activeConnections: 3 },
  applications: [
    {
      id: CLINIC_ID, name: CLINIC_NAME, state: "active", registeredAt: "2026-11-01T00:00:00Z", lastActivityAt: "2026-11-19T08:30:00Z",
      calls: { outgoing: { last24h: 7, last7d: 20 }, incoming: { last24h: 1, last7d: 4 } },
      capabilities: { published: 4 }, connections: { given: 2, received: 1 }, data: { collections: 5, records: 120 }, files: { count: 3, bytes: 1024 },
    },
    {
      id: HOSPITAL_ID, name: HOSPITAL_NAME, state: "active", registeredAt: "2026-11-01T00:00:00Z", lastActivityAt: "2026-11-19T07:10:00Z",
      calls: { outgoing: { last24h: 2, last7d: 9 }, incoming: { last24h: 5, last7d: 18 } },
      capabilities: { published: 1 }, connections: { given: 1, received: 2 }, data: { collections: 3, records: 80 }, files: null,
    },
  ],
};

const SUMMARY: WorkflowSummary = {
  definitions: [
    {
      key: "junctura_chuyen_tuyen", name: "Chuyển tuyến khám chữa bệnh", application: null,
      steps: [{ name: "Tiếp nhận ở Trạm y tế", owner: "tram-y-te" }, { name: "Bác sĩ bệnh viện duyệt", owner: "benh-vien" }],
      counts: { running: 2, completed: 5, cancelled: 1 }, updatedAt: "2026-11-19T08:00:00Z",
    },
    {
      key: "junctura_xac_minh_don_thuoc", name: "Xác minh đơn thuốc", application: null,
      steps: [{ name: "Nhà thuốc gửi yêu cầu", owner: "nha-thuoc" }], counts: { running: 0, completed: 3, cancelled: 0 },
    },
  ],
  totals: { definitions: 2, running: 2, completed: 8, cancelled: 1 },
};

const hoursAgo = (hours: number): string => new Date(Date.now() - hours * 3_600_000).toISOString();

const runningItem = (id: string, groups: string[], updatedAt: string): ExecutionItem => ({
  id,
  definition: { id: "def-ct", key: "junctura_chuyen_tuyen", name: "Chuyển tuyến khám chữa bệnh", version: 1 },
  status: "running",
  startedAt: hoursAgo(30),
  updatedAt,
  title: `CT-${id.slice(0, 6)}`,
  currentStep: { name: "Tiếp nhận ở Trạm y tế", assignee: null, groups },
});

const completedItem = (id: string, key: string, startedAt: string, updatedAt: string): ExecutionItem => ({
  id,
  definition: { id: `def-${key}`, key, name: key, version: 1 },
  status: "completed",
  startedAt,
  updatedAt,
  title: null,
  currentStep: null,
});

const RUNNING: ExecutionList = {
  items: [
    runningItem("e1", ["tram-y-te"], hoursAgo(1)),
    runningItem("e2", ["tram-y-te"], hoursAgo(25)),
    runningItem("e3", ["benh-vien"], hoursAgo(2)),
  ],
};

const COMPLETED: ExecutionList = {
  items: [
    completedItem("c1", "junctura_chuyen_tuyen", hoursAgo(10), hoursAgo(8)),
    completedItem("c2", "junctura_chuyen_tuyen", hoursAgo(9), hoursAgo(7)),
    completedItem("c3", "junctura_chuyen_tuyen", hoursAgo(6), hoursAgo(3)),
    completedItem("c4", "junctura_xac_minh_don_thuoc", hoursAgo(4), hoursAgo(2)),
    completedItem("c5", "junctura_khong_y_te", hoursAgo(4), hoursAgo(1)),
  ],
};

const auditEvent = (fixture: Partial<AuditEventItem> & { event: string }): AuditEventItem => ({
  eventId: fixture.eventId ?? "eeeeeeee-1111-4111-8111-000000000001",
  occurredAt: fixture.occurredAt ?? "2026-11-19T08:00:00Z",
  tenantId: "demo",
  schemaVersion: 1,
  event: fixture.event,
  resourceType: fixture.resourceType ?? "execution",
  resourceId: fixture.resourceId ?? "rrrrrrrr-1111-4111-8111-000000000001",
  revision: 0,
  actorAppId: fixture.actorAppId ?? null,
  issuer: "https://issuer",
  subject: fixture.subject ?? "service-account-health-clinic",
  managementClient: false,
  outcome: fixture.outcome ?? "success",
  reasonCode: fixture.reasonCode ?? null,
  reason: fixture.reason ?? null,
});

const AUDIT: AuditEventList = {
  items: [
    auditEvent({
      event: "execution.emergency_access", actorAppId: HOSPITAL_ID, reasonCode: "treatment",
      reason: "data_subject_sha256:deadbeefcafe1234567890deadbeefcafe1234567890deadbeefcafe12345678",
      eventId: "eeeeeeee-1111-4111-8111-000000000003",
    }),
    auditEvent({
      event: "execution.subject_accessed", actorAppId: CLINIC_ID, reasonCode: "treatment",
      eventId: "eeeeeeee-1111-4111-8111-000000000001",
    }),
    auditEvent({ event: "grant.activated", actorAppId: null, subject: "admin2", outcome: "success",
      eventId: "eeeeeeee-1111-4111-8111-000000000002" }),
    auditEvent({ event: "resource.share_created", actorAppId: CLINIC_ID, outcome: "denied",
      eventId: "eeeeeeee-1111-4111-8111-000000000004" }),
  ],
  nextCursor: null,
};

// ---------------------------------------------------------------- routing

describe("space D routing", () => {
  it("renders the overview for the space root and nothing for other spaces", () => {
    expect(dataPageFor("/dieu-hanh")).not.toBeNull();
    expect(dataPageFor("/dieu-hanh/trao-doi")).not.toBeNull();
    expect(dataPageFor("/dieu-hanh/du-lieu")).not.toBeNull();
    expect(dataPageFor("/dieu-hanh/chia-se")).not.toBeNull();
    expect(dataPageFor("/lam-viec")).toBeNull();
    expect(dataPageFor("/ho-so")).toBeNull();
  });

  it("exports one route with hash per sub-page", () => {
    expect(DATA_ROUTES.map(route => route.hash)).toEqual([
      "#/dieu-hanh", "#/dieu-hanh/trao-doi", "#/dieu-hanh/du-lieu", "#/dieu-hanh/chia-se",
    ]);
  });

  it("sends the merged catalog route to the sharing page", async () => {
    renderPage(dataPageFor("/dieu-hanh/danh-muc")!, makeApi(() => STATS).api);
    await waitFor(() => expect(window.location.hash).toBe("#/dieu-hanh/chia-se"));
  });
});

// ---------------------------------------------------------------- pure helpers

describe("waiting per facility", () => {
  it("groups running cases by current-step groups and counts the ones older than 24 hours", () => {
    const waiting = waitingByFacility(RUNNING.items, new Date());
    expect(waiting).toEqual([
      { facility: "tram-y-te", total: 2, overdue: 1 },
      { facility: "benh-vien", total: 1, overdue: 0 },
    ]);
  });

  it("treats a missing updatedAt as overdue", () => {
    const item = runningItem("e4", ["nha-thuoc"], hoursAgo(1));
    const waiting = waitingByFacility([{ ...item, updatedAt: null }], new Date());
    expect(waiting[0]).toEqual({ facility: "nha-thuoc", total: 1, overdue: 1 });
  });
});

describe("processing time", () => {
  it("computes the median and the maximum per medical workflow key", () => {
    const stats = durationStatsByWorkflow(COMPLETED.items);
    const byKey = new Map(stats.map(entry => [entry.key, entry]));
    expect(byKey.get("junctura_chuyen_tuyen")).toMatchObject({ count: 3, median: 2 * 3_600_000, max: 3 * 3_600_000 });
    expect(byKey.get("junctura_xac_minh_don_thuoc")).toMatchObject({ count: 1, median: 2 * 3_600_000, max: 2 * 3_600_000 });
  });

  it("only reports the three medical keys", () => {
    const stats = durationStatsByWorkflow(COMPLETED.items);
    expect(stats.map(entry => entry.key).sort()).toEqual(["junctura_chuyen_tuyen", "junctura_xac_minh_don_thuoc"]);
  });
});

describe("audit classification", () => {
  it("labels the known execution events and counts by family", () => {
    expect(eventLabel("execution.subject_accessed")).toBe("Thực thi năng lực (có người bệnh ghi nhận)");
    expect(eventLabel("execution.emergency_access")).toBe("Truy cập cấp cứu");
    expect(eventLabel("grant.activated")).toBe("Cấp quyền");
    expect(eventFamilyCounts(AUDIT.items)).toEqual([
      { family: "execution", count: 2 },
      { family: "grant", count: 1 },
      { family: "resource", count: 1 },
    ]);
    expect(emergencyEvents(AUDIT.items)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------- D · Tổng quan

describe("data overview page", () => {
  const overviewApi = () => makeApi(path => {
    if (path.includes("summary")) return SUMMARY;
    if (path.includes("applications/stats")) return STATS;
    if (path.includes("status=running")) return RUNNING;
    if (path.includes("status=completed")) return COMPLETED;
    return {};
  });

  it("shows the headline counts and the waiting cases per facility with the overdue count", async () => {
    const api = overviewApi();
    renderPage(dataPageFor("/dieu-hanh")!, api.api);
    expect(api.gets[0]).toBe("/v1/workflows/summary");
    await screen.findByText(d.overview.waitingTitle);
    expect(screen.getByText(facilityLabel("tram-y-te"))).toBeTruthy();
    expect(screen.getByText(facilityLabel("benh-vien"))).toBeTruthy();
    expect(screen.getByText(`1 ${d.overview.overdue}`)).toBeTruthy();
    expect(screen.getByText(d.overview.activeApps)).toBeTruthy();
    expect(screen.getByText(d.overview.updatedAt)).toBeTruthy();
  });

  it("shows the per-workflow table with steps and facilities", async () => {
    const view = renderPage(dataPageFor("/dieu-hanh")!, overviewApi().api);
    await screen.findByText("Chuyển tuyến khám chữa bệnh");
    expect(screen.getByText("Bác sĩ bệnh viện duyệt")).toBeTruthy();
    expect(view.container.textContent).toContain("Tiếp nhận ở Trạm y tế");
    expect(view.container.textContent).toContain("Trạm y tế");
    expect(screen.getByText(d.overview.columnFacilities)).toBeTruthy();
  });

  it("refetches when the refresh button is pressed", async () => {
    const api = overviewApi();
    renderPage(dataPageFor("/dieu-hanh")!, api.api);
    await screen.findByText(d.overview.waitingTitle);
    const before = api.gets.length;
    fireEvent.click(screen.getByRole("button", { name: d.overview.refresh }));
    await waitFor(() => expect(api.gets.length).toBeGreaterThan(before));
  });

  it("renders the 403 message as plain Vietnamese", async () => {
    renderPage(dataPageFor("/dieu-hanh")!, makeApi(() => failure(403, "permission_required")).api);
    await screen.findByText(s.errors.forbiddenTitle);
    expect(screen.getByText(s.errors.forbidden)).toBeTruthy();
  });

  it("renders the network failure with a retry action", async () => {
    renderPage(dataPageFor("/dieu-hanh")!, makeApi(() => { throw new TypeError("fetch failed"); }).api);
    await screen.findByText(s.errors.networkTitle);
  });
});

// ---------------------------------------------------------------- D · Trao đổi dữ liệu

describe("data exchange page", () => {
  const exchangeApi = () => makeApi(path => {
    if (path.startsWith("/v1/audit-events")) return AUDIT;
    if (path.includes("applications/stats")) return STATS;
    return {};
  });

  it("fetches the audit events with a since filter for 24 hours and 7 days", async () => {
    const api = exchangeApi();
    renderPage(dataPageFor("/dieu-hanh/trao-doi")!, api.api);
    await screen.findByText(d.exchange.recentTitle);
    expect(api.gets[0]).toMatch(/^\/v1\/audit-events\?limit=100&since=/);
    fireEvent.click(screen.getByLabelText(d.exchange.range7d));
    await waitFor(() => expect(api.gets.some(path => path.startsWith("/v1/audit-events?limit=100&since="))).toBe(true));
    fireEvent.click(screen.getByLabelText(d.exchange.rangeAll));
    await waitFor(() => expect(api.gets.includes("/v1/audit-events?limit=100")).toBe(true));
  });

  it("shows event types, purposes and outcomes without internal identifiers", async () => {
    const view = renderPage(dataPageFor("/dieu-hanh/trao-doi")!, exchangeApi().api);
    await screen.findByText(d.exchange.recentTitle);
    expect(view.container.textContent).toContain(d.exchange.sourceNote);
    expect(view.container.textContent).toContain("Cấp quyền");
    expect(view.container.textContent).toContain("Điều trị");
    expect(view.container.textContent).toContain("Bị từ chối");
    expect(view.container.textContent).toContain(CLINIC_NAME);
    expect(view.container.textContent).not.toContain("subject-account");
    expect(view.container.textContent).not.toContain("service-account-health-clinic");
    expect(view.container.textContent).not.toContain("sha256");
    expect(view.container.textContent).not.toContain("eeeeeeee-1111");
    expect(view.container.textContent).not.toContain("rrrrrrrr-1111");
  });

  it("calls emergency access out in its own review block", async () => {
    const view = renderPage(dataPageFor("/dieu-hanh/trao-doi")!, exchangeApi().api);
    await screen.findByText(d.exchange.emergencyTitle);
    expect(view.container.textContent).toContain(eventLabel("execution.emergency_access"));
  });

  it("renders the 403 message when the audit log refuses", async () => {
    renderPage(dataPageFor("/dieu-hanh/trao-doi")!, makeApi(path =>
      path.startsWith("/v1/audit-events") ? failure(403, "audit_permission_required") : STATS).api);
    await screen.findByText(s.errors.forbiddenTitle);
  });
});

// ---------------------------------------------------------------- D · Bản đồ dữ liệu

describe("data map page", () => {
  const SUMMARY_STORAGE = {
    applications: [
      {
        id: CLINIC_ID, name: CLINIC_NAME, state: "active",
        collections: [{ name: "patients", records: 42, updatedAt: "2026-11-19T07:00:00Z" }],
        files: { count: 3, bytes: 1536, quarantined: 1, updatedAt: "2026-11-19T07:00:00Z" },
      },
      {
        id: HOSPITAL_ID, name: HOSPITAL_NAME, state: "active",
        collections: [], files: null,
      },
    ],
    totals: { collections: [{ name: "patients", records: 42, updatedAt: null }], files: null },
  };

  it("shows collection names, record counts and file aggregates, without contents", async () => {
    const api = makeApi(path => (path.startsWith("/v1/storage/summary") ? SUMMARY_STORAGE : {}));
    const view = renderPage(dataPageFor("/dieu-hanh/du-lieu")!, api.api);
    await screen.findByText(CLINIC_NAME);
    expect(api.gets[0]).toBe("/v1/storage/summary");
    expect(screen.getByText("patients")).toBeTruthy();
    expect(screen.getByText(/42/)).toBeTruthy();
    expect(view.container.textContent).toContain(d.dataMap.explanation);
    expect(view.container.textContent).toContain("cách ly");
    expect(view.container.textContent).toContain(d.dataMap.filesNone);
    expect(view.container.textContent).not.toContain("Bệnh án");
  });

  it("loads field names and fill rates when a card is expanded", async () => {
    const api = makeApi(path => {
      if (path.startsWith("/v1/storage/collections")) {
        return { application: { id: CLINIC_ID, name: CLINIC_NAME }, collections: [
          { name: "patients", records: 42, updatedAt: null, fields: [{ name: "ma_so", type: "string", fillRate: 95.4 }] },
        ] };
      }
      return SUMMARY_STORAGE;
    });
    renderPage(dataPageFor("/dieu-hanh/du-lieu")!, api.api);
    await screen.findByText(CLINIC_NAME);
    fireEvent.click(screen.getAllByRole("button", { name: d.dataMap.showFields })[0]);
    await screen.findByText("ma_so");
    expect(screen.getByText("95%")).toBeTruthy();
    expect(api.gets.some(path => path.startsWith("/v1/storage/collections?application="))).toBe(true);
  });

  it("renders the 403 message when storage refuses", async () => {
    renderPage(dataPageFor("/dieu-hanh/du-lieu")!, makeApi(() => failure(403, null)).api);
    await screen.findByText(s.errors.forbidden);
  });
});

// ---------------------------------------------------------------- D · Chia sẻ và danh mục

describe("data sharing and catalog page", () => {
  it("lists every contract with provider, consumers, purposes, version and emergency access", async () => {
    const api = makeApi(path => (path.includes("applications/stats") ? STATS : {}));
    const dom = renderPage(dataPageFor("/dieu-hanh/chia-se")!, api.api);
    await screen.findByText(d.catalog.title);
    expect(api.gets).toEqual(["/v1/applications/stats"]);
    for (const contract of CONTRACT_VIEWS) {
      expect(screen.getByRole("link", { name: contract.title }).getAttribute("href")).toBe(`#/hop-dong/${contract.slug}`);
      expect(dom.container.textContent).toContain(contract.version);
      expect(dom.container.textContent).toContain(contract.providerName);
    }
    expect(screen.getAllByText(d.catalog.emergencyYes).length).toBe(
      CONTRACT_VIEWS.filter(entry => entry.emergencyAccess).length);
    expect(dom.container.textContent).toContain(d.sharing.consoleNote);
  });

  it("builds the provider-to-consumer flows with the 24h call counts", async () => {
    const api = makeApi(path => (path.includes("applications/stats") ? STATS : {}));
    const dom = renderPage(dataPageFor("/dieu-hanh/chia-se")!, api.api);
    await screen.findByText(d.sharing.flowTitle);
    expect(dom.container.textContent).toContain(CLINIC_NAME);
    expect(dom.container.textContent).toContain(HOSPITAL_NAME);
    expect(dom.container.textContent).toContain("2 / 1");
    expect(dom.container.textContent).toContain(d.sharing.callsHint);
  });

  it("renders the 403 message when the statistics refuse", async () => {
    renderPage(dataPageFor("/dieu-hanh/chia-se")!, makeApi(() => failure(403, null)).api);
    await screen.findByText(s.errors.forbidden);
  });
});
