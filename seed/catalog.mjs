// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Compatibility re-export: the real vocabulary lives in seed/catalog/index.mjs.
// Kept for junctura-hospital/server/* which import this path at runtime;
// remove only in H.8 (after B.1).

export * from "./catalog/index.mjs";
