// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { codeChallenge } from "../src/auth";

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
