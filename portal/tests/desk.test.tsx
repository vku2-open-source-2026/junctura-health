// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import {
  CaseDetailPage,
  DESK_ROUTES,
  DeskProvider,
  ExecutionsPage,
  OpenCasePage,
  OverviewPage,
  deskPageFor,
  type DeskApi,
  type DeskStaff,
} from "../src/desk";
import { deskStrings as s } from "../src/desk/strings";
import { REFERENCE_PATTERN } from "../src/desk/data";

afterEach(() => { window.location.hash = ""; vi.restoreAllMocks(); });

// ---------------------------------------------------------------- fake DeskApi

class ApiFail {
  constructor(readonly status: number, readonly code: string | null = null) {}
}

const failure = (status: number, code: string | null = null) => Object.assign(new Error("api"), { status, code });

interface PostCall {
  path: string;
  body: unknown;
  opts?: { idempotencyKey?: string };
}

const makeApi = (options: {
  get?: (path: string) => unknown;
  post?: (path: string, body: unknown, opts?: { idempotencyKey?: string }) => unknown;
}): { api: DeskApi; gets: string[]; posts: PostCall[] } => {
  const gets: string[] = [];
  const posts: PostCall[] = [];
  return {
    gets,
    posts,
    api: {
      getJson: async path => {
        gets.push(path);
        const result = options.get?.(path);
        if (result instanceof ApiFail) throw failure(result.status, result.code);
        return result as never;
      },
      postJson: async (path, body, opts) => {
        posts.push({ path, body, opts });
        const result = options.post?.(path, body, opts);
        if (result instanceof ApiFail) throw failure(result.status, result.code);
        return (result ?? null) as never;
      },
    },
  };
};

const staffOf = (facility: DeskStaff["facility"]): DeskStaff => ({
  username: `nv-${facility}`,
  displayName: "Nguyễn Văn A",
  facility,
});

const renderDesk = (page: ReactElement, facility: DeskStaff["facility"], api: DeskApi) =>
  render(<DeskProvider staff={staffOf(facility)} api={api} signOut={() => {}}>{page}</DeskProvider>);

// ---------------------------------------------------------------- fixtures

const STEP_CHUYEN_TUYEN = "Tiếp nhận ở Trạm y tế";
const STEP_BENH_VIEN = "Bác sĩ bệnh viện duyệt";

interface Fixture {
  id?: string;
  key?: string;
  name?: string;
  status?: "running" | "completed" | "cancelled";
  title?: string;
  groups?: string[];
  stepName?: string | null;
  updatedAt?: string;
}

const buildExecution = (fixture: Fixture = {}) => ({
  id: fixture.id ?? "11111111-1111-4111-8111-111111111111",
  definition: {
    id: fixture.key ?? "junctura_chuyen_tuyen",
    key: fixture.key ?? "junctura_chuyen_tuyen",
    name: fixture.name ?? "Chuyển tuyến khám chữa bệnh",
    version: 1,
  },
  status: fixture.status ?? ("running" as const),
  startedAt: "2026-11-17T09:00:00Z",
  updatedAt: fixture.updatedAt ?? "2026-11-18T09:00:00Z",
  title: fixture.title ?? "CT-100001",
  currentStep: fixture.stepName === null ? null : {
    name: fixture.stepName ?? STEP_CHUYEN_TUYEN,
    assignee: null,
    groups: fixture.groups ?? ["tram-y-te"],
  },
});

const SUMMARY = {
  definitions: [
    {
      key: "junctura_chuyen_tuyen",
      name: "Chuyển tuyến khám chữa bệnh",
      application: { id: "tram-y-te", name: "Trạm y tế" },
      steps: [
        { name: STEP_CHUYEN_TUYEN, owner: "tram-y-te" },
        { name: STEP_BENH_VIEN, owner: "benh-vien" },
        { name: "Hoàn tất", owner: "benh-vien" },
      ],
      counts: { running: 2, completed: 1, cancelled: 0 },
      updatedAt: "2026-11-18T09:00:00Z",
    },
    {
      key: "junctura_xac_minh_don_thuoc",
      name: "Xác minh đơn thuốc",
      application: { id: "nha-thuoc", name: "Nhà thuốc" },
      steps: [{ name: "Nhà thuốc gửi", owner: "nha-thuoc" }],
      counts: { running: 1, completed: 0, cancelled: 1 },
      updatedAt: "2026-11-18T08:00:00Z",
    },
  ],
  totals: { definitions: 2, running: 3, completed: 1, cancelled: 1 },
};

const CT_TRAM = buildExecution({});
const CT_BENH_VIEN = buildExecution({ id: "22222222-2222-4222-8222-222222222222", title: "CT-100002", stepName: STEP_BENH_VIEN, groups: ["benh-vien"] });
const DT_NHA_THUOC = buildExecution({ id: "33333333-3333-4333-8333-333333333333", key: "junctura_xac_minh_don_thuoc", name: "Xác minh đơn thuốc", title: "DT-200001", stepName: "Nhà thuốc gửi", groups: ["nha-thuoc"] });
const FOREIGN = buildExecution({ id: "44444444-4444-4444-8444-444444444444", key: "junctura_khac", name: "Quy trình khác", title: "QT-300001" });
const CT_COMPLETED = buildExecution({ id: "55555555-5555-4555-8555-555555555555", title: "CT-100003", status: "completed", stepName: null });

const EXECUTIONS = [CT_TRAM, CT_BENH_VIEN, DT_NHA_THUOC, FOREIGN, CT_COMPLETED];

const DEFINITIONS = {
  items: [
    { id: "def-ct", key: "junctura_chuyen_tuyen", version: 2, name: "Chuyển tuyến khám chữa bệnh" },
    { id: "def-dt", key: "junctura_xac_minh_don_thuoc", version: 1, name: "Xác minh đơn thuốc" },
    { id: "def-cp", key: "junctura_xac_minh_chi_phi", version: 3, name: "Xác minh chi phí" },
  ],
};

const summaryOrCases = (path: string): unknown =>
  path.includes("summary") ? SUMMARY : path.includes("definitions") ? DEFINITIONS : { items: EXECUTIONS };

// ---------------------------------------------------------------- routes

describe("deskPageFor", () => {
  it("returns null outside /dieu-phoi", () => {
    for (const route of ["/", "/hop-dong", "/quy-trinh", "/co-so", "/dieu-phoi-khac"]) {
      expect(deskPageFor(route)).toBeNull();
    }
  });

  it("renders a page with a heading for every desk route", async () => {
    const api = makeApi({ get: summaryOrCases });
    for (const route of DESK_ROUTES.map(entry => entry.path)) {
      const { unmount } = renderDesk(deskPageFor(route) as ReactElement, "tram-y-te", api.api);
      await screen.findByRole("heading", { level: 1 });
      unmount();
    }
  });

  it("shows the not-found desk page for an unknown desk route", () => {
    renderDesk(deskPageFor("/dieu-phoi/khong-co") as ReactElement, "tram-y-te", makeApi({}).api);
    expect(screen.getByText(s.errors.notFoundPage)).toBeTruthy();
  });
});

// ---------------------------------------------------------------- overview

describe("overview page", () => {
  it("shows the summary with per-facility steps and per-status counts", async () => {
    const api = makeApi({ get: path => (path.includes("summary") ? SUMMARY : { items: [] }) });
    renderDesk(<OverviewPage />, "tram-y-te", api.api);
    expect(api.gets).toEqual(["/v1/workflows/summary", "/v1/workflows/executions?limit=100&status=running"]);
    await screen.findByText("Chuyển tuyến khám chữa bệnh");
    expect(screen.getAllByText(STEP_CHUYEN_TUYEN).length).toBeGreaterThan(0);
    expect(screen.getByText("Nhà thuốc gửi")).toBeTruthy();
    expect(screen.getByText("Đang chạy: 2")).toBeTruthy();
    expect(screen.getByText("Hoàn tất: 1")).toBeTruthy();
    expect(screen.getByText("Đã huỷ: 1")).toBeTruthy();
    expect(screen.getByText("Trạm y tế")).toBeTruthy();
  });

  it("lists only the running cases waiting at the staff facility", async () => {
    const api = makeApi({ get: summaryOrCases });
    renderDesk(<OverviewPage />, "tram-y-te", api.api);
    await screen.findByText("CT-100001");
    expect(screen.queryByText("CT-100002")).toBeNull();
    expect(screen.queryByText("DT-200001")).toBeNull();
  });

  it("groups the waiting cases per facility for the health authority", async () => {
    const api = makeApi({ get: summaryOrCases });
    renderDesk(<OverviewPage />, "so-y-te", api.api);
    const card = (await screen.findByText(s.overview.waitingByFacility)).closest("section")!;
    expect(card.textContent).toContain("Bệnh viện");
    expect(card.textContent).toContain("1");
    expect(screen.queryByText("CT-100001")).toBeNull();
  });

  it("renders the 403 message as plain Vietnamese", async () => {
    const api = makeApi({ get: () => new ApiFail(403, "permission_required") });
    renderDesk(<OverviewPage />, "tram-y-te", api.api);
    await screen.findByText(s.errors.forbiddenTitle);
    expect(screen.getByText(s.errors.forbidden)).toBeTruthy();
  });

  it("renders the network failure with a working retry action", async () => {
    const api = makeApi({ get: () => { throw new TypeError("fetch failed"); } });
    renderDesk(<OverviewPage />, "tram-y-te", api.api);
    await screen.findByText(s.errors.networkTitle);
    fireEvent.click(screen.getByRole("button", { name: s.errors.retry }));
    await waitFor(() => expect(api.gets.length).toBe(4));
  });
});

// ---------------------------------------------------------------- cases list

describe("cases list page", () => {
  it("shows only the medical cases with code, workflow, status, step and facility", async () => {
    const api = makeApi({ get: () => ({ items: EXECUTIONS }) });
    renderDesk(<ExecutionsPage />, "tram-y-te", api.api);
    expect(api.gets).toEqual(["/v1/workflows/executions?limit=100"]);
    await screen.findByText("CT-100001");
    expect(screen.getByText("CT-100002")).toBeTruthy();
    expect(screen.getByText("DT-200001")).toBeTruthy();
    expect(screen.getByText("CT-100003")).toBeTruthy();
    expect(screen.queryByText("QT-300001")).toBeNull();
    const row = screen.getByText("CT-100002").closest("tr")!;
    expect(row.textContent).toContain(STEP_BENH_VIEN);
    expect(row.textContent).toContain("Bệnh viện");
  });

  it("refetches with the selected status filter", async () => {
    const api = makeApi({ get: () => ({ items: EXECUTIONS }) });
    renderDesk(<ExecutionsPage />, "tram-y-te", api.api);
    await screen.findByText("CT-100001");
    fireEvent.click(screen.getByRole("button", { name: s.overview.running }));
    await screen.findByText("CT-100001");
    expect(api.gets).toContain("/v1/workflows/executions?limit=100&status=running");
  });

  it("filters to the cases waiting at the staff facility with the toggle", async () => {
    const api = makeApi({ get: () => ({ items: EXECUTIONS }) });
    renderDesk(<ExecutionsPage />, "tram-y-te", api.api);
    await screen.findByText("CT-100002");
    fireEvent.click(screen.getByLabelText(s.cases.mineOnly));
    expect(screen.queryByText("CT-100002")).toBeNull();
    expect(screen.queryByText("DT-200001")).toBeNull();
    expect(screen.getByText("CT-100001")).toBeTruthy();
    fireEvent.click(screen.getByLabelText(s.cases.mineOnly));
    await screen.findByText("CT-100002");
  });

  it("renders the 403 message as plain Vietnamese", async () => {
    const api = makeApi({ get: () => new ApiFail(403, null) });
    renderDesk(<ExecutionsPage />, "tram-y-te", api.api);
    await screen.findByText(s.errors.forbidden);
  });
});

// ---------------------------------------------------------------- open case

describe("open case page", () => {
  it("offers only the workflows the facility may open and posts the right body", async () => {
    const api = makeApi({ get: summaryOrCases, post: () => ({ id: "66666666-6666-4666-8666-666666666666" }) });
    renderDesk(<OpenCasePage />, "nha-thuoc", api.api);
    expect(api.gets).toEqual(["/v1/workflows/definitions"]);
    await screen.findByText(s.openCase.submit);
    const select = screen.getByLabelText(s.openCase.workflow) as HTMLSelectElement;
    expect([...select.options].map(option => option.value)).toEqual(["junctura_xac_minh_don_thuoc"]);
    const reference = (screen.getByLabelText(s.openCase.reference) as HTMLInputElement).value;
    expect(reference).toMatch(REFERENCE_PATTERN);
    fireEvent.click(screen.getByRole("button", { name: s.openCase.submit }));
    await waitFor(() => expect(api.posts).toHaveLength(1));
    expect(api.posts[0].path).toBe("/v1/workflows/executions");
    expect(api.posts[0].body).toEqual({ definitionId: "def-dt", input: { reference, openedBy: "nha-thuoc" } });
    expect(api.posts[0].opts?.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    await waitFor(() => expect(window.location.hash).toBe("#/dieu-phoi/ho-so/66666666-6666-4666-8666-666666666666"));
  });

  it("blocks an invalid reference code", async () => {
    const api = makeApi({ get: summaryOrCases, post: () => ({ id: "x" }) });
    renderDesk(<OpenCasePage />, "tram-y-te", api.api);
    await screen.findByText(s.openCase.submit);
    fireEvent.change(screen.getByLabelText(s.openCase.reference), { target: { value: "ct-123" } });
    fireEvent.click(screen.getByRole("button", { name: s.openCase.submit }));
    await screen.findByRole("alert");
    expect(screen.getByText(s.openCase.referenceInvalid)).toBeTruthy();
    expect(api.posts).toHaveLength(0);
  });

  it("keeps the same idempotency key when the staff clicks again after a failure", async () => {
    const api = makeApi({ get: summaryOrCases, post: () => new ApiFail(503, "engine_unavailable") });
    renderDesk(<OpenCasePage />, "bao-hiem", api.api);
    await screen.findByText(s.openCase.submit);
    fireEvent.click(screen.getByRole("button", { name: s.openCase.submit }));
    await waitFor(() => expect(api.posts).toHaveLength(1));
    fireEvent.click(screen.getByRole("button", { name: s.openCase.submit }));
    await waitFor(() => expect(api.posts).toHaveLength(2));
    expect(api.posts[0].opts?.idempotencyKey).toBeTruthy();
    expect(api.posts[0].opts?.idempotencyKey).toBe(api.posts[1].opts?.idempotencyKey);
    expect(api.posts[1].body).toEqual({
      definitionId: "def-cp",
      input: { reference: (api.posts[0].body as { input: { reference: string } }).input.reference, openedBy: "bao-hiem" },
    });
  });

  it("shows the empty state for facilities that open nothing", async () => {
    const api = makeApi({ get: summaryOrCases });
    renderDesk(<OpenCasePage />, "so-y-te", api.api);
    await screen.findByText(s.openCase.noWorkflow);
    expect(screen.queryByRole("button", { name: s.openCase.submit })).toBeNull();
  });

  it("renders the 403 message when the staff may not open a case", async () => {
    const api = makeApi({ get: () => new ApiFail(403, null) });
    renderDesk(<OpenCasePage />, "nha-thuoc", api.api);
    await screen.findByText(s.errors.forbidden);
  });
});

// ---------------------------------------------------------------- case detail

const DETAIL_ID = "77777777-7777-4777-8777-777777777777";
const DETAIL = {
  id: DETAIL_ID,
  definitionId: "def-ct",
  status: "running",
  input: { reference: "CT-123456", openedBy: "tram-y-te" },
};
const DETAIL_LIST = { items: [buildExecution({ id: DETAIL_ID, title: "CT-123456", stepName: STEP_BENH_VIEN, groups: ["benh-vien"] })] };

const detailOrCases = (path: string): unknown => (path.includes(DETAIL_ID) ? DETAIL : DETAIL_LIST);

describe("case detail page", () => {
  it("draws the workflow steps with progress and the responsible facilities", async () => {
    const api = makeApi({ get: detailOrCases });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "tram-y-te", api.api);
    expect(api.gets).toEqual([`/v1/workflows/executions/${DETAIL_ID}`, "/v1/workflows/executions?limit=100"]);
    await screen.findAllByText("CT-123456");
    expect(screen.getAllByText("Trạm y tế").length).toBe(2); // openedBy + first step group
    expect(screen.getAllByText("Bệnh viện").length).toBe(2); // current + next step groups
    expect(screen.getByText(s.detail.stepCurrent)).toBeTruthy();
    expect(screen.getAllByText(s.detail.stepFuture).length).toBeGreaterThan(0);
  });

  it("shows the complete button only to the facility of the current step", async () => {
    const api = makeApi({ get: detailOrCases });
    const { unmount } = renderDesk(<CaseDetailPage id={DETAIL_ID} />, "benh-vien", api.api);
    await screen.findByRole("button", { name: `Hoàn tất bước ${STEP_BENH_VIEN}` });
    unmount();
  });

  it("hides the complete button for other facilities and the authority", async () => {
    for (const facility of ["tram-y-te", "so-y-te"] as const) {
      const api = makeApi({ get: detailOrCases });
      const { unmount } = renderDesk(<CaseDetailPage id={DETAIL_ID} />, facility, api.api);
      await screen.findAllByText("CT-123456");
      expect(screen.queryByRole("button", { name: new RegExp(s.detail.completeStep) })).toBeNull();
      if (facility === "so-y-te") expect(screen.getByText(s.detail.readonly)).toBeTruthy();
      unmount();
    }
  });

  it("completes the current step after confirmation and reloads", async () => {
    const api = makeApi({ get: detailOrCases, post: () => ({}) });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "benh-vien", api.api);
    fireEvent.click(await screen.findByRole("button", { name: `Hoàn tất bước ${STEP_BENH_VIEN}` }));
    fireEvent.click(await screen.findByRole("button", { name: s.detail.confirmLabel }));
    await waitFor(() => expect(api.posts).toHaveLength(1));
    expect(api.posts[0].path).toBe(`/v1/workflows/executions/${DETAIL_ID}/complete`);
    expect(api.posts[0].body).toEqual({});
    await waitFor(() => expect(api.gets.length).toBe(4));
  });

  it("renders the 403 message when completing is not allowed", async () => {
    const api = makeApi({ get: () => new ApiFail(403, null) });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "benh-vien", api.api);
    await screen.findByText(s.errors.forbidden);
  });

  it("renders the 404 message for a missing case", async () => {
    const api = makeApi({ get: () => new ApiFail(404, null) });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "so-y-te", api.api);
    await screen.findByText(s.errors.notFound);
  });
});
