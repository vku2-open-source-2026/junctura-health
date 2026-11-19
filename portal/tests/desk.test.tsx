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
  deskPageFor,
  isDeskRoute,
  type DeskApi,
  type DeskStaff,
} from "../src/desk";
import { deskStrings as s } from "../src/desk/strings";
import { REFERENCE_PATTERN } from "../src/desk/data";

afterEach(() => { window.location.hash = ""; vi.restoreAllMocks(); });

// ---------------------------------------------------------------- fake DeskApi

interface PostCall {
  path: string;
  body: unknown;
  opts?: { idempotencyKey?: string };
}

interface ByteCall {
  path: string;
  file: Blob;
  headers: Record<string, string>;
}

const genericGet = (path: string): unknown => {
  if (path.includes("executions")) return { items: [] };
  if (path.includes("definitions")) return { items: [] };
  if (path.includes("bang-tin")) return { items: [] };
  if (path.includes("ghi-chu")) return { items: [] };
  if (path.includes("/tep")) return { items: [] };
  if (path.includes("organizations")) return { root: { id: "root", name: "Nền tảng", kind: "platform" } };
  if (path.includes("principals")) return { items: [] };
  if (path.includes("summary")) return { definitions: [], totals: { definitions: 0, running: 0, completed: 0, cancelled: 0 } };
  return {};
};

const makeApi = (options: {
  get?: (path: string) => unknown;
  post?: (path: string, body: unknown, opts?: { idempotencyKey?: string }) => unknown;
  bytes?: (path: string, file: Blob, headers: Record<string, string>) => unknown;
  blob?: (path: string) => Blob | Error;
}): { api: DeskApi; gets: string[]; posts: PostCall[]; bytesCalls: ByteCall[]; blobs: string[] } => {
  const gets: string[] = [];
  const posts: PostCall[] = [];
  const bytesCalls: ByteCall[] = [];
  const blobs: string[] = [];
  return {
    gets,
    posts,
    bytesCalls,
    blobs,
    api: {
      getJson: async path => {
        gets.push(path);
        const result = options.get?.(path) ?? genericGet(path);
        if (result instanceof Error) throw result;
        return result as never;
      },
      postJson: async (path, body, opts) => {
        posts.push({ path, body, opts });
        const result = options.post?.(path, body, opts);
        if (result instanceof Error) throw result;
        return (result ?? null) as never;
      },
      getBlob: async path => {
        blobs.push(path);
        const result = options.blob?.(path);
        if (result instanceof Error) throw result;
        return result as never;
      },      postBytes: async (path, file, headers) => {
        bytesCalls.push({ path, file, headers });
        const result = options.bytes?.(path, file, headers);
        if (result instanceof Error) throw result;
        return result as never;
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
  mucKhan?: string;
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
  ...(fixture.mucKhan === undefined ? {} : { input: { mucKhan: fixture.mucKhan } }),
});

const EXECUTIONS = [
  buildExecution({}),
  buildExecution({ id: "22222222-2222-4222-8222-222222222222", title: "CT-100002", stepName: STEP_BENH_VIEN, groups: ["benh-vien"] }),
];

const DEFINITIONS = {
  items: [
    { id: "def-ct", key: "junctura_chuyen_tuyen", version: 2, name: "Chuyển tuyến khám chữa bệnh" },
    { id: "def-dt", key: "junctura_xac_minh_don_thuoc", version: 1, name: "Xác minh đơn thuốc" },
    { id: "def-cp", key: "junctura_xac_minh_chi_phi", version: 3, name: "Xác minh chi phí" },
  ],
};

// ---------------------------------------------------------------- navigation frame

describe("space navigation", () => {
  it("lists the three spaces in the order H, P, D with letters, full names and an intro", () => {
    expect(DESK_ROUTES.map(space => [space.letter, space.path, space.label])).toEqual([
      ["H", "/lam-viec", s.nav.work],
      ["P", "/ho-so", s.nav.profile],
      ["D", "/dieu-hanh", s.nav.operate],
    ]);
    for (const space of DESK_ROUTES) {
      expect(space.intro).toContain("năng lực");
    }
    expect(DESK_ROUTES[0].children.map(child => child.label)).toEqual([s.nav.today, s.nav.notices, s.nav.directory]);
    expect(DESK_ROUTES[1].children.map(child => child.label)).toEqual([s.nav.caseList, s.nav.openCase]);
  });

  it("tells desk routes apart from public routes", () => {
    for (const route of ["/lam-viec", "/lam-viec/bang-tin", "/ho-so", "/ho-so/mo", "/ho-so/11111111-1111-4111-8111-111111111111", "/dieu-hanh", "/dieu-hanh/x", "/dieu-phoi", "/dieu-phoi/ho-so"]) {
      expect(isDeskRoute(route)).toBe(true);
    }
    for (const route of ["/", "/hop-dong", "/quy-trinh", "/co-so", "/lam-viec-khac", "/ho-so-khac"]) {
      expect(isDeskRoute(route)).toBe(false);
    }
  });

  it("renders a page with a heading for every H and P route", async () => {
    const api = makeApi({});
    for (const route of ["/lam-viec", "/lam-viec/bang-tin", "/lam-viec/danh-ba", "/ho-so", "/ho-so/mo"]) {
      const { unmount } = renderDesk(deskPageFor(route) as ReactElement, "tram-y-te", api.api);
      await screen.findByRole("heading", { level: 1 });
      unmount();
    }
  });

  it("hands every space D route to the D pages", () => {
    for (const route of ["/dieu-hanh", "/dieu-hanh/trao-doi", "/dieu-hanh/du-lieu", "/dieu-hanh/chia-se", "/dieu-hanh/bao-cao"]) {
      expect(deskPageFor(route)).not.toBeNull();
    }
  });

  it("returns null outside the desk routes", () => {
    for (const route of ["/", "/hop-dong", "/quy-trinh", "/co-so", "/dieu-phoi-khac"]) {
      expect(deskPageFor(route)).toBeNull();
    }
  });

  it("redirects the old desk routes to H (Hôm nay)", async () => {
    renderDesk(deskPageFor("/dieu-phoi") as ReactElement, "tram-y-te", makeApi({}).api);
    await waitFor(() => expect(window.location.hash).toBe("#/lam-viec"));
    renderDesk(deskPageFor("/dieu-phoi/ho-so") as ReactElement, "tram-y-te", makeApi({}).api);
    await waitFor(() => expect(window.location.hash).toBe("#/lam-viec"));
  });

  it("shows the not-found desk page for an unknown desk route", () => {
    renderDesk(deskPageFor("/lam-viec/khong-co") as ReactElement, "tram-y-te", makeApi({}).api);
    expect(screen.getByText(s.errors.notFoundPage)).toBeTruthy();
    expect(screen.getByRole("link", { name: s.errors.notFoundPageAction }).getAttribute("href")).toBe("#/lam-viec");
  });
});

// ---------------------------------------------------------------- cases list (P · Danh sách)

describe("cases list page", () => {
  it("shows the medical cases with code, workflow, status, step and facility", async () => {
    const api = makeApi({ get: () => ({ items: EXECUTIONS }) });
    renderDesk(<ExecutionsPage />, "tram-y-te", api.api);
    expect(api.gets).toEqual(["/v1/workflows/executions?limit=100"]);
    await screen.findByText("CT-100001");
    expect(screen.getByText("CT-100002")).toBeTruthy();
    const row = screen.getByText("CT-100002").closest("tr")!;
    expect(row.textContent).toContain(STEP_BENH_VIEN);
    expect(row.textContent).toContain("Bệnh viện");
    expect(screen.queryByText(s.urgency.column)).toBeNull();
  });

  it("shows the urgency column only when the list items carry the digital form", async () => {
    const api = makeApi({ get: () => ({ items: [buildExecution({ mucKhan: "khan" })] }) });
    renderDesk(<ExecutionsPage />, "tram-y-te", api.api);
    await screen.findByText("CT-100001");
    expect(screen.getByText(s.urgency.column)).toBeTruthy();
    expect(screen.getByText(s.urgency.khan)).toBeTruthy();
  });

  it("refetches with the selected status filter", async () => {
    const api = makeApi({ get: () => ({ items: EXECUTIONS }) });
    renderDesk(<ExecutionsPage />, "tram-y-te", api.api);
    await screen.findByText("CT-100001");
    fireEvent.click(screen.getByRole("button", { name: s.status.running }));
    await screen.findByText("CT-100001");
    expect(api.gets).toContain("/v1/workflows/executions?limit=100&status=running");
  });

  it("filters to the cases waiting at the staff facility with the toggle", async () => {
    const api = makeApi({ get: () => ({ items: EXECUTIONS }) });
    renderDesk(<ExecutionsPage />, "tram-y-te", api.api);
    await screen.findByText("CT-100002");
    fireEvent.click(screen.getByLabelText(s.cases.mineOnly));
    expect(screen.queryByText("CT-100002")).toBeNull();
    expect(screen.getByText("CT-100001")).toBeTruthy();
    fireEvent.click(screen.getByLabelText(s.cases.mineOnly));
    await screen.findByText("CT-100002");
  });

  it("links to the moved open-case and detail routes", async () => {
    const api = makeApi({ get: () => ({ items: EXECUTIONS }) });
    renderDesk(<ExecutionsPage />, "tram-y-te", api.api);
    await screen.findByText("CT-100001");
    expect(screen.getByRole("link", { name: s.cases.openCase }).getAttribute("href")).toBe("#/ho-so/mo");
    expect(screen.getByRole("link", { name: "CT-100001" }).getAttribute("href")).toBe("#/ho-so/11111111-1111-4111-8111-111111111111");
  });

  it("renders the 403 message as plain Vietnamese", async () => {
    const api = makeApi({ get: () => Object.assign(new Error("api"), { status: 403, code: null }) });
    renderDesk(<ExecutionsPage />, "tram-y-te", api.api);
    await screen.findByText(s.errors.forbidden);
  });
});

// ---------------------------------------------------------------- open case (P · Mở hồ sơ)

describe("open case page", () => {
  it("offers only the workflows the facility may open and posts the digital form in the input", async () => {
    const api = makeApi({ get: () => ({ items: DEFINITIONS.items }), post: () => ({ id: "66666666-6666-4666-8666-666666666666" }) });
    renderDesk(<OpenCasePage />, "nha-thuoc", api.api);
    expect(api.gets).toEqual(["/v1/workflows/definitions"]);
    await screen.findByText(s.openCase.submit);
    const select = screen.getByLabelText(s.openCase.workflow) as HTMLSelectElement;
    expect([...select.options].map(option => option.value)).toEqual(["junctura_xac_minh_don_thuoc"]);
    const reference = (screen.getByLabelText(s.openCase.reference) as HTMLInputElement).value;
    expect(reference).toMatch(REFERENCE_PATTERN);
    expect((screen.getByLabelText(s.openCase.urgency) as HTMLSelectElement).value).toBe("thuong");
    const coSoNhan = screen.getByLabelText(s.openCase.coSoNhan) as HTMLSelectElement;
    expect([...coSoNhan.options].map(option => option.value)).toEqual(["", "nha-thuoc", "benh-vien"]);
    fireEvent.change(coSoNhan, { target: { value: "benh-vien" } });
    fireEvent.change(screen.getByLabelText(s.openCase.ghiChu), { target: { value: "Chuyển tiếp sáng thứ hai." } });
    fireEvent.click(screen.getByRole("button", { name: s.openCase.submit }));
    await waitFor(() => expect(api.posts).toHaveLength(1));
    expect(api.posts[0].path).toBe("/v1/workflows/executions");
    expect(api.posts[0].body).toEqual({
      definitionId: "def-dt",
      input: { reference, openedBy: "nha-thuoc", mucKhan: "thuong", coSoNhan: "benh-vien", ghiChu: "Chuyển tiếp sáng thứ hai." },
    });
    expect(api.posts[0].opts?.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    await waitFor(() => expect(window.location.hash).toBe("#/ho-so/66666666-6666-4666-8666-666666666666"));
  });

  it("offers the urgency levels with their Vietnamese labels", async () => {
    const api = makeApi({ get: () => ({ items: DEFINITIONS.items }) });
    renderDesk(<OpenCasePage />, "nha-thuoc", api.api);
    await screen.findByText(s.openCase.submit);
    const urgency = screen.getByLabelText(s.openCase.urgency) as HTMLSelectElement;
    expect([...urgency.options].map(option => option.textContent)).toEqual([s.urgency.thuong, s.urgency.khan, s.urgency["cap-cuu"]]);
    fireEvent.change(urgency, { target: { value: "cap-cuu" } });
    fireEvent.click(screen.getByRole("button", { name: s.openCase.submit }));
    await waitFor(() => expect(api.posts).toHaveLength(1));
    expect((api.posts[0].body as { input: { mucKhan: string } }).input.mucKhan).toBe("cap-cuu");
  });

  it("blocks an invalid reference code", async () => {
    const api = makeApi({ get: () => ({ items: DEFINITIONS.items }), post: () => ({ id: "x" }) });
    renderDesk(<OpenCasePage />, "tram-y-te", api.api);
    await screen.findByText(s.openCase.submit);
    fireEvent.change(screen.getByLabelText(s.openCase.reference), { target: { value: "ct-123" } });
    fireEvent.click(screen.getByRole("button", { name: s.openCase.submit }));
    await screen.findByRole("alert");
    expect(screen.getByText(s.openCase.referenceInvalid)).toBeTruthy();
    expect(api.posts).toHaveLength(0);
  });

  it("blocks a note longer than 300 characters before sending", async () => {
    const api = makeApi({ get: () => ({ items: DEFINITIONS.items }) });
    renderDesk(<OpenCasePage />, "tram-y-te", api.api);
    await screen.findByText(s.openCase.submit);
    fireEvent.change(screen.getByLabelText(s.openCase.ghiChu), { target: { value: "a".repeat(301) } });
    fireEvent.click(screen.getByRole("button", { name: s.openCase.submit }));
    await screen.findByText(s.openCase.ghiChuLong);
    expect(api.posts).toHaveLength(0);
  });

  it("keeps the same idempotency key when the staff clicks again after a failure", async () => {
    const api = makeApi({
      get: () => ({ items: DEFINITIONS.items }),
      post: () => Object.assign(new Error("api"), { status: 503, code: "engine_unavailable" }),
    });
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
      input: { reference: (api.posts[0].body as { input: { reference: string } }).input.reference, openedBy: "bao-hiem", mucKhan: "thuong" },
    });
  });

  it("shows the empty state for facilities that open nothing", async () => {
    const api = makeApi({});
    renderDesk(<OpenCasePage />, "so-y-te", api.api);
    await screen.findByText(s.openCase.noWorkflow);
    expect(screen.queryByRole("button", { name: s.openCase.submit })).toBeNull();
  });

  it("renders the 403 message when the staff may not open a case", async () => {
    const api = makeApi({ get: () => Object.assign(new Error("api"), { status: 403, code: null }) });
    renderDesk(<OpenCasePage />, "nha-thuoc", api.api);
    await screen.findByText(s.errors.forbidden);
  });
});

// ---------------------------------------------------------------- case detail (P · Chi tiết)

const DETAIL_ID = "77777777-7777-4777-8777-777777777777";
const DETAIL = {
  id: DETAIL_ID,
  definitionId: "def-ct",
  status: "running",
  input: {
    reference: "CT-123456",
    openedBy: "tram-y-te",
    mucKhan: "khan",
    coSoNhan: "benh-vien",
    ghiChu: "Mời bệnh viện duyệt sớm.",
  },
};
const DETAIL_LIST = { items: [buildExecution({ id: DETAIL_ID, title: "CT-123456", stepName: STEP_BENH_VIEN, groups: ["benh-vien"] })] };

const detailOrCases = (path: string): unknown => {
  if (path.includes("/ghi-chu")) return { items: [] };
  if (path.includes("/tep")) return { items: [] };
  return path.includes(DETAIL_ID) ? DETAIL : DETAIL_LIST;
};

describe("case detail page", () => {
  it("draws the workflow steps with progress and the responsible facilities", async () => {
    const api = makeApi({ get: detailOrCases });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "tram-y-te", api.api);
    expect(api.gets.slice(0, 2)).toEqual([`/v1/workflows/executions/${DETAIL_ID}`, "/v1/workflows/executions?limit=100"]);
    await screen.findAllByText("CT-123456");
    expect(screen.getAllByText("Trạm y tế").length).toBe(2); // openedBy + first step group
    expect(screen.getAllByText("Bệnh viện").length).toBe(3); // coSoNhan + current + next step groups
    expect(screen.getByText(s.detail.stepCurrent)).toBeTruthy();
    expect(screen.getAllByText(s.detail.stepFuture).length).toBeGreaterThan(0);
  });

  it("shows the digital form fields of the case", async () => {
    const api = makeApi({ get: detailOrCases });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "tram-y-te", api.api);
    await screen.findByText(s.detail.form.title);
    expect(screen.getByText(s.urgency.khan)).toBeTruthy();
    expect(screen.getByText(s.detail.form.ghiChu).nextElementSibling?.textContent).toBe("Mời bệnh viện duyệt sớm.");
    expect(screen.getAllByText("Bệnh viện").length).toBeGreaterThanOrEqual(2);
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
    await waitFor(() => expect(api.gets.length).toBe(6));
  });

  it("links back to the moved case list", async () => {
    const api = makeApi({ get: detailOrCases });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "tram-y-te", api.api);
    await screen.findByText(s.detail.form.title);
    expect(screen.getByRole("link", { name: `← ${s.detail.backToList}` }).getAttribute("href")).toBe("#/ho-so");
  });

  it("renders the 403 message when completing is not allowed", async () => {
    const api = makeApi({ get: () => Object.assign(new Error("api"), { status: 403, code: null }) });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "benh-vien", api.api);
    await screen.findByText(s.errors.forbidden);
  });

  it("renders the 404 message for a missing case", async () => {
    const api = makeApi({ get: () => Object.assign(new Error("api"), { status: 404, code: null }) });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "so-y-te", api.api);
    await screen.findByText(s.errors.notFound);
  });
});

// ---------------------------------------------------------------- notes and attachments (P · Chi tiết)

const noteOrCases = (path: string): unknown => {
  if (path.includes("/ghi-chu")) return { items: [{ id: "note-1", executionId: DETAIL_ID, text: "Ghi chú đầu.", author: { displayName: "Bệnh viện", facility: "benh-vien" }, createdAt: "2026-11-18T08:00:00Z" }] };
  if (path.includes("/tep")) return { items: [] };
  return detailOrCases(path);
};

describe("case notes", () => {
  it("reads the notes of the gateway and posts a new one at the end", async () => {
    const api = makeApi({ get: noteOrCases, post: () => ({ id: "note-2", executionId: DETAIL_ID, text: "Ghi chú mới.", author: { displayName: "Nguyễn Văn A", facility: "tram-y-te" }, createdAt: "2026-11-18T09:00:00Z" }) });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "tram-y-te", api.api);
    await screen.findByText("Ghi chú đầu.");
    expect(api.gets).toContain(`/api/ho-so/${DETAIL_ID}/ghi-chu`);
    fireEvent.change(screen.getByLabelText(s.detail.notes.input), { target: { value: "Ghi chú mới." } });
    fireEvent.click(screen.getByRole("button", { name: s.detail.notes.submit }));
    await waitFor(() => expect(api.posts).toHaveLength(1));
    expect(api.posts[0].path).toBe(`/api/ho-so/${DETAIL_ID}/ghi-chu`);
    expect(api.posts[0].body).toEqual({ text: "Ghi chú mới." });
    await screen.findByText("Ghi chú mới.");
    expect(screen.getAllByText("Ghi chú đầu.").length).toBe(1);
  });

  it("keeps the note when the gateway returns nothing and reloads instead", async () => {
    const api = makeApi({ get: noteOrCases, post: () => null });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "tram-y-te", api.api);
    await screen.findByText("Ghi chú đầu.");
    fireEvent.change(screen.getByLabelText(s.detail.notes.input), { target: { value: "Ghi chú mới." } });
    fireEvent.click(screen.getByRole("button", { name: s.detail.notes.submit }));
    await waitFor(() => expect(api.posts).toHaveLength(1));
    await waitFor(() => expect(api.gets.filter(path => path.includes("/ghi-chu")).length).toBe(2));
  });

  it("shows a plain Vietnamese failure when posting is refused", async () => {
    const api = makeApi({ get: noteOrCases, post: () => Object.assign(new Error("api"), { status: 403, code: null }) });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "tram-y-te", api.api);
    await screen.findByText("Ghi chú đầu.");
    fireEvent.change(screen.getByLabelText(s.detail.notes.input), { target: { value: "Ghi chú mới." } });
    fireEvent.click(screen.getByRole("button", { name: s.detail.notes.submit }));
    await screen.findByText(s.detail.notes.failed);
  });
});

// ---------------------------------------------------------------- attachments (P · Tệp đính kèm)

const fileBlob = (options: { type: string; name: string; size?: number }): File => {
  const bytes = new Uint8Array(options.size ?? 10);
  return new File([bytes], options.name, { type: options.type });
};

const fileOrCases = (path: string): unknown => {
  if (path.includes("/tep")) return { items: [{ id: "file-1", executionId: DETAIL_ID, name: "toa.pdf", type: "application/pdf", bytes: 12, author: { displayName: "Bệnh viện", facility: "benh-vien" }, createdAt: "2026-11-18T08:00:00Z" }] };
  return detailOrCases(path);
};

describe("case attachments", () => {
  it("lists the attachments of the case", async () => {
    const api = makeApi({ get: fileOrCases });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "tram-y-te", api.api);
    await screen.findByText("toa.pdf");
    expect(api.gets).toContain(`/api/ho-so/${DETAIL_ID}/tep`);
  });

  it("blocks a wrong file kind and an oversized file before sending anything", async () => {
    const api = makeApi({ get: fileOrCases });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "tram-y-te", api.api);
    await screen.findByText("toa.pdf");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [fileBlob({ type: "text/plain", name: "ghi-chu.txt" })] } });
    fireEvent.click(screen.getByRole("button", { name: s.detail.files.submit }));
    await screen.findByText(s.detail.files.wrongType);
    expect(api.bytesCalls).toHaveLength(0);
    fireEvent.change(input, { target: { files: [fileBlob({ type: "application/pdf", name: "to.pdf", size: 5 * 1024 * 1024 + 1 })] } });
    fireEvent.click(screen.getByRole("button", { name: s.detail.files.submit }));
    await screen.findByText(s.detail.files.tooLarge);
    expect(api.bytesCalls).toHaveLength(0);
  });

  it("sends the raw bytes with Content-Type and X-File-Name headers", async () => {
    const api = makeApi({ get: fileOrCases, bytes: () => ({ id: "file-2", executionId: DETAIL_ID, name: "toa.pdf", type: "application/pdf", bytes: 10, author: { displayName: "Nguyễn Văn A", facility: "tram-y-te" }, createdAt: "2026-11-18T09:00:00Z" }) });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "tram-y-te", api.api);
    await screen.findByText("toa.pdf");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [fileBlob({ type: "application/pdf", name: "toa.pdf" })] } });
    fireEvent.click(screen.getByRole("button", { name: s.detail.files.submit }));
    await waitFor(() => expect(api.bytesCalls).toHaveLength(1));
    expect(api.bytesCalls[0].path).toBe(`/api/ho-so/${DETAIL_ID}/tep`);
    expect(api.bytesCalls[0].headers["Content-Type"]).toBe("application/pdf");
    expect(api.bytesCalls[0].headers["X-File-Name"]).toBe(encodeURIComponent("toa.pdf"));
    expect(api.bytesCalls[0].file.size).toBe(10);
    await waitFor(() => expect(api.gets.filter(path => path.includes("/tep")).length).toBe(2));
  });

  it("tells a malware detection in plain Vietnamese on 422", async () => {
    const api = makeApi({ get: fileOrCases, bytes: () => Object.assign(new Error("api"), { status: 422, code: "malware_detected" }) });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "tram-y-te", api.api);
    await screen.findByText("toa.pdf");
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [fileBlob({ type: "image/png", name: "anh.png" })] } });
    fireEvent.click(screen.getByRole("button", { name: s.detail.files.submit }));
    await screen.findByText(s.detail.files.malware);
    expect(api.gets.filter(path => path.includes("/tep")).length).toBe(1);
  });

  it("downloads an attachment through getBlob", async () => {
    const url = URL.createObjectURL?.(new Blob()) ?? "blob:fake";
    const createObjectURL = vi.fn(() => url);
    const revokeObjectURL = vi.fn();
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL;
    try {
      const api = makeApi({ get: fileOrCases, blob: () => new Blob(["pdf"], { type: "application/pdf" }) });
      renderDesk(<CaseDetailPage id={DETAIL_ID} />, "tram-y-te", api.api);
      await screen.findByText("toa.pdf");
      fireEvent.click(screen.getByRole("button", { name: s.detail.files.download }));
      await waitFor(() => expect(api.blobs).toEqual(["/api/tep/file-1"]));
      await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
      await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith(url));
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });

  it("shows a download failure in plain Vietnamese", async () => {
    const api = makeApi({ get: fileOrCases, blob: () => Object.assign(new Error("api"), { status: 404, code: null }) });
    renderDesk(<CaseDetailPage id={DETAIL_ID} />, "tram-y-te", api.api);
    await screen.findByText("toa.pdf");
    fireEvent.click(screen.getByRole("button", { name: s.detail.files.download }));
    await screen.findByText(s.detail.files.downloadFailed);
  });
});
