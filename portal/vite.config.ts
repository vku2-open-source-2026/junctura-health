// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const JUNCTURA_URL = process.env.JUNCTURA_URL ?? "http://127.0.0.1:8080";

// The UI library sources live outside this package and pull React through
// ../ui/node_modules. To guarantee exactly one React (tests and bundle), pin every
// react/react-dom import to this package's own copies.
const ownModule = (name: string): string => fileURLToPath(new URL(`./node_modules/${name}`, import.meta.url));

// The shared UI library and the pure data modules (contracts, demo plan) of this
// repository are used straight from source, so there is nothing to copy or bundle twice.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^react$/, replacement: `${ownModule("react")}/index.js` },
      { find: /^react\/(.*)$/, replacement: `${ownModule("react")}/$1` },
      { find: /^react-dom$/, replacement: `${ownModule("react-dom")}/index.js` },
      { find: /^react-dom\/(.*)$/, replacement: `${ownModule("react-dom")}/$1` },
      { find: /^lucide-react$/, replacement: ownModule("lucide-react") },
      { find: /^@fontsource-variable\/(.*)$/, replacement: `${ownModule("@fontsource-variable")}/$1` },
      { find: "@junctura/health-ui", replacement: fileURLToPath(new URL("../ui/src/index.ts", import.meta.url)) },
      { find: "@junctura/health-contracts", replacement: fileURLToPath(new URL("../contracts/index.mjs", import.meta.url)) },
      { find: "@junctura/health-demo/plan", replacement: fileURLToPath(new URL("../demo/plan.mjs", import.meta.url)) },
    ],
    // Resolution fallback for bare imports from the transformed library tree: force
    // react/react-dom to this package's root node_modules (single copy, see alias above).
    dedupe: ["react", "react-dom", "lucide-react"],
  },
  server: {
    port: 5180,
    proxy: {
      "/v1": JUNCTURA_URL,
      "/identity": JUNCTURA_URL,
    },
  },
  build: { sourcemap: true },
  test: {
    environment: "jsdom",
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: false,
    // Run every dependency through Vite in tests (nothing native), so the React
    // aliases/dedupe above hold everywhere and exactly one React copy is loaded.
    server: { deps: { inline: true } },
  },
});
