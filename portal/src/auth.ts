// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { useSyncExternalStore } from "react";
import type { PortalConfig } from "./config";
import { readHash } from "./router";

/**
 * Sign-in with Junctura: OIDC Authorization Code + PKCE (S256), written small on purpose.
 * The access token lives in memory only; state and verifier live in sessionStorage just
 * long enough to survive the redirect, and are removed as soon as they are used.
 */

export interface Session {
  accessToken: string;
  idToken?: string;
  /** Display name decoded from the id token (not verified again; display only). */
  name?: string;
}

type Reason = "unauthorized" | "logout";

let session: Session | null = null;
let clearedBy: Reason | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(listener => listener());

export const auth = {
  get: (): Session | null => session,
  /** Why the last session ended, for a friendly message after a 401. */
  clearedBy: (): Reason | null => clearedBy,
  set(next: Session): void {
    clearedBy = null;
    session = next;
    emit();
  },
  clear(reason: Reason): void {
    clearedBy = reason;
    if (session) { session = null; emit(); } else emit();
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** React binding for the in-memory session. */
export function useSession(): Session | null {
  return useSyncExternalStore(auth.subscribe, auth.get, () => null);
}

const STORAGE_KEY = "junctura-portal-signin";

interface Pending {
  state: string;
  verifier: string;
  returnTo: string;
}

export interface Endpoints {
  authorization: string;
  token: string;
  endSession: string;
}

const base64url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** S256 challenge of a PKCE verifier (RFC 7636, base64url of the SHA-256 digest). */
export async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}

const randomToken = (bytes = 32): string => base64url(crypto.getRandomValues(new Uint8Array(bytes)));

const redirectUri = (): string => window.location.origin + window.location.pathname;

/**
 * Keycloak endpoints of the Junctura realm, derived from the issuer (no discovery request).
 * The browser goes to the public issuer to sign in and out (the login page keeps its cookies
 * on that host), while the code is redeemed through the portal's own origin, where /identity
 * is proxied: the strict CSP (connect-src 'self') holds and no CORS is involved.
 */
export function oidcEndpoints(config: PortalConfig, origin: string = window.location.origin): Endpoints {
  const realmPath = new URL(config.issuer).pathname.replace(/\/+$/, "");
  const base = (config.juncturaUrl || origin).replace(/\/+$/, "");
  return {
    authorization: `${config.issuer}/protocol/openid-connect/auth`,
    token: `${base}${realmPath}/protocol/openid-connect/token`,
    endSession: `${config.issuer}/protocol/openid-connect/logout`,
  };
}

const jwtName = (idToken: string): string | undefined => {
  try {
    const payload = atob(idToken.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") ?? "");
    const claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(payload, character => character.charCodeAt(0)))) as Record<string, unknown>;
    return [claims.name, claims.preferred_username, claims.given_name].find(claim => typeof claim === "string" && claim) as string | undefined;
  } catch {
    return undefined;
  }
};

/** Redirects to the Junctura sign-in page. */
export async function login(config: PortalConfig): Promise<void> {
  const endpoints = oidcEndpoints(config);
  const pending: Pending = { state: randomToken(16), verifier: randomToken(32), returnTo: readHash() };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  const url = new URL(endpoints.authorization);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("scope", "openid");
  url.searchParams.set("state", pending.state);
  url.searchParams.set("code_challenge", await codeChallenge(pending.verifier));
  url.searchParams.set("code_challenge_method", "S256");
  window.location.assign(url.toString());
}

/**
 * Finishes a redirect back from Junctura: validates the state, redeems the code with the
 * stored verifier, keeps the token in memory and returns the hash to go back to.
 */
export async function handleCallback(config: PortalConfig): Promise<string | null> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const raw = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (!code || !state) return null;
  let pending: Pending;
  try { pending = JSON.parse(raw ?? "") as Pending; } catch { throw new Error("state_mismatch"); }
  if (!pending || typeof pending.verifier !== "string" || pending.state !== state) throw new Error("state_mismatch");
  const endpoints = oidcEndpoints(config);
  const body = new URLSearchParams({
    grant_type: "authorization_code", code, redirect_uri: redirectUri(), client_id: config.clientId, code_verifier: pending.verifier,
  });
  const response = await fetch(endpoints.token, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
  });
  if (!response.ok) throw new Error("token_exchange_failed");
  const value = (await response.json()) as Record<string, unknown>;
  if (typeof value.access_token !== "string") throw new Error("token_exchange_failed");
  auth.set({
    accessToken: value.access_token,
    idToken: typeof value.id_token === "string" ? value.id_token : undefined,
    name: typeof value.id_token === "string" ? jwtName(value.id_token) : undefined,
  });
  // Drop the OIDC query from the address, keep the hash the user started from.
  window.history.replaceState(null, "", window.location.pathname + window.location.hash);
  return pending.returnTo || null;
}

/** Signs out in Junctura (end_session) and forgets the in-memory token. */
export async function signOut(config: PortalConfig): Promise<void> {
  const idToken = auth.get()?.idToken;
  auth.clear("logout");
  try {
    const url = new URL(oidcEndpoints(config).endSession);
    if (idToken) url.searchParams.set("id_token_hint", idToken);
    url.searchParams.set("post_logout_redirect_uri", redirectUri());
    window.location.assign(url.toString());
  } catch { /* stay signed out locally either way */ }
}
