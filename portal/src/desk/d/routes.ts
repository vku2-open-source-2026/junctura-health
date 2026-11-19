// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

// Kept apart from the pages so the side menu can import it without an import cycle.

/** One operations page, with its route path, hash link and menu label. */
export interface DataRoute {
  path: string;
  hash: string;
  label: string;
}

/** The operations pages, in menu order. */
export const DATA_ROUTES: readonly DataRoute[] = [
  { path: "/dieu-hanh", hash: "#/dieu-hanh", label: "Tổng quan" },
  { path: "/dieu-hanh/trao-doi", hash: "#/dieu-hanh/trao-doi", label: "Trao đổi dữ liệu" },
  { path: "/dieu-hanh/du-lieu", hash: "#/dieu-hanh/du-lieu", label: "Bản đồ dữ liệu" },
  { path: "/dieu-hanh/chia-se", hash: "#/dieu-hanh/chia-se", label: "Chia sẻ dữ liệu" },
];
