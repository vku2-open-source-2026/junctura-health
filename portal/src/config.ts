// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

/** Runtime configuration, loaded from /config.json at startup (no secret is baked in). */
export interface PortalConfig {
  /** Base URL of the Junctura stack; empty means same origin (reverse proxy deployment). */
  juncturaUrl: string;
  /** OIDC issuer of the realm, for example https://<host>/identity/realms/junctura. */
  issuer: string;
  /** Public PKCE client of the portal (demo/plan.mjs PORTAL.webClientId). */
  clientId: string;
}

const CLIENT_ID = /^[a-z0-9][a-z0-9_-]{0,62}$/;

/** Safe defaults for local development without a config.json (dev server proxies /v1 and /identity). */
export function fallbackConfig(origin = globalThis.location?.origin ?? ""): PortalConfig {
  return { juncturaUrl: "", issuer: `${origin}/identity/realms/junctura`, clientId: "health-portal-web" };
}

function valid(value: unknown): PortalConfig | null {
  if (!value || typeof value !== "object") return null;
  const { juncturaUrl, issuer, clientId } = value as Record<string, unknown>;
  if (typeof issuer !== "string" || !/^https?:\/\/.+/.test(issuer) || issuer.endsWith("/")) return null;
  if (typeof clientId !== "string" || !CLIENT_ID.test(clientId)) return null;
  if (juncturaUrl !== undefined && (typeof juncturaUrl !== "string" || (juncturaUrl !== "" && !/^https?:\/\/.+/.test(juncturaUrl)))) return null;
  return { juncturaUrl: juncturaUrl ?? "", issuer, clientId };
}

/** Reads /config.json; a missing or broken file falls back to the local defaults. */
export async function loadConfig(fetchJson: typeof fetch = fetch): Promise<PortalConfig> {
  try {
    const response = await fetchJson("config.json", { cache: "no-store" });
    if (response.ok) return valid(await response.json()) ?? fallbackConfig();
  } catch { /* fall through to defaults */ }
  return fallbackConfig();
}
