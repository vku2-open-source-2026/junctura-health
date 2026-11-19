// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { APPS } from "@junctura/health-demo/plan";
import { CONTRACTS } from "@junctura/health-contracts";
import { PortalApp } from "../src/App";
import { auth } from "../src/auth";
import { strings } from "../src/strings";

afterEach(() => {
  vi.unstubAllGlobals();
  window.location.hash = "";
});

describe("public landing", () => {
  it("renders the whole capability catalog and the participating facilities", () => {
    render(<PortalApp />);
    expect(screen.getByText(strings.landing.catalogTitle)).toBeTruthy();
    expect(screen.getAllByText(new RegExp(`^${strings.catalog.version} \\d`)).length).toBe(CONTRACTS.length);
    for (const contract of CONTRACTS) {
      expect(screen.getAllByRole("heading", { name: contract.title }).length).toBe(1);
    }
    for (const app of APPS) {
      expect(screen.getAllByText(app.displayName).length).toBeGreaterThan(0);
    }
  });

  it("links to the coordination desk instead of signing anyone in on the public page", () => {
    render(<PortalApp />);
    const links = screen.getAllByRole("link", { name: strings.app.signIn });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link.getAttribute("href")).toBe("#/dieu-phoi");
    expect(screen.queryByText(strings.signIn.subtitle)).toBeNull();
  });

  it("never calls the Junctura API while rendering", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<PortalApp />);
    for (const call of fetchMock.mock.calls) {
      const url = new URL(String(call[0]), "http://localhost:5180");
      expect(url.pathname).not.toMatch(/^\/(v1|v2|identity)(\/|$)/);
    }
  });
});

describe("routes", () => {
  afterEach(() => { window.location.hash = ""; });

  it("maps every hash route to its page and unknown routes to the home page", async () => {
    const { pageFor } = await import("../src/App");
    const contract = CONTRACTS[0];
    const { unmount } = render(pageFor(`/hop-dong/${contract.slug}`));
    expect(screen.getAllByText(contract.title).length).toBeGreaterThan(0);
    unmount();
    for (const route of ["/hop-dong", "/quy-trinh", "/co-so", "/khong-co", "/hop-dong/../../etc"]) {
      const view = render(pageFor(route));
      expect(view.container.textContent?.length).toBeGreaterThan(0);
      view.unmount();
    }
  });

  it("links every catalog card on the home page to its contract page", () => {
    render(<PortalApp />);
    for (const contract of CONTRACTS) {
      expect(screen.getByRole("link", { name: contract.title }).getAttribute("href")).toBe(`#/hop-dong/${contract.slug}`);
    }
  });
});

const token = (username: string) =>
  `e30.${btoa(JSON.stringify({ preferred_username: username })).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")}.sig`;

describe("coordination desk gate", () => {
  afterEach(() => { auth.clear("logout"); window.location.hash = ""; });

  it("asks staff to sign in and tells patients to use MyHealth", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));
    window.location.hash = "#/dieu-phoi";
    render(<PortalApp />);
    expect(await screen.findByText(strings.signIn.subtitle)).toBeTruthy();
    expect(screen.getByText(strings.signIn.note)).toBeTruthy();
  });

  it("does not open the desk for a patient account", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));
    auth.set({ accessToken: token("benhnhan.an") });
    window.location.hash = "#/dieu-phoi";
    render(<PortalApp />);
    expect(await screen.findByText(strings.signIn.notStaff)).toBeTruthy();
  });

  it("opens the desk for a staff account and reads the workflows from Layer 1", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = new URL(String(input), "http://localhost:5180").pathname;
      if (path === "/v1/workflows/summary") return Response.json({ definitions: [], totals: { definitions: 0, running: 0, completed: 0, cancelled: 0 } });
      if (path === "/v1/workflows/executions") return Response.json({ items: [], limit: 100 });
      return new Response("{}", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);
    auth.set({ accessToken: token("bacsi.benhvien") });
    window.location.hash = "#/dieu-phoi";
    render(<PortalApp />);
    await vi.waitFor(() => {
      const paths = fetchMock.mock.calls.map(call => new URL(String(call[0]), "http://localhost:5180").pathname);
      expect(paths).toContain("/v1/workflows/summary");
    });
    expect(screen.queryByText(strings.signIn.notStaff)).toBeNull();
  });
});
