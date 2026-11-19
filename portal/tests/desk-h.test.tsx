// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ReactElement } from "react";
import {
  DeskProvider,
  DirectoryPage,
  NoticesPage,
  TodayPage,
  type DeskApi,
  type DeskStaff,
} from "../src/desk";
import { deskStrings as s } from "../src/desk/strings";

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
  displayName: "Nguyễn Văn A",
  facility,
});

const renderDesk = (page: ReactElement, facility: DeskStaff["facility"], api: DeskApi) =>
  render(<DeskProvider staff={staffOf(facility)} api={api} signOut={() => {}}>{page}</DeskProvider>);

// ---------------------------------------------------------------- fixtures

const STEP_TRAM = "Tiếp nhận ở Trạm y tế";
const STEP_BENH_VIEN = "Bác sĩ bệnh viện duyệt";

const buildExecution = (fixture: {
  id: string;
  title: string;
  key?: string;
  name?: string;
  groups?: string[];
  stepName?: string | null;
  openedBy?: string;
}) => ({
  id: fixture.id,
  definition: {
    id: fixture.key ?? "junctura_chuyen_tuyen",
    key: fixture.key ?? "junctura_chuyen_tuyen",
    name: fixture.name ?? "Chuyển tuyến khám chữa bệnh",
    version: 1,
  },
  status: "running" as const,
  startedAt: "2026-11-17T09:00:00Z",
  updatedAt: "2026-11-18T09:00:00Z",
  title: fixture.title,
  currentStep: fixture.stepName === null ? null : {
    name: fixture.stepName ?? STEP_TRAM,
    assignee: null,
    groups: fixture.groups ?? ["tram-y-te"],
  },
});

const WAITING_TRAM = buildExecution({ id: "11111111-1111-4111-8111-111111111111", title: "CT-100001" });
const WAITING_BENH_VIEN = buildExecution({ id: "22222222-2222-4222-8222-222222222222", title: "CT-100002", stepName: STEP_BENH_VIEN, groups: ["benh-vien"] });
const OPENED_BY_TRAM = buildExecution({ id: "33333333-3333-4333-8333-333333333333", title: "CT-100003", stepName: STEP_BENH_VIEN, groups: ["benh-vien"] });

/** Which case was opened by which facility, as the engine detail records carry it. */
const OPENED_BY: Readonly<Record<string, string>> = {
  [OPENED_BY_TRAM.id]: "tram-y-te",
  [WAITING_TRAM.id]: "nha-thuoc",
};

const DEFINITIONS = {
  items: [
    { id: "def-ct", key: "junctura_chuyen_tuyen", version: 2, name: "Chuyển tuyến khám chữa bệnh" },
    { id: "def-dt", key: "junctura_xac_minh_don_thuoc", version: 1, name: "Xác minh đơn thuốc" },
    { id: "def-cp", key: "junctura_xac_minh_chi_phi", version: 3, name: "Xác minh chi phí" },
  ],
};

const NOTICES = {
  items: [
    { id: "n1", title: "Tin một", body: "Nội dung tin một.", author: { displayName: "Sở Y tế", facility: "so-y-te" }, createdAt: "2026-11-18T08:00:00Z" },
    { id: "n2", title: "Tin hai", body: "Nội dung tin hai.", author: { displayName: "Sở Y tế", facility: "so-y-te" }, createdAt: "2026-11-18T07:00:00Z" },
    { id: "n3", title: "Tin ba", body: "Nội dung tin ba.", author: { displayName: "Sở Y tế", facility: "so-y-te" }, createdAt: "2026-11-18T06:00:00Z" },
    { id: "n4", title: "Tin bốn", body: "Nội dung tin bốn.", author: { displayName: "Sở Y tế", facility: "so-y-te" }, createdAt: "2026-11-18T05:00:00Z" },
  ],
};

const DIR_ORGS = {
  root: {
    id: "root",
    name: "Junctura",
    kind: "platform",
    children: [
      { id: "app-1", name: "Clinic", kind: "application" },
      { id: "app-2", name: "Hospital", kind: "application" },
    ],
  },
};

const DIR_PEOPLE = {
  items: [
    { subject: "subject-1", issuer: "issuer-1", managementClient: false, permissions: [], enabled: true, displayName: "Trần Bệnh Viện", organization: "Bệnh viện Junctura", jobTitle: "Bác sĩ", kind: null },
    { subject: "subject-2", issuer: "issuer-1", managementClient: false, permissions: [], enabled: true, displayName: "Lê Trạm", organization: "Trạm y tế Junctura", jobTitle: "Y sĩ", kind: "admin" },
    { subject: "subject-3", issuer: "issuer-1", managementClient: true, permissions: ["audit.read"], enabled: true, displayName: null, organization: null, jobTitle: null, kind: "application" },
  ],
};

// ---------------------------------------------------------------- H · Hôm nay

describe("today page", () => {
  const todayApi = (executions: unknown) =>
    makeApi(path => {
      if (path.startsWith("/v1/workflows/executions/")) {
        const id = path.replace("/v1/workflows/executions/", "");
        return { id, definitionId: "def-ct", status: "running", input: OPENED_BY[id] ? { openedBy: OPENED_BY[id] } : {} };
      }
      if (path.includes("/executions?")) return executions;
      if (path.includes("definitions")) return DEFINITIONS;
      if (path.includes("bang-tin")) return NOTICES;
      return {};
    });

  it("greets the staff by name and facility and fetches today's feeds", async () => {
    const api = todayApi({ items: [WAITING_TRAM] });
    const view = renderDesk(<TodayPage />, "tram-y-te", api.api);
    expect(api.gets[0]).toBe("/v1/workflows/executions?limit=100&status=running");
    await screen.findByText(s.today.waitingMine);
    expect(view.container.textContent).toContain(s.today.greeting);
    expect(view.container.textContent).toContain("Nguyễn Văn A");
    expect(view.container.textContent).toContain("Trạm y tế");
  });

  it("lists only the running cases waiting at the staff facility", async () => {
    const api = todayApi({ items: [WAITING_TRAM, WAITING_BENH_VIEN] });
    renderDesk(<TodayPage />, "tram-y-te", api.api);
    await screen.findByText("CT-100001");
    expect(screen.getByText(STEP_TRAM)).toBeTruthy();
    expect(screen.queryByText("CT-100002")).toBeNull();
  });

  it("lists the running cases the facility itself opened, read from each case input", async () => {
    const api = todayApi({ items: [WAITING_BENH_VIEN, OPENED_BY_TRAM] });
    renderDesk(<TodayPage />, "tram-y-te", api.api);
    await screen.findByText("CT-100003");
    const detailPaths = api.gets.filter(path => path.startsWith("/v1/workflows/executions/"));
    expect(detailPaths).toHaveLength(2);
    expect(screen.queryByText("CT-100002")).toBeNull();
  });

  it("shows the three latest notices of the bulletin board", async () => {
    const api = todayApi({ items: [] });
    renderDesk(<TodayPage />, "tram-y-te", api.api);
    await screen.findByText("Tin một");
    expect(screen.getByText("Tin hai")).toBeTruthy();
    expect(screen.getByText("Tin ba")).toBeTruthy();
    expect(screen.queryByText("Tin bốn")).toBeNull();
    expect(screen.getByRole("link", { name: `${s.today.allNotices} →` }).getAttribute("href")).toBe("#/lam-viec/bang-tin");
  });

  it("shows the open-case shortcut only when the facility may open some workflow", async () => {
    const api = todayApi({ items: [] });
    renderDesk(<TodayPage />, "nha-thuoc", api.api);
    await screen.findByText("Tin một");
    expect(screen.getByRole("link", { name: `${s.today.openCase} →` }).getAttribute("href")).toBe("#/ho-so/mo");
  });

  it("hides the open-case shortcut for facilities that open nothing", async () => {
    const api = todayApi({ items: [] });
    renderDesk(<TodayPage />, "so-y-te", api.api);
    await screen.findByText("Tin một");
    expect(screen.queryByRole("link", { name: `${s.today.openCase} →` })).toBeNull();
  });

  it("links the waiting cases to the moved detail route", async () => {
    const api = todayApi({ items: [WAITING_TRAM] });
    renderDesk(<TodayPage />, "tram-y-te", api.api);
    await screen.findByText("CT-100001");
    expect(screen.getByRole("link", { name: "CT-100001" }).getAttribute("href")).toBe("#/ho-so/11111111-1111-4111-8111-111111111111");
  });

  it("renders the 403 message as plain Vietnamese", async () => {
    const api = todayApi(failure(403, "permission_required"));
    renderDesk(<TodayPage />, "tram-y-te", api.api);
    await screen.findByText(s.errors.forbiddenTitle);
    expect(screen.getByText(s.errors.forbidden)).toBeTruthy();
  });

  it("renders the network failure with a working retry action", async () => {
    const api = makeApi(() => { throw new TypeError("fetch failed"); });
    renderDesk(<TodayPage />, "tram-y-te", api.api);
    await screen.findByText(s.errors.networkTitle);
    fireEvent.click(screen.getByRole("button", { name: s.errors.retry }));
    await waitFor(() => expect(api.gets.length).toBeGreaterThan(4));
  });
});

// ---------------------------------------------------------------- H · Bảng tin

describe("notices page", () => {
  it("lists the notices from the gateway for every facility", async () => {
    const api = makeApi(() => NOTICES);
    const view = renderDesk(<NoticesPage />, "tram-y-te", api.api);
    expect(api.gets).toEqual(["/api/bang-tin"]);
    await screen.findByText("Tin một");
    expect(screen.getByText("Tin bốn")).toBeTruthy();
    expect(screen.getByText("Nội dung tin hai.")).toBeTruthy();
    expect(view.container.textContent).toContain("Sở Y tế");
  });

  it("shows the publish form only to the health department", async () => {
    for (const facility of ["tram-y-te", "so-y-te"] as const) {
      const api = makeApi(() => NOTICES);
      const { unmount } = renderDesk(<NoticesPage />, facility, api.api);
      await screen.findByText("Tin một");
      if (facility === "so-y-te") {
        expect(screen.getByText(s.notices.formTitle)).toBeTruthy();
        expect(screen.getByRole("button", { name: s.notices.submit })).toBeTruthy();
      } else {
        expect(screen.queryByText(s.notices.formTitle)).toBeNull();
      }
      unmount();
    }
  });

  it("posts the notice and reloads the board", async () => {
    const notices = { items: [] as unknown[] };
    const gets: string[] = [];
    const posts: { path: string; body: unknown }[] = [];
    const api: DeskApi = {
      getJson: async <T,>(path: string): Promise<T> => {
        gets.push(path);
        return notices as T;
      },
      postJson: async <T,>(path: string, body?: unknown): Promise<T | null> => {
        posts.push({ path, body });
        notices.items = [{ id: "n1", title: "Tin mới", body: "Nội dung.", author: { displayName: "Sở Y tế", facility: "so-y-te" }, createdAt: "2026-11-18T09:00:00Z" }];
        return { id: "n1" } as T;
      },
      getBlob: async (): Promise<Blob> => { throw new Error("not used here"); },
      postBytes: async <T,>(): Promise<T> => { throw new Error("not used here"); },
    };
    renderDesk(<NoticesPage />, "so-y-te", api);
    await screen.findByText(s.notices.formTitle);
    fireEvent.change(screen.getByLabelText(s.notices.titleLabel), { target: { value: "Tin mới" } });
    fireEvent.change(screen.getByLabelText(s.notices.bodyLabel), { target: { value: "Nội dung." } });
    fireEvent.click(screen.getByRole("button", { name: s.notices.submit }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0].path).toBe("/api/bang-tin");
    expect(posts[0].body).toEqual({ title: "Tin mới", body: "Nội dung." });
    await waitFor(() => expect(gets.length).toBe(2));
    await screen.findByText("Tin mới");
    expect(screen.getByRole("status").textContent).toBe(s.notices.posted);
  });

  it("blocks an out-of-range title or body before sending", async () => {
    const posts: unknown[] = [];
    const api: DeskApi = {
      getJson: async <T,>(): Promise<T> => NOTICES as T,
      postJson: async <T,>(path: string, body?: unknown): Promise<T | null> => { posts.push({ path, body }); return null; },
      getBlob: async (): Promise<Blob> => { throw new Error("not used here"); },
      postBytes: async <T,>(): Promise<T> => { throw new Error("not used here"); },
    };
    renderDesk(<NoticesPage />, "so-y-te", api);
    await screen.findByText(s.notices.formTitle);
    fireEvent.change(screen.getByLabelText(s.notices.titleLabel), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText(s.notices.bodyLabel), { target: { value: "Nội dung." } });
    fireEvent.click(screen.getByRole("button", { name: s.notices.submit }));
    await screen.findByText(s.notices.invalid);
    expect(posts).toHaveLength(0);
  });

  it("tells the health department when publishing is refused", async () => {
    const api: DeskApi = {
      getJson: async <T,>(): Promise<T> => NOTICES as T,
      postJson: async <T,>(): Promise<T> => { throw failure(403, "forbidden"); },
      getBlob: async (): Promise<Blob> => { throw new Error("not used here"); },
      postBytes: async <T,>(): Promise<T> => { throw new Error("not used here"); },
    };
    renderDesk(<NoticesPage />, "so-y-te", api);
    await screen.findByText(s.notices.formTitle);
    fireEvent.change(screen.getByLabelText(s.notices.titleLabel), { target: { value: "Tin mới" } });
    fireEvent.change(screen.getByLabelText(s.notices.bodyLabel), { target: { value: "Nội dung." } });
    fireEvent.click(screen.getByRole("button", { name: s.notices.submit }));
    await screen.findByText(s.notices.publishForbidden);
  });

  it("renders the 403 message for other facilities on a refusing gateway", async () => {
    const api = makeApi(() => failure(403, null));
    renderDesk(<NoticesPage />, "tram-y-te", api.api);
    await screen.findByText(s.errors.forbidden);
  });
});

// ---------------------------------------------------------------- H · Danh bạ

describe("directory page", () => {
  it("reads both directory feeds of Layer 1", async () => {
    const api = makeApi(path => (path.includes("organizations") ? DIR_ORGS : DIR_PEOPLE));
    renderDesk(<DirectoryPage />, "tram-y-te", api.api);
    expect(api.gets).toEqual(["/v1/directory/organizations", "/v1/directory/principals"]);
    await screen.findByText("Junctura");
    expect(screen.getAllByText("Clinic").length).toBeGreaterThan(0);
    expect(screen.getByText("Trần Bệnh Viện")).toBeTruthy();
  });

  it("never exposes subject, issuer or permissions", async () => {
    const api = makeApi(path => (path.includes("organizations") ? DIR_ORGS : DIR_PEOPLE));
    renderDesk(<DirectoryPage />, "tram-y-te", api.api);
    await screen.findByText("Trần Bệnh Viện");
    expect(screen.queryByText("subject-1")).toBeNull();
    expect(screen.queryByText("issuer-1")).toBeNull();
    expect(screen.queryByText("audit.read")).toBeNull();
    expect(screen.queryByText("permissions")).toBeNull();
  });

  it("groups the people by organization with job title and kind", async () => {
    const api = makeApi(path => (path.includes("organizations") ? DIR_ORGS : DIR_PEOPLE));
    renderDesk(<DirectoryPage />, "tram-y-te", api.api);
    await screen.findByText("Trần Bệnh Viện");
    expect(screen.getByText("Bệnh viện Junctura")).toBeTruthy();
    const person = screen.getByText("Trần Bệnh Viện").closest("li")!;
    expect(person.textContent).toContain("Bác sĩ");
    expect(person.textContent).toContain(s.directory.kindPerson);
    const admin = screen.getByText("Lê Trạm").closest("li")!;
    expect(admin.textContent).toContain("Y sĩ");
    expect(admin.textContent).toContain(s.directory.kindAdmin);
    expect(screen.getByText("Trạm y tế Junctura")).toBeTruthy();
    expect(screen.queryByText("subject-3")).toBeNull();
  });

  it("filters people and organizations by name", async () => {
    const api = makeApi(path => (path.includes("organizations") ? DIR_ORGS : DIR_PEOPLE));
    renderDesk(<DirectoryPage />, "tram-y-te", api.api);
    await screen.findByText("Trần Bệnh Viện");
    fireEvent.change(screen.getByLabelText(s.directory.filterLabel), { target: { value: "trạm" } });
    await waitFor(() => expect(screen.queryByText("Trần Bệnh Viện")).toBeNull());
    expect(screen.getByText("Lê Trạm")).toBeTruthy();
    expect(screen.queryByText("Clinic")).toBeNull();
  });

  it("renders the 403 message when the directory refuses", async () => {
    const api = makeApi(() => failure(403, null));
    renderDesk(<DirectoryPage />, "tram-y-te", api.api);
    await screen.findByText(s.errors.forbidden);
  });
});
