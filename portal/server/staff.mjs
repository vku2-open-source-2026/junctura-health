// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Staff identity of the portal backend: which facility a signed-in demo account
// belongs to. Same role-to-facility table as portal/src/session.ts; patients are
// never staff, anything unknown maps to null.
import { readFileSync } from "node:fs";

const accountsUrl = new URL("../../seed/data/accounts.json", import.meta.url);

const FACILITY_BY_ROLE = Object.freeze({
  "clinic-staff": "tram-y-te",
  physician: "benh-vien",
  pharmacist: "nha-thuoc",
  "claims-assessor": "bao-hiem",
  "health-admin": "so-y-te",
});

function loadAccounts() {
  return JSON.parse(readFileSync(accountsUrl, "utf8"));
}

/** A `staffFor(username)` built once over the seed accounts; null for everyone else. */
export function createStaffFor({ load = loadAccounts, facilityByRole = FACILITY_BY_ROLE } = {}) {
  let map;
  return function staffFor(username) {
    if (!map) {
      map = new Map(load().users
        .filter(user => typeof user.username === "string" && facilityByRole[user.role])
        .map(user => [user.username, { username: user.username, displayName: user.displayName, facility: facilityByRole[user.role] }]));
    }
    return map.get(username) ?? null;
  };
}
