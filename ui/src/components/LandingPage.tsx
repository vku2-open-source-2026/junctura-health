// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { TextSizeSelector, ThemeToggle } from "./DisplayPrefs";
import { JuncturaMark } from "./JuncturaMark";

export interface LandingProps {
  product: string;
  headline: string;
  lead: string;
  values: { icon?: ReactNode; title: string; text: string }[];
  signInLabel?: string;
  onSignIn: () => void;
  note?: string;
  footer?: ReactNode;
}

/** Public page: what the app is for, who it serves, and one clear sign-in action. No patient data. */
export function LandingPage({ product, headline, lead, values, signInLabel = "Đăng nhập với Junctura", onSignIn, note, footer }: LandingProps) {
  return (
    <div className="min-h-dvh bg-app text-ink">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-5 py-4">
        <JuncturaMark product={product} />
        <div className="ml-auto flex gap-3"><TextSizeSelector /><ThemeToggle /></div>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-8">
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight">{headline}</h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-2">{lead}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={onSignIn} icon={<ShieldCheck aria-hidden className="size-5" />}>{signInLabel}</Button>
          {note && <p className="text-sm text-muted">{note}</p>}
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-3">
          {values.map(value => (
            <li key={value.title} className="rounded-xl border border-line bg-surface p-5 shadow-card">
              {value.icon && <span aria-hidden className="mb-3 grid size-10 place-items-center rounded-lg bg-brand-soft text-brand">{value.icon}</span>}
              <h2 className="font-semibold">{value.title}</h2>
              <p className="mt-1 text-sm text-ink-2">{value.text}</p>
            </li>
          ))}
        </ul>
      </main>
      {footer && <footer className="mx-auto max-w-5xl border-t border-line px-5 py-6 text-sm text-muted">{footer}</footer>}
    </div>
  );
}
