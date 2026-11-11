// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../src/fonts.css";
import "./preview.css";
import { Gallery } from "./Gallery";

createRoot(document.getElementById("root")!).render(<StrictMode><Gallery /></StrictMode>);
