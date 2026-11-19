// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { deskStrings as s } from "./strings";
import { DATA_ROUTES } from "./d";

/** Routes of the shared health spaces, for the coordinator to wire into the app nav. */
export interface DeskChildRoute {
  path: string;
  label: string;
}

/** One space of the health capability (H, P, D) with its sub-pages and a one-line intro. */
export interface DeskSpaceRoute {
  path: string;
  letter: "H" | "P" | "D";
  label: string;
  intro: string;
  children: readonly DeskChildRoute[];
}

/** The main menu, in the order the OLP brief requires: H (work), P (cases), D (operations). */
export const DESK_ROUTES: readonly DeskSpaceRoute[] = [
  {
    path: "/lam-viec",
    letter: "H",
    label: s.nav.work,
    intro: s.spaces.h,
    children: [
      { path: "/lam-viec", label: s.nav.today },
      { path: "/lam-viec/bang-tin", label: s.nav.notices },
      { path: "/lam-viec/danh-ba", label: s.nav.directory },
    ],
  },
  {
    path: "/ho-so",
    letter: "P",
    label: s.nav.profile,
    intro: s.spaces.p,
    children: [
      { path: "/ho-so", label: s.nav.caseList },
      { path: "/ho-so/mo", label: s.nav.openCase },
    ],
  },
  {
    path: "/dieu-hanh",
    letter: "D",
    label: s.nav.operate,
    intro: s.spaces.d,
    children: DATA_ROUTES.map(route => ({ path: route.path, label: route.label })),
  },
];
