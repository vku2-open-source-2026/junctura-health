// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Gallery of every component (not published): `npm --prefix ui run preview`.
export default defineConfig({
  root: "preview",
  plugins: [react(), tailwindcss()],
  server: { host: "127.0.0.1", port: 5190, strictPort: true },
  build: { outDir: "../preview-dist", emptyOutDir: true },
});
