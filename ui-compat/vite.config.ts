// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Library build of the Health UI entry point: ESM plus one compiled stylesheet that
// concatenates the RC styles with the Health-specific ones. React and both UI packages
// stay external; nothing from the RC tarball is bundled in.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: "src/lib-entry.ts", formats: ["es"], fileName: "index", cssFileName: "styles" },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "@junctura/ui", /^@junctura\/ui(\/.*)?$/, "@junctura/health-ui", /^@junctura\/health-ui(\/.*)?$/],
    },
    cssCodeSplit: false,
    sourcemap: true,
    emptyOutDir: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: false,
  },
});
