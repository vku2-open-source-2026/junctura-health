// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { auth } from "./auth";

/** Base URL of the Junctura API; empty means same origin (reverse proxy or dev proxy). */
let base = "";

/** Renews the session; set by the app once the runtime config is known. */
let refresher: (() => Promise<boolean>) | null = null;
let pending: Promise<boolean> | null = null;

export function configureApi(juncturaUrl: string, refresh?: () => Promise<boolean>): void {
  base = juncturaUrl.endsWith("/") ? juncturaUrl.slice(0, -1) : juncturaUrl;
  refresher = refresh ?? null;
}

/** One refresh at a time: concurrent calls wait for the same renewal. */
function refreshOnce(): Promise<boolean> {
  if (!refresher) return Promise.resolve(false);
  pending ??= refresher().finally(() => { pending = null; });
  return pending;
}

/** Renew a little before expiry, so pages that refresh on a timer never hit a 401. */
const RENEW_BEFORE_MS = 30_000;

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string | null = null) {
    super(code ? `API ${status}: ${code}` : `API ${status}`);
  }
}

/** Adds the Bearer token of the current session to every call, renewing it when needed. */
async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const expiresAt = auth.get()?.expiresAt;
  if (expiresAt !== undefined && expiresAt - Date.now() < RENEW_BEFORE_MS) await refreshOnce();
  const send = () => {
    const token = auth.get()?.accessToken;
    return fetch(`${base}${path}`, {
      ...init,
      headers: { ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  };
  const response = await send();
  // A token refused despite the timer (clock skew, revoked session): renew once and retry.
  if (response.status === 401 && auth.get() && await refreshOnce()) return send();
  return response;
}

/** The server's error code ("error" field of a JSON error body); null when absent or unreadable. */
async function errorCode(response: Response): Promise<string | null> {
  try {
    const value = (await response.clone().json()) as Record<string, unknown>;
    return typeof value.error === "string" ? value.error : null;
  } catch { /* error body is optional */ }
  return null;
}

/** Throws ApiError with the server's code; a 401 signs the session out first. */
async function checked(response: Response): Promise<Response> {
  if (!response.ok) {
    const code = await errorCode(response);
    if (response.status === 401) auth.clear("unauthorized");
    throw new ApiError(response.status, code);
  }
  return response;
}

/** GET a JSON resource of the Junctura API; throws ApiError when refused. */
export async function getJson<T>(path: string): Promise<T> {
  return (await checked(await request(path))).json() as Promise<T>;
}

/** GET a binary resource (e.g. an attachment) as a Blob; throws ApiError when refused. */
export async function getBlob(path: string): Promise<Blob> {
  const response = await request(path);
  await checked(response);
  return response.blob();
}

/**
 * POST a JSON body to the Junctura API; throws ApiError when refused. A 204 has no
 * body and resolves to null; `Idempotency-Key` is sent when the caller provides one
 * (repeats of the same key must not create the resource twice).
 */
export async function postJson<T>(path: string, body?: unknown, opts?: { idempotencyKey?: string }): Promise<T | null> {
  const response = await request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(opts?.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  await checked(response);
  return response.status === 204 ? null : (response.json() as Promise<T>);
}

/**
 * POST raw bytes with explicit headers (e.g. Content-Type and X-File-Name for an upload);
 * throws ApiError when refused and resolves to the parsed response body.
 */
export async function postBytes<T>(path: string, file: Blob, headers: Record<string, string> = {}): Promise<T> {
  const response = await request(path, { method: "POST", headers, body: file });
  await checked(response);
  return response.json() as Promise<T>;
}
