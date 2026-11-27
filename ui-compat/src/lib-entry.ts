// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Build entry only: pulls the RC stylesheet and the Health-specific stylesheet into
// the library build so dist/styles.css is emitted. Source consumers (tests) import
// ./index and load styles themselves.
import "@junctura/ui/styles.css";
import "@junctura/health-ui/styles.css";
export * from "./index";
