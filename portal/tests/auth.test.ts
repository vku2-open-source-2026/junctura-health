// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { codeChallenge, expiryOf, oidcEndpoints } from "../src/auth";

describe("PKCE", () => {
  it("computes the S256 challenge: base64url of the SHA-256 digest of the verifier", async () => {
    for (const verifier of ["dBjftJeZ4CVP-mB92K27uhbUJU1p0r_wC1EcBbGYyfs", "a".repeat(43), "trăm-dấu-gạch nối-1234567890"]) {
      const expected = createHash("sha256").update(verifier).digest("base64url");
      await expect(codeChallenge(verifier)).resolves.toBe(expected);
    }
  });
  it("round-trips through base64url without padding", async () => {
    const verifier = "a".repeat(43);
    const challenge = await codeChallenge(verifier);
    expect(challenge).not.toMatch(/[+/=]/);
    expect(Buffer.from(challenge, "base64url")).toEqual(createHash("sha256").update(verifier).digest());
  });
});

describe("OIDC endpoints", () => {
  it("signs in on the public issuer and redeems the code through the portal's own origin", () => {
    const config = { juncturaUrl: "", issuer: "https://junctura.studio/identity/realms/junctura", clientId: "health-portal-web" };
    expect(oidcEndpoints(config, "https://health.junctura.studio")).toEqual({
      authorization: "https://junctura.studio/identity/realms/junctura/protocol/openid-connect/auth",
      token: "https://health.junctura.studio/identity/realms/junctura/protocol/openid-connect/token",
      endSession: "https://junctura.studio/identity/realms/junctura/protocol/openid-connect/logout",
    });
  });
  it("uses juncturaUrl for the token request when the API is on another origin", () => {
    const config = { juncturaUrl: "http://127.0.0.1:8080/", issuer: "http://127.0.0.1:8080/identity/realms/junctura", clientId: "health-portal-web" };
    expect(oidcEndpoints(config, "http://localhost:5180").token).toBe("http://127.0.0.1:8080/identity/realms/junctura/protocol/openid-connect/token");
  });
});

describe("session expiry", () => {
  it("renews by the earlier of the access and refresh token expiries", () => {
    const now = Date.now();
    const at = expiryOf({ expires_in: 3600, refresh_expires_in: 1800 }) ?? 0;
    expect(at - now).toBeGreaterThanOrEqual(1800 * 1000 - 50);
    expect(at - now).toBeLessThan(1801 * 1000);
    expect((expiryOf({ expires_in: 300 }) ?? 0) - now).toBeLessThan(301 * 1000);
    expect(expiryOf({})).toBeUndefined();
  });
});
