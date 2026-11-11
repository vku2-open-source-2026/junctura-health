// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { PublicControls } from "./DisplayPrefs";
import { JuncturaMark } from "./JuncturaMark";

export interface LandingItem { icon?: ReactNode; title: string; text: string }
export interface LandingBlock<T = LandingItem> { title: string; lead?: string; items: T[] }

export interface LandingProps {
  product: string;
  /** Small label above the headline. */
  badge?: string;
  headline: string;
  lead: string;
  note?: string;
  signInLabel?: string;
  onSignIn: () => void;
  /** Visual at the right of the headline: a small, realistic picture of the app (no patient data). */
  hero?: ReactNode;
  benefits?: LandingBlock;
  steps?: LandingBlock<{ title: string; text: string }>;
  audiences?: LandingBlock;
  trust?: LandingBlock;
  faq?: LandingBlock<{ q: string; a: string }>;
  cta?: { title: string; lead?: string };
  footer?: { links?: { label: string; href: string }[]; note?: ReactNode };
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });

function Heading({ title, lead }: { title: string; lead?: string }) {
  return (
    <>
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {lead && <p className="mt-3 max-w-2xl text-lg text-ink-2">{lead}</p>}
    </>
  );
}

function CardGrid({ items }: { items: LandingItem[] }) {
  return (
    <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(item => (
        <li key={item.title} className="rounded-lg border border-line bg-surface p-5 shadow-card">
          {item.icon && <span aria-hidden className="grid size-10 place-items-center rounded-md bg-brand-soft text-brand">{item.icon}</span>}
          <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
          <p className="mt-1.5 text-sm text-ink-2">{item.text}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Public page of an app, same structure as the Junctura Console landing: sticky bar, headline with a picture of the app,
 * benefits, how it works, who it is for, trust, questions, a call to action and a footer. Sections are shown when given. No patient data.
 */
export function LandingPage({ product, badge, headline, lead, note, signInLabel = "Đăng nhập", onSignIn, hero, benefits, steps, audiences, trust, faq, cta, footer }: LandingProps) {
  const nav = [
    benefits && { id: "landing-benefits", label: "Lợi ích" },
    steps && { id: "landing-how", label: "Cách hoạt động" },
    audiences && { id: "landing-audiences", label: "Dành cho ai" },
    trust && { id: "landing-trust", label: "Bảo mật" },
    faq && { id: "landing-faq", label: "Hỏi đáp" },
  ].filter((item): item is { id: string; label: string } => Boolean(item));

  return (
    <div className="min-h-dvh bg-app text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <JuncturaMark product={product} size={30} />
          {nav.length > 0 && (
            <nav aria-label="Các phần của trang" className="ml-2 hidden items-center gap-1 md:flex">
              {nav.map(item => <button key={item.id} type="button" onClick={() => scrollTo(item.id)} className="rounded-md px-3 py-2 text-sm font-medium text-ink-2 hover:bg-surface-2 hover:text-ink">{item.label}</button>)}
            </nav>
          )}
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:block"><PublicControls /></div>
            <Button onClick={onSignIn}>{signInLabel}</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 lg:grid-cols-[5fr_6fr] lg:py-20">
          <div>
            {badge && <Badge tone="ok" className="mb-5" icon={<Sparkles aria-hidden className="size-3.5" />}>{badge}</Badge>}
            <h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">{headline}</h1>
            <p className="mt-6 max-w-xl text-lg text-ink-2">{lead}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" onClick={onSignIn} icon={<ArrowRight aria-hidden className="size-4" />}>{signInLabel}</Button>
              {nav.length > 1 && <Button size="lg" variant="secondary" onClick={() => scrollTo(nav[0].id)}>Tìm hiểu thêm</Button>}
            </div>
            {note && <p className="mt-5 text-sm text-muted">{note}</p>}
          </div>
          {hero && <div className="min-w-0">{hero}</div>}
        </section>

        {benefits && (
          <section id="landing-benefits" aria-labelledby="landing-benefits-h" className="border-t border-line">
            <div className="mx-auto max-w-6xl px-5 py-16">
              <div id="landing-benefits-h"><Heading title={benefits.title} lead={benefits.lead} /></div>
              <CardGrid items={benefits.items} />
            </div>
          </section>
        )}

        {steps && (
          <section id="landing-how" className="border-t border-line bg-surface/60">
            <div className="mx-auto max-w-6xl px-5 py-16">
              <Heading title={steps.title} lead={steps.lead} />
              <ol className="mt-10 grid gap-8 sm:grid-cols-3">
                {steps.items.map((step, index) => (
                  <li key={step.title}>
                    <span aria-hidden className="text-4xl font-bold leading-none tracking-tight text-brand">{String(index + 1).padStart(2, "0")}</span>
                    <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-ink-2">{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {audiences && (
          <section id="landing-audiences" className="border-t border-line">
            <div className="mx-auto max-w-6xl px-5 py-16">
              <Heading title={audiences.title} lead={audiences.lead} />
              <CardGrid items={audiences.items} />
            </div>
          </section>
        )}

        {trust && (
          <section id="landing-trust" className="border-t border-line bg-surface/60">
            <div className="mx-auto max-w-6xl px-5 py-16">
              <Heading title={trust.title} lead={trust.lead} />
              <CardGrid items={trust.items} />
            </div>
          </section>
        )}

        {faq && (
          <section id="landing-faq" className="border-t border-line">
            <div className="mx-auto max-w-3xl px-5 py-16">
              <Heading title={faq.title} lead={faq.lead} />
              <div className="mt-8 divide-y divide-line rounded-lg border border-line bg-surface">
                {faq.items.map(item => (
                  <details key={item.q} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                      {item.q}
                      <ChevronDown aria-hidden className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-2 text-ink-2">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {cta && (
          <section className="border-t border-line bg-[#172F3D] text-white dark:bg-surface dark:text-ink">
            <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{cta.title}</h2>
                {cta.lead && <p className="mt-2 max-w-xl text-slate-300 dark:text-ink-2">{cta.lead}</p>}
              </div>
              <Button size="lg" onClick={onSignIn}>{signInLabel}</Button>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-6 text-sm text-muted">
          <span>© 2026 Junctura Contributors · Apache-2.0</span>
          {footer?.links && (
            <nav aria-label="Liên kết" className="flex flex-wrap gap-x-5 gap-y-1">
              {footer.links.map(link => <a key={link.href} href={link.href} className="hover:text-ink hover:underline" rel="noreferrer">{link.label}</a>)}
            </nav>
          )}
          {footer?.note && <span>{footer.note}</span>}
        </div>
      </footer>
    </div>
  );
}
