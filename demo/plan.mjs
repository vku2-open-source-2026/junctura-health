// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// What the demo environment consists of, derived from the shared contracts and the
// synthetic accounts. Pure data and functions (no network, no files) so the plan is
// testable; demo/setup.mjs applies it to a running Junctura stack.
import { CONTRACTS } from "../contracts/index.mjs";

export const PROVIDER_PORT = 8443;
export const GRANT_DAYS = 90;
const DOMAIN = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const LOGOUT_URIS = "post.logout.redirect.uris";

// One Junctura application per repository. `clientId` is the backend (service
// account) client, `webClientId` the public PKCE client its browser UI signs in with.
export const APPS = Object.freeze([
  { name: "junctura-clinic", key: "clinic", displayName: "Trạm Y tế phường Hòa Khánh Bắc", webPort: 5181 },
  { name: "junctura-hospital", key: "hospital", displayName: "Bệnh viện Đà Nẵng", webPort: 5182 },
  { name: "junctura-myhealth", key: "myhealth", displayName: "Sổ sức khỏe của tôi", webPort: 5183 },
  { name: "junctura-pharmacy", key: "pharmacy", displayName: "Nhà thuốc", webPort: 5184 },
  { name: "junctura-insurance", key: "insurance", displayName: "Bảo hiểm y tế", webPort: 5185 },
].map(app => Object.freeze({ ...app, clientId: `health-${app.key}`, webClientId: `health-${app.key}-web`,
  providerHost: `${app.key}.provider.internal`, origin: `https://${app.key}.provider.internal:${PROVIDER_PORT}` })));

export const appByName = name => {
  const app = APPS.find(item => item.name === name);
  if (!app) throw new RangeError(`Unknown application ${name}`);
  return app;
};

// The public portal of Layer 2: a read-only site of this repository that introduces the
// shared capability space. No sign-in, no Junctura client and no API calls at runtime;
// patients manage their consents in the MyHealth app. `webPort` is for the docs only.
export const PORTAL = Object.freeze({
  name: "junctura-health-portal", key: "health", displayName: "Cổng Junctura Health", webPort: 5180,
});

/** Public HTTPS origin of a browser app on its own subdomain, e.g. https://clinic.junctura.studio. */
export const publicOrigin = (key, domain) => `https://${key}.${domain}`;

const localOrigins = port => [`http://localhost:${port}`, `http://127.0.0.1:${port}`];

/** Browser origins of an application's web client: its local port, plus its subdomain when a domain is given. */
export const appWebOrigins = (app, domain) => [...localOrigins(app.webPort), ...(domain ? [publicOrigin(app.key, domain)] : [])];

function publicWebClient({ clientId, name }, protocolMappers, origins) {
  const bases = origins.map(origin => origin.replace(/\/+$/, ""));
  return {
    clientId, name, enabled: true, protocol: "openid-connect", publicClient: true,
    standardFlowEnabled: true, directAccessGrantsEnabled: false, redirectUris: bases.map(base => `${base}/*`), webOrigins: bases,
    attributes: { "pkce.code.challenge.method": "S256", [LOGOUT_URIS]: bases.map(base => `${base}/*`).join("##") },
    protocolMappers,
  };
}

/** Applications that publish at least one capability, in a stable order. */
export const providers = (contracts = CONTRACTS) => APPS.filter(app => contracts.some(c => c.provider === app.name));

/** One grant per (capability, consumer) pair of the contracts. */
export function planGrants(contracts = CONTRACTS) {
  return contracts.flatMap(contract => contract.consumers.map(consumer => ({
    slug: contract.slug, version: contract.version, provider: contract.provider, consumer, operations: ["discover", "invoke"], days: GRANT_DAYS,
  })));
}

/** Exact origins Core must allow as internal providers (C4A_INTERNAL_PROVIDER_ORIGINS). */
export const internalOrigins = (contracts = CONTRACTS) => providers(contracts).map(app => app.origin);

/** Public PKCE Keycloak client of an application's browser UI, for the given origins. */
export const webClient = (app, protocolMappers, origins = appWebOrigins(app)) =>
  publicWebClient({ clientId: app.webClientId, name: `${app.displayName} (web)` }, protocolMappers, origins);

/**
 * Adds the redirect URIs, web origins and post-logout URIs of `desired` that an existing
 * Keycloak client lacks, and never removes any (other environments may still use them).
 * Returns the updated representation, or null when nothing is missing.
 */
export function mergeWebClient(existing, desired) {
  const logout = client => String(client.attributes?.[LOGOUT_URIS] ?? "").split("##").filter(Boolean);
  let changed = false;
  const union = (have = [], want = []) => {
    const out = [...have];
    for (const value of want) if (!out.includes(value)) { out.push(value); changed = true; }
    return out;
  };
  const redirectUris = union(existing.redirectUris, desired.redirectUris);
  const webOrigins = union(existing.webOrigins, desired.webOrigins);
  const logoutUris = union(logout(existing), logout(desired));
  if (!changed) return null;
  return { ...existing, redirectUris, webOrigins, attributes: { ...existing.attributes, [LOGOUT_URIS]: logoutUris.join("##") } };
}

// "BS. Phạm Minh Quang" -> first name "Quang", last name "BS. Phạm Minh" (Vietnamese order).
export function splitName(displayName) {
  const parts = displayName.trim().split(/\s+/);
  return parts.length === 1 ? { firstName: parts[0], lastName: parts[0] } : { firstName: parts.at(-1), lastName: parts.slice(0, -1).join(" ") };
}

/** Keycloak user representation for one synthetic account; `id` asks for the seeded subject. */
export function userRepresentation(account, tenant, password) {
  return {
    id: account.subject, username: account.username, enabled: true, emailVerified: true,
    email: `${account.username}@junctura.invalid`, ...splitName(account.displayName),
    attributes: { tenant_id: [tenant] },
    credentials: [{ type: "password", value: password, temporary: false }],
  };
}

const line = (key, value) => {
  if (/[\r\n]/.test(String(value))) throw new TypeError(`${key} must be a single line`);
  return `${key}=${value}`;
};

/** Private environment file of one application (written under .junctura/demo/, never committed). */
export function renderAppEnv(app, { baseUrl, tenant, appId, clientSecret }) {
  return [
    `# ${app.name}: Junctura credentials for the local demo. Private - never commit or ship to a browser.`,
    line("JUNCTURA_URL", baseUrl),
    line("JUNCTURA_TENANT", tenant),
    line("JUNCTURA_APP_ID", appId),
    line("JUNCTURA_APP_CLIENT_ID", app.clientId),
    line("JUNCTURA_APP_CLIENT_SECRET", clientSecret),
    line("JUNCTURA_WEB_CLIENT_ID", app.webClientId),
    line("JUNCTURA_ISSUER", `${baseUrl}/identity/realms/junctura`),
    line("WEB_PORT", app.webPort),
    line("PROVIDER_HOST", app.providerHost),
    line("PROVIDER_PORT", PROVIDER_PORT),
    "",
  ].join("\n");
}

/** Minimal KEY=VALUE reader (comments and blank lines ignored, optional quotes). */
export function parseEnv(text) {
  const values = {};
  for (const raw of text.split(/\r?\n/)) {
    const match = raw.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || raw.trimStart().startsWith("#")) continue;
    values[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
  return values;
}

export function parseArgs(argv) {
  const options = { tenant: "tenant-a", domain: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--tenant") options.tenant = argv[++i];
    else if (arg === "--domain") options.domain = argv[++i];
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (!/^[a-z][a-z0-9-]{0,62}$/.test(options.tenant ?? "")) throw new Error("Invalid --tenant");
  if (options.domain !== null && !DOMAIN.test(options.domain ?? "")) throw new Error("Invalid --domain (expected a host name such as junctura.studio)");
  return options;
}

/** A grant is already in place when the trust graph shows it pending or active. */
export const existingGrant = (edges, { providerAppId, consumerAppId, capabilityId, version }) => edges.find(edge =>
  edge.providerAppId === providerAppId && edge.consumerAppId === consumerAppId && edge.capabilityId === capabilityId &&
  edge.version === version && ["active", "pending"].includes(edge.state));
