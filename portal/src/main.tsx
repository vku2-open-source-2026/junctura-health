// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DisplayPrefsProvider } from "@junctura/health-ui";
import { PortalApp } from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DisplayPrefsProvider>
      <PortalApp />
    </DisplayPrefsProvider>
  </StrictMode>,
);
