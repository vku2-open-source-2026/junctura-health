// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { deskStrings as s } from "./strings";
import { DATA_ROUTES } from "./d/routes";

/** One page of the signed-in workspace. */
export interface DeskChildRoute {
  path: string;
  label: string;
}

/** A group of the side menu with its pages. */
export interface DeskSpaceRoute {
  path: string;
  label: string;
  children: readonly DeskChildRoute[];
}

/** The side menu: daily work, cross-facility cases, then operations figures. */
export const DESK_ROUTES: readonly DeskSpaceRoute[] = [
  {
    path: "/lam-viec",
    label: s.nav.work,
    children: [
      { path: "/lam-viec", label: s.nav.today },
      { path: "/lam-viec/bang-tin", label: s.nav.notices },
      { path: "/lam-viec/danh-ba", label: s.nav.directory },
    ],
  },
  {
    path: "/ho-so",
    label: s.nav.profile,
    children: [
      { path: "/ho-so", label: s.nav.caseList },
      { path: "/ho-so/mo", label: s.nav.openCase },
    ],
  },
  {
    path: "/dieu-hanh",
    label: s.nav.operate,
    children: DATA_ROUTES.map(route => ({ path: route.path, label: route.label })),
  },
];
