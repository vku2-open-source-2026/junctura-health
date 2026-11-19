// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { auth } from "./auth";

/** Base URL of the Junctura API; empty means same origin (reverse proxy or dev proxy). */
let base = "";

export function configureApi(juncturaUrl: string): void {
  base = juncturaUrl.endsWith("/") ? juncturaUrl.slice(0, -1) : juncturaUrl;
}

export class ApiError extends Error {
  constructor(readonly status: number, readonly code?: string) {
    super(code ? `API ${status}: ${code}` : `API ${status}`);
  }
}

/** Adds the Bearer token and reacts to a 401 by returning to the signed-out state. */
export async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const token = auth.get()?.accessToken;
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (response.status === 401) auth.clear("unauthorized");
  return response;
}

/** `request` plus JSON parsing: throws ApiError with the server's error code. */
export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await request(path, init);
  if (!response.ok) {
    let code: string | undefined;
    try {
      const value = (await response.json()) as Record<string, unknown>;
      if (typeof value.error === "string") code = value.error;
    } catch { /* error body is optional */ }
    throw new ApiError(response.status, code);
  }
  return response.json() as Promise<T>;
}

/** POST with a JSON body (the Junctura API requires application/json); throws ApiError when refused. */
export async function postJson(path: string, body: unknown = {}): Promise<Response> {
  const response = await request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) {
    let code: string | undefined;
    try {
      const value = (await response.clone().json()) as Record<string, unknown>;
      if (typeof value.error === "string") code = value.error;
    } catch { /* error body is optional */ }
    throw new ApiError(response.status, code);
  }
  return response;
}
