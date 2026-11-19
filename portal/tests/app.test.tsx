// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { APPS } from "@junctura/health-demo/plan";
import { CONTRACTS } from "@junctura/health-contracts";
import { PortalApp } from "../src/App";
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

  it("offers no way to sign in", () => {
    render(<PortalApp />);
    expect(screen.queryByText("Đăng nhập")).toBeNull();
    expect(screen.queryByText(new RegExp(`^${strings.app.name} `))).toBeTruthy();
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
