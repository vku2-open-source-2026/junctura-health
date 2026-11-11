// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// The fonts stay regular dependencies (SIL OFL fonts from Fontsource): apps import
// `@junctura/health-ui/fonts.css`, which resolves them from their own node_modules.
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });
copyFileSync("src/fonts.css", "dist/fonts.css");
copyFileSync("src/tokens.css", "dist/tokens.css");
console.log("dist/fonts.css, dist/tokens.css written");
