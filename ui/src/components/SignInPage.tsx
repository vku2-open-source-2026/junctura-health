// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { AlertBanner } from "./Alerts";
import { Button } from "./Button";
import { PublicControls } from "./DisplayPrefs";
import { JuncturaMark } from "./JuncturaMark";

export interface SignInPageProps {
  product: string;
  title?: string;
  subtitle?: string;
  signInLabel?: string;
  onSignIn: () => void;
  /** Back to the landing page. */
  onBack?: () => void;
  /** Why the last attempt failed, or that the session ended. */
  message?: string;
  /** Short text under the button, e.g. which unit and which accounts can sign in. */
  note?: ReactNode;
}

/** Sign-in card on the Junctura pattern background, same layout as Junctura Console. Credentials are entered on the Junctura identity page. */
export function SignInPage({ product, title = "Đăng nhập", subtitle, signInLabel = "Đăng nhập với Junctura", onSignIn, onBack, message, note }: SignInPageProps) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-app px-4 py-8 text-ink">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg className="absolute inset-0 size-full text-brand/10">
          <defs>
            <pattern id="jh-signin-pattern" width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
              <circle cx="2" cy="2" r="1.4" fill="currentColor" />
              <path d="M0 28h56M28 0v56" stroke="currentColor" strokeWidth="0.35" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#jh-signin-pattern)" />
        </svg>
        <div className="absolute -left-24 top-1/4 size-72 rounded-full bg-ok/10 blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 size-80 rounded-full bg-sand/10 blur-3xl" />
      </div>
      <main className="relative w-full max-w-md">
        <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-pop">
          <div className="px-6 pb-6 pt-8 text-center sm:px-8">
            <div className="flex justify-center"><JuncturaMark product={product} size={40} /></div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            <div className="mt-6 space-y-4 text-left">
              {message && <AlertBanner level="warning" title={message} />}
              <Button size="lg" className="w-full" onClick={onSignIn} icon={<ShieldCheck aria-hidden className="size-5" />}>{signInLabel}</Button>
              {note && <p className="text-center text-sm text-muted">{note}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface-2/60 px-4 py-3">
            <PublicControls />
            {onBack && (
              <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-muted hover:bg-surface hover:text-brand">
                <ArrowLeft aria-hidden className="size-3.5" />Về trang giới thiệu
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
