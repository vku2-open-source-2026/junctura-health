// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it, vi } from "vitest";
import { auth } from "../src/auth";
import { ApiError, configureApi, getJson, postJson } from "../src/api";

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let calls: { url: string; init: RequestInit | undefined }[] = [];

function stubFetch(respond: (call: { url: string; init: RequestInit | undefined }) => Response): void {
  calls = [];
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const call = { url: String(input), init };
    calls.push(call);
    return respond(call);
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  auth.clear("logout");
});

describe("getJson", () => {
  it("sends the Bearer token of the session and returns the parsed body", async () => {
    auth.set({ accessToken: "token-1" });
    stubFetch(() => json(200, { ok: true }));
    await expect(getJson("/v1/audit")).resolves.toEqual({ ok: true });
    expect(calls[0].url).toBe("/v1/audit");
    expect(new Headers(calls[0].init?.headers).get("Authorization")).toBe("Bearer token-1");
  });
  it("prefixes the configured base URL without a double slash", async () => {
    configureApi("http://127.0.0.1:8080/");
    stubFetch(() => json(200, []));
    await expect(getJson("/v1/audit")).resolves.toEqual([]);
    expect(calls[0].url).toBe("http://127.0.0.1:8080/v1/audit");
    configureApi("");
  });
  it("throws ApiError with the server's error code", async () => {
    stubFetch(() => json(403, { error: "forbidden" }));
    const error = await getJson("/v1/audit").catch(reason => reason);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 403, code: "forbidden" });
  });
  it("keeps code null when the error body is not JSON", async () => {
    stubFetch(() => new Response("gateway down", { status: 502 }));
    const error = await getJson("/v1/audit").catch(reason => reason);
    expect(error).toMatchObject({ status: 502, code: null });
  });
});

describe("postJson", () => {
  it("posts a JSON body and returns the parsed response", async () => {
    auth.set({ accessToken: "token-1" });
    stubFetch(() => json(201, { id: "r1" }));
    await expect(postJson("/v1/things", { name: "x" })).resolves.toEqual({ id: "r1" });
    const headers = new Headers(calls[0].init?.headers);
    expect(calls[0].init?.method).toBe("POST");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer token-1");
    expect(headers.get("Idempotency-Key")).toBeNull();
    expect(calls[0].init?.body).toBe(JSON.stringify({ name: "x" }));
  });
  it("sends Idempotency-Key only when the caller provides one", async () => {
    stubFetch(() => json(201, { id: "r1" }));
    await postJson("/v1/things", { name: "x" }, { idempotencyKey: "abc-123" });
    expect(new Headers(calls[0].init?.headers).get("Idempotency-Key")).toBe("abc-123");
  });
  it("resolves to null on 204 without reading a body", async () => {
    stubFetch(() => new Response(null, { status: 204 }));
    await expect(postJson("/v1/things", { name: "x" }, { idempotencyKey: "abc-123" })).resolves.toBeNull();
  });
  it("posts an empty JSON object when no body is given", async () => {
    stubFetch(() => new Response(null, { status: 204 }));
    await postJson("/v1/things");
    expect(calls[0].init?.body).toBe("{}");
  });
});

describe("401", () => {
  it("clears the session before throwing ApiError", async () => {
    auth.set({ accessToken: "token-1" });
    stubFetch(() => json(401, { error: "invalid_token" }));
    const error = await getJson("/v1/audit").catch(reason => reason);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, code: "invalid_token" });
    expect(auth.get()).toBeNull();
    expect(auth.clearedBy()).toBe("unauthorized");
  });
  it("also clears the session on a POST", async () => {
    auth.set({ accessToken: "token-1" });
    stubFetch(() => json(401, { error: "invalid_token" }));
    await expect(postJson("/v1/things", {})).rejects.toMatchObject({ status: 401 });
    expect(auth.get()).toBeNull();
  });
});
