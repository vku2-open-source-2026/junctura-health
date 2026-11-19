// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { deskStrings } from "./strings";

/** Routes of the coordination desk, for the coordinator to wire into the app nav. */
export interface DeskRoute {
  path: string;
  label: string;
}

export const DESK_ROUTES: readonly DeskRoute[] = [
  { path: "/dieu-phoi", label: deskStrings.nav.overview },
  { path: "/dieu-phoi/ho-so", label: deskStrings.nav.cases },
  { path: "/dieu-phoi/mo-ho-so", label: deskStrings.nav.openCase },
];
