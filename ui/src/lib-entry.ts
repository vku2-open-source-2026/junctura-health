// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Build entry only: pulls the stylesheet into the library build so dist/styles.css is emitted.
// Source consumers (tests, preview) import ./index and load styles themselves.
import "./styles.css";
export * from "./index";
