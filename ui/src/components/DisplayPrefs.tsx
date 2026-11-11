// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { Moon, Sun } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

export type TextSize = "sm" | "md" | "lg";
export type Theme = "light" | "dark";
interface Prefs { textSize: TextSize; theme: Theme; setTextSize: (size: TextSize) => void; setTheme: (theme: Theme) => void }

const KEY = "junctura.display";
const Context = createContext<Prefs>({ textSize: "md", theme: "light", setTextSize: () => {}, setTheme: () => {} });
export const useDisplayPrefs = () => useContext(Context);

function load(): { textSize: TextSize; theme: Theme } {
  const fallback = { textSize: "md" as TextSize, theme: "light" as Theme };
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<typeof fallback>;
    const dark = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
    return {
      textSize: stored.textSize === "sm" || stored.textSize === "lg" ? stored.textSize : "md",
      theme: stored.theme === "dark" || stored.theme === "light" ? stored.theme : dark ? "dark" : "light",
    };
  } catch { return fallback; }
}

/** Keeps text size and theme on <html> and remembers them per browser (storage failures are ignored). */
export function DisplayPrefsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(load);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = state.textSize;
    root.classList.toggle("dark", state.theme === "dark");
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  }, [state]);
  const setTextSize = useCallback((textSize: TextSize) => setState(current => ({ ...current, textSize })), []);
  const setTheme = useCallback((theme: Theme) => setState(current => ({ ...current, theme })), []);
  const value = useMemo(() => ({ ...state, setTextSize, setTheme }), [state, setTextSize, setTheme]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

const SIZES: { id: TextSize; label: string; aria: string; cls: string }[] = [
  { id: "sm", label: "A", aria: "Chữ nhỏ", cls: "text-xs" },
  { id: "md", label: "A", aria: "Chữ vừa", cls: "text-sm" },
  { id: "lg", label: "A", aria: "Chữ lớn", cls: "text-lg" },
];

export function TextSizeSelector() {
  const { textSize, setTextSize } = useDisplayPrefs();
  return (
    <div role="group" aria-label="Cỡ chữ" className="inline-flex overflow-hidden rounded-lg border border-control">
      {SIZES.map(size => (
        <button key={size.id} type="button" aria-label={size.aria} aria-pressed={textSize === size.id} onClick={() => setTextSize(size.id)}
          className={cn("grid size-9 place-items-center font-semibold", size.cls, textSize === size.id ? "bg-brand text-on-brand" : "bg-surface text-ink hover:bg-surface-2")}>
          {size.label}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useDisplayPrefs();
  const dark = theme === "dark";
  return (
    <button type="button" aria-pressed={dark} aria-label="Giao diện tối" onClick={() => setTheme(dark ? "light" : "dark")}
      className="grid size-9 place-items-center rounded-full border border-line bg-surface text-ink hover:border-brand">
      {dark ? <Moon aria-hidden className="size-4" /> : <Sun aria-hidden className="size-4" />}
    </button>
  );
}

/** Display settings for pages without a shell (landing, sign-in): text size and theme. */
export function PublicControls() {
  return <div className="flex items-center gap-2"><TextSizeSelector /><ThemeToggle /></div>;
}
