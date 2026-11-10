// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// What the demo environment consists of, derived from the shared contracts and the
// synthetic accounts. Pure data and functions (no network, no files) so the plan is
// testable; demo/setup.mjs applies it to a running Junctura stack.
import { CONTRACTS } from "../contracts/index.mjs";

export const PROVIDER_PORT = 8443;
export const GRANT_DAYS = 90;

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

export function webClient(app, protocolMappers) {
  const bases = [`http://localhost:${app.webPort}`, `http://127.0.0.1:${app.webPort}`];
  return {
    clientId: app.webClientId, name: `${app.displayName} (web)`, enabled: true, protocol: "openid-connect", publicClient: true,
    standardFlowEnabled: true, directAccessGrantsEnabled: false, redirectUris: bases.map(base => `${base}/*`), webOrigins: bases,
    attributes: { "pkce.code.challenge.method": "S256", "post.logout.redirect.uris": bases.map(base => `${base}/*`).join("##") },
    protocolMappers,
  };
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
  const options = { tenant: "tenant-a", help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--tenant") options.tenant = argv[++i];
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`Unknown argument ${arg}`);
  }
  if (!/^[a-z][a-z0-9-]{0,62}$/.test(options.tenant ?? "")) throw new Error("Invalid --tenant");
  return options;
}

/** A grant is already in place when the trust graph shows it pending or active. */
export const existingGrant = (edges, { providerAppId, consumerAppId, capabilityId, version }) => edges.find(edge =>
  edge.providerAppId === providerAppId && edge.consumerAppId === consumerAppId && edge.capabilityId === capabilityId &&
  edge.version === version && ["active", "pending"].includes(edge.state));
