// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import accountsData from "../../seed/data/accounts.json";

/**
 * Staff identity for the coordination desk: which facility a signed-in demo account
 * belongs to. Patients are never staff; anything unknown maps to null.
 */

export type Facility = "tram-y-te" | "benh-vien" | "nha-thuoc" | "bao-hiem" | "so-y-te";

export interface Staff {
  username: string;
  displayName: string;
  facility: Facility;
}

interface Account {
  username: string;
  displayName: string;
  role: string;
}

const seeded = accountsData as { users: Account[] };

const FACILITY_BY_ROLE: Record<string, Facility> = {
  "clinic-staff": "tram-y-te",
  physician: "benh-vien",
  pharmacist: "nha-thuoc",
  "claims-assessor": "bao-hiem",
  "health-admin": "so-y-te",
};

/** The staff account for a Junctura username; null for patients and unknown usernames. */
export function staffFor(username: string): Staff | null {
  const account = seeded.users.find(user => user.username === username);
  const facility = account ? FACILITY_BY_ROLE[account.role] : undefined;
  return account && facility ? { username: account.username, displayName: account.displayName, facility } : null;
}

/**
 * `preferred_username` claim of a token payload (base64url JWT, not verified again:
 * display only, the API is the one that rejects a bad token).
 */
export function usernameOf(accessToken: string): string | null {
  try {
    const payload = atob(accessToken.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") ?? "");
    const claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(payload, character => character.charCodeAt(0)))) as Record<string, unknown>;
    return typeof claims.preferred_username === "string" && claims.preferred_username ? claims.preferred_username : null;
  } catch {
    return null;
  }
}
