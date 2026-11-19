// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Entry point of the portal backend. Configuration comes from the environment
// (in the local demo the file `.junctura/demo/junctura-health-portal.env` that
// `npm run demo:setup` wrote can be fed with `env_file` or `export $(cat ...)`):
//   JUNCTURA_URL            base URL of the Layer-1 Gateway (https, or HTTP loopback in dev)
//   JUNCTURA_APP_CLIENT_ID / JUNCTURA_APP_CLIENT_SECRET   backend client of the app
//   OIDC_ISSUER             issuer whose `iss` claim tokens must carry (falls back to JUNCTURA_ISSUER)
//   OIDC_KEYS_URL           optional: where the JWKS is fetched when the issuer
//                           address is not reachable from here (like `keysBase` of Clinic)
//   PORT / HOST             listen address, default 127.0.0.1:5190
import { createServer } from "node:http";
import { createJuncturaClient } from "@junctura/server-client";
import { createApp } from "./app.mjs";
import { createVerifier } from "./jwt.mjs";
import { createStaffFor } from "./staff.mjs";

const WEB_CLIENT_ID = "health-portal-web";
const DEFAULT_PORT = 5190;

const env = process.env;
const required = name => {
  const value = env[name];
  if (!value) {
    console.error(`${name} is required (see portal/README.md); for the demo, source .junctura/demo/junctura-health-portal.env.`);
    process.exit(1);
  }
  return value;
};

const port = Number(env.PORT ?? DEFAULT_PORT);
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  console.error("PORT must be a valid port number");
  process.exit(1);
}
const host = env.HOST ?? "127.0.0.1";
const juncturaUrl = required("JUNCTURA_URL").replace(/\/+$/, "");
const issuer = (env.OIDC_ISSUER || env.JUNCTURA_ISSUER || "").replace(/\/+$/, "");
if (!issuer) {
  console.error("OIDC_ISSUER (or JUNCTURA_ISSUER) is required");
  process.exit(1);
}
const keysBase = (env.OIDC_KEYS_URL || issuer).replace(/\/+$/, "");

let junctura;
try {
  junctura = createJuncturaClient({ baseUrl: juncturaUrl, clientId: required("JUNCTURA_APP_CLIENT_ID"), clientSecret: required("JUNCTURA_APP_CLIENT_SECRET") });
} catch (error) {
  console.error(`Cannot create the Junctura client: ${error.message}`);
  process.exit(1);
}

const verifier = createVerifier({ issuer, keysBase, clientId: WEB_CLIENT_ID });
const staffFor = createStaffFor();

/** Profile existence on Layer 1, with the caller's own token; never logged. */
const fetchExecution = async (executionId, token) => {
  try {
    const response = await fetch(`${juncturaUrl}/v1/workflows/executions/${executionId}`, {
      headers: { authorization: `Bearer ${token}` },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    await response.body?.cancel();
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: 0 };
  }
};

const server = createServer(createApp({ verifyToken: verifier, junctura, fetchExecution, staffFor }));
server.listen(port, host, () => {
  console.log(`Junctura Health portal API listening on http://${host}:${server.address().port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
