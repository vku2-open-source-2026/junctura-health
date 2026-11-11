// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Library build: ESM plus one compiled stylesheet. React, the icon set and the fonts stay
// external (declared as peer or regular dependencies), so nothing third-party is bundled in.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    lib: { entry: "src/index.ts", formats: ["es"], fileName: "index", cssFileName: "styles" },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", /^lucide-react(\/.*)?$/],
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
