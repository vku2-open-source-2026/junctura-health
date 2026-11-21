// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { afterEach, describe, expect, it, vi } from "vitest";
import { auth } from "../src/auth";
import { ApiError, configureApi, getBlob, getJson, postBytes, postJson } from "../src/api";

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

describe("getBlob", () => {
  it("sends the Bearer token and returns the bytes as a Blob", async () => {
    auth.set({ accessToken: "token-1" });
    stubFetch(() => new Response("bytes", { status: 200, headers: { "Content-Type": "application/pdf" } }));
    const blob = await getBlob("/api/tep/r1");
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBe(5);
    expect(calls[0].url).toBe("/api/tep/r1");
    expect(new Headers(calls[0].init?.headers).get("Authorization")).toBe("Bearer token-1");
  });
  it("clears the session and throws ApiError on 401", async () => {
    auth.set({ accessToken: "token-1" });
    stubFetch(() => json(401, { error: "invalid_token" }));
    await expect(getBlob("/api/tep/r1")).rejects.toMatchObject({ status: 401, code: "invalid_token" });
    expect(auth.get()).toBeNull();
  });
});

describe("postBytes", () => {
  it("posts the raw bytes with the given headers and the Bearer token", async () => {
    auth.set({ accessToken: "token-1" });
    stubFetch(() => json(201, { id: "f1" }));
    const file = new Blob(["pdf-bytes"], { type: "application/pdf" });
    await expect(postBytes("/api/ho-so/e1/tep", file, { "Content-Type": "application/pdf", "X-File-Name": "toa%20quy.pdf" }))
      .resolves.toEqual({ id: "f1" });
    const headers = new Headers(calls[0].init?.headers);
    expect(calls[0].init?.method).toBe("POST");
    expect(headers.get("Content-Type")).toBe("application/pdf");
    expect(headers.get("X-File-Name")).toBe("toa%20quy.pdf");
    expect(headers.get("Authorization")).toBe("Bearer token-1");
    expect(calls[0].init?.body).toBe(file);
  });
  it("throws ApiError with the server's error code", async () => {
    stubFetch(() => json(422, { error: "malware_detected" }));
    await expect(postBytes("/api/x", new Blob(), {})).rejects.toMatchObject({ status: 422, code: "malware_detected" });
  });
  it("clears the session on 401", async () => {
    auth.set({ accessToken: "token-1" });
    stubFetch(() => json(401, { error: "invalid_token" }));
    await expect(postBytes("/api/x", new Blob(), {})).rejects.toMatchObject({ status: 401 });
    expect(auth.get()).toBeNull();
  });
});

describe("session renewal", () => {
  afterEach(() => configureApi(""));

  it("renews the access token shortly before it expires, once for concurrent calls", async () => {
    auth.set({ accessToken: "old", refreshToken: "r1", expiresAt: Date.now() + 5_000 });
    const refresh = vi.fn(async () => { auth.set({ accessToken: "new", refreshToken: "r2", expiresAt: Date.now() + 300_000 }); return true; });
    configureApi("", refresh);
    stubFetch(() => json(200, {}));
    await Promise.all([getJson("/v1/a"), getJson("/v1/b")]);
    expect(refresh).toHaveBeenCalledTimes(1);
    for (const call of calls) expect(new Headers(call.init?.headers).get("Authorization")).toBe("Bearer new");
  });

  it("renews and retries once after a 401, keeping the session", async () => {
    auth.set({ accessToken: "old", refreshToken: "r1", expiresAt: Date.now() + 300_000 });
    configureApi("", async () => { auth.set({ accessToken: "new", refreshToken: "r2", expiresAt: Date.now() + 300_000 }); return true; });
    stubFetch(call => new Headers(call.init?.headers).get("Authorization") === "Bearer new" ? json(200, { ok: true }) : json(401, {}));
    await expect(getJson("/v1/a")).resolves.toEqual({ ok: true });
    expect(calls).toHaveLength(2);
    expect(auth.get()?.accessToken).toBe("new");
  });

  it("ends the session when the renewal is refused", async () => {
    auth.set({ accessToken: "old", refreshToken: "r1", expiresAt: Date.now() + 300_000 });
    configureApi("", async () => false);
    stubFetch(() => json(401, { error: "unauthorized" }));
    await expect(getJson("/v1/a")).rejects.toBeInstanceOf(ApiError);
    expect(auth.get()).toBeNull();
    expect(auth.clearedBy()).toBe("unauthorized");
  });
});
