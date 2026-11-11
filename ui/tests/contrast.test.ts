// @vitest-environment node
// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/tokens.css"), "utf8");

function block(selector: RegExp): Record<string, string> {
  const match = css.match(selector);
  if (!match) throw new Error(`block not found: ${selector}`);
  const out: Record<string, string> = {};
  for (const [, name, value] of match[1].matchAll(/--jh-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[name] = value;
  return out;
}

const luminance = (hex: string) => {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
};
const ratio = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const light = block(/:root\s*\{([\s\S]*?)\n\s*\}/);
const dark = block(/\.dark\s*\{([\s\S]*?)\n\s*\}/);

// [foreground, background, minimum ratio]
const TEXT: [string, string, number][] = [
  ["ink", "surface", 4.5], ["ink", "app", 4.5], ["ink-2", "surface", 4.5], ["ink-2", "surface-2", 4.5],
  ["muted", "surface", 4.5], ["muted", "surface-2", 4.5], ["muted", "app", 4.5], ["placeholder", "surface", 4.5],
  ["brand", "surface", 4.5], ["brand", "brand-soft", 4.5], ["on-brand", "brand", 4.5], ["on-brand", "brand-hover", 4.5],
  ["ok", "ok-soft", 4.5], ["warn", "warn-soft", 4.5], ["danger", "danger-soft", 4.5], ["on-danger", "danger", 4.5],
  ["ok", "surface", 4.5], ["warn", "surface", 4.5], ["danger", "surface", 4.5],
  ["control", "surface", 3], // non-text: input borders (WCAG 1.4.11)
];

describe.each([["light", light], ["dark", dark]] as const)("%s tokens meet WCAG 2.2 AA", (_name, tokens) => {
  it.each(TEXT)("%s on %s ≥ %s", (fg, bg, min) => {
    expect(tokens[fg], `missing --jh-${fg}`).toBeTruthy();
    expect(tokens[bg], `missing --jh-${bg}`).toBeTruthy();
    expect(ratio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(min);
  });
});
