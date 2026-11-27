// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

if (typeof HTMLDialogElement !== "undefined") {
// jsdom has no <dialog> modal support.
HTMLDialogElement.prototype.showModal ||= function (this: HTMLDialogElement) { this.setAttribute("open", ""); };
HTMLDialogElement.prototype.close ||= function (this: HTMLDialogElement) { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
}

// axe probes canvas for icon-ligature checks; jsdom has none and logs noise.
if (typeof HTMLCanvasElement !== "undefined") HTMLCanvasElement.prototype.getContext = (() => null) as never;
