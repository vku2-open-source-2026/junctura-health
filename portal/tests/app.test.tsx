// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { APPS } from "@junctura/health-demo/plan";
import { CONTRACTS } from "@junctura/health-contracts";
import { auth } from "../src/auth";
import { requestJson } from "../src/api";
import { PortalApp } from "../src/App";
import { strings } from "../src/strings";
import { AccessPage } from "../src/pages/AccessPage";
import { ConsentsPage } from "../src/pages/ConsentsPage";

interface Route { match: string; method?: string; status?: number; body: unknown }
const calls: { method: string; path: string; body?: unknown }[] = [];

function stubFetch(routes: Route[]): void {
  calls.length = 0;
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://localhost:5180");
    const method = init?.method ?? "GET";
    let body: unknown;
    if (typeof init?.body === "string") { try { body = JSON.parse(init.body); } catch { body = init.body; } }
    calls.push({ method, path: url.pathname, body });
    for (const route of routes) {
      if (url.pathname === route.match && (!route.method || route.method === method)) {
        const payload = typeof route.body === "function" ? (route.body as () => unknown)() : route.body;
        return new Response(JSON.stringify(payload), { status: route.status ?? 200, headers: { "Content-Type": "application/json" } });
      }
    }
    return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);
}

const CONFIG = { juncturaUrl: "", issuer: "http://127.0.0.1:8080/identity/realms/junctura", clientId: "health-portal-web" };

afterEach(() => {
  vi.unstubAllGlobals();
  auth.clear("logout");
  window.location.hash = "";
});

const CAPABILITY_ID = "urn:junctura:capability:00000000-0000-4000-8000-000000000001:allergy-list";

describe("public landing", () => {
  it("renders the whole capability catalog and the participating facilities", async () => {
    stubFetch([{ match: "/config.json", body: CONFIG }]);
    render(<PortalApp />);
    expect(await screen.findByText(strings.landing.catalogTitle)).toBeTruthy();
    expect(screen.getAllByText(new RegExp(`^${strings.catalog.version} \\d`)).length).toBe(CONTRACTS.length);
    for (const contract of CONTRACTS) {
      expect(screen.getAllByRole("heading", { name: contract.title }).length).toBe(1);
    }
    for (const app of APPS) {
      expect(screen.getAllByText(app.displayName).length).toBeGreaterThan(0);
    }
  });
});

describe("consents page", () => {
  const consent = { consentId: "c1", consumer: { appId: "junctura-hospital" }, capabilityId: CAPABILITY_ID, purposes: ["treatment"], expiresAt: "2027-01-01T00:00:00.000Z", state: "active" };
  const rows = { consents: [consent] };

  it("lists consents and revokes after confirmation", async () => {
    stubFetch([
      { match: "/v1/me/consents", method: "GET", body: rows },
      {
        match: "/v1/me/consents/c1/revoke", method: "POST",
        body: () => { rows.consents[0] = { ...consent, state: "revoked" }; return rows.consents[0]; },
      },
    ]);
    auth.set({ accessToken: "token" });
    render(<ConsentsPage />);
    expect(await screen.findByText("Bệnh viện Đà Nẵng")).toBeTruthy();
    expect(screen.getByText("Danh sách dị ứng")).toBeTruthy();
    expect(screen.getByText(strings.consents.stateActive)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: strings.consents.revoke }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("sẽ không xem được");
    fireEvent.click(within(dialog).getByRole("button", { name: strings.consents.confirmRevoke }));

    await waitFor(() => expect(screen.getByText(strings.consents.stateRevoked)).toBeTruthy());
    const revoke = calls.find(call => call.method === "POST" && call.path === "/v1/me/consents/c1/revoke");
    expect(revoke?.body).toEqual({});
    expect(rows.consents[0].state).toBe("revoked");
  });

  it("grants a revoked consent again with the default 90-day expiry", async () => {
    stubFetch([
      { match: "/v1/me/consents", method: "GET", body: rows },
      { match: "/v1/me/consents", method: "POST", body: consent },
    ]);
    rows.consents[0] = { ...consent, state: "revoked" };
    auth.set({ accessToken: "token" });
    render(<ConsentsPage />);
    expect(await screen.findByText(strings.consents.stateRevoked)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: strings.consents.grantAgain }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: strings.consents.confirmGrant }));

    await waitFor(() => expect(screen.getByText(strings.consents.done)).toBeTruthy());
    const grant = calls.find(call => call.method === "POST" && call.path === "/v1/me/consents");
    expect(grant?.body).toEqual({
      consumerAppId: "junctura-hospital",
      capabilityId: CAPABILITY_ID,
      purposes: ["treatment"],
      expiresAt: expect.any(String),
    });
    const days = (Date.parse((grant?.body as { expiresAt: string }).expiresAt) - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(89);
    expect(days).toBeLessThanOrEqual(90);
    await waitFor(() => expect(screen.getByText(strings.consents.done)).toBeTruthy());
  });

  it("does not report success when Junctura refuses the change", async () => {
    stubFetch([
      { match: "/v1/me/consents", method: "GET", body: { consents: [consent] } },
      { match: "/v1/me/consents/c1/revoke", method: "POST", status: 403, body: { error: "forbidden" } },
    ]);
    auth.set({ accessToken: "token" });
    render(<ConsentsPage />);
    expect(await screen.findByText(strings.consents.stateActive)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: strings.consents.revoke }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: strings.consents.confirmRevoke }));
    expect(await screen.findByText(strings.consents.errorTitle)).toBeTruthy();
    expect(screen.queryByText(strings.consents.done)).toBeNull();
  });

  it("shows a clear error state when the list cannot be loaded", async () => {
    stubFetch([{ match: "/v1/me/consents", status: 503, body: { error: "consent_unavailable" } }]);
    auth.set({ accessToken: "token" });
    render(<ConsentsPage />);
    expect(await screen.findByText(strings.consents.errorTitle)).toBeTruthy();
  });
});

describe("access page", () => {
  it("shows the empty state when nobody has accessed the data yet", async () => {
    stubFetch([{ match: "/v1/me/data-access", body: { entries: [] } }]);
    auth.set({ accessToken: "token" });
    render(<AccessPage />);
    expect(await screen.findByText(strings.access.emptyTitle)).toBeTruthy();
  });

  it("renders one row per access entry with the emergency flag", async () => {
    stubFetch([{
      match: "/v1/me/data-access",
      body: { entries: [{ at: "2026-11-19T10:15:00.000Z", consumerAppId: "junctura-hospital", capabilityId: CAPABILITY_ID, purpose: "treatment", state: "succeeded", emergency: true }] },
    }]);
    auth.set({ accessToken: "token" });
    render(<AccessPage />);
    expect(await screen.findByText("Bệnh viện Đà Nẵng")).toBeTruthy();
    expect(screen.getByText("Danh sách dị ứng")).toBeTruthy();
    expect(screen.getByText("Điều trị")).toBeTruthy();
    expect(screen.getByText(strings.access.emergency)).toBeTruthy();
    expect(screen.getByText(strings.access.stateSucceeded)).toBeTruthy();
  });
});

describe("api", () => {
  it("a 401 returns the portal to the signed-out state", async () => {
    stubFetch([{ match: "/v1/me/consents", status: 401, body: { error: "invalid_token" } }]);
    auth.set({ accessToken: "token" });
    await expect(requestJson("/v1/me/consents")).rejects.toMatchObject({ status: 401 });
    expect(auth.get()).toBeNull();
  });
});
