// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { Badge, Button, JuncturaMark, PreviewFrame, PublicControls } from "@junctura/health-ui";
import { appName, appNames, catalog } from "../catalog";
import { navigateHash } from "../router";
import { purposeLabel, strings } from "../strings";

/** Mock picture of the consent screen for the hero; clearly labelled, no real data. */
function HeroPicture() {
  const sample = [
    { name: "Bệnh viện Đà Nẵng", capability: "Danh sách dị ứng", state: strings.consents.stateActive },
    { name: "Nhà thuốc", capability: "Xác minh đơn thuốc", state: strings.consents.stateRevoked },
  ];
  return (
    <PreviewFrame label={`Minh hoạ màn hình đồng thuận của ${strings.app.name}`} title={`${strings.app.name} · ${strings.nav.consents}`}>
      <div className="space-y-2">
        {sample.map(row => (
          <div key={row.name} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.name}</p>
              <p className="truncate text-xs text-muted">{row.capability}</p>
            </div>
            <Badge tone={row.state === strings.consents.stateActive ? "ok" : "neutral"}>{row.state}</Badge>
          </div>
        ))}
      </div>
    </PreviewFrame>
  );
}

function SectionHeading({ id, title, lead }: { id: string; title: string; lead?: string }) {
  return (
    <div id={id}>
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {lead && <p className="mt-3 max-w-2xl text-lg text-ink-2">{lead}</p>}
    </div>
  );
}

/** Public landing page of the portal: what Layer 2 is, the shared capability catalog, who takes part, and sign-in. */
export function PublicHome({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="min-h-dvh bg-app text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <JuncturaMark product={strings.app.shortName} size={30} />
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:block"><PublicControls /></div>
            <Button onClick={onSignIn}>{strings.nav.signIn}</Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 lg:grid-cols-[5fr_6fr] lg:py-20">
          <div>
            <Badge tone="ok" className="mb-5">{strings.app.shortName}</Badge>
            <h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">{strings.app.tagline}</h1>
            <p className="mt-6 max-w-xl text-lg text-ink-2">{strings.app.lead}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="lg" onClick={onSignIn}>{strings.nav.signIn}</Button>
            </div>
            {strings.app.note && <p className="mt-5 text-sm text-muted">{strings.app.note}</p>}
          </div>
          <div className="min-w-0"><HeroPicture /></div>
        </section>

        <section aria-labelledby="portal-benefits-h" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <SectionHeading id="portal-benefits-h" title={strings.landing.benefitsTitle} lead={strings.landing.benefitsLead} />
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {strings.landing.benefits.map(item => (
                <li key={item.title} className="rounded-lg border border-line bg-surface p-5 shadow-card">
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-2">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="portal-how-h" className="border-t border-line bg-surface/60">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <SectionHeading id="portal-how-h" title={strings.landing.howTitle} />
            <ol className="mt-10 grid gap-8 sm:grid-cols-3">
              {strings.landing.how.map((step, index) => (
                <li key={step.title}>
                  <span aria-hidden className="text-4xl font-bold leading-none tracking-tight text-brand">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-2">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="portal-catalog-h" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <SectionHeading id="portal-catalog-h" title={strings.landing.catalogTitle} lead={strings.landing.catalogLead} />
            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {catalog.map(entry => (
                <li key={entry.slug} className="rounded-lg border border-line bg-surface p-5 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold">{entry.title}</h3>
                    <Badge tone="brand">{strings.catalog.version} {entry.version}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-ink-2">{entry.description}</p>
                  <dl className="mt-4 space-y-1.5 text-sm">
                    <div><dt className="inline font-medium">{strings.catalog.provider}: </dt><dd className="inline">{appName(entry.provider)}</dd></div>
                    <div><dt className="inline font-medium">{strings.catalog.consumers}: </dt><dd className="inline">{entry.consumers.map(appName).join(", ")}</dd></div>
                    <div><dt className="inline font-medium">{strings.catalog.purposes}: </dt><dd className="inline">{entry.purposes.map(purposeLabel).join(", ")}</dd></div>
                  </dl>
                  <p className="mt-3">
                    <Badge tone={entry.emergencyAccess ? "warn" : "neutral"}>
                      {entry.emergencyAccess ? strings.catalog.emergency : strings.catalog.noEmergency}
                    </Badge>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="portal-facility-h" className="border-t border-line bg-surface/60">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <SectionHeading id="portal-facility-h" title={strings.landing.facilityTitle} lead={strings.landing.facilityLead} />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[...appNames.values()].map(name => (
                <li key={name} className="rounded-lg border border-line bg-surface px-4 py-3 text-sm font-medium shadow-card">{name}</li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="portal-trust-h" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <SectionHeading id="portal-trust-h" title={strings.landing.trustTitle} />
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {strings.landing.trust.map(item => (
                <li key={item.title} className="rounded-lg border border-line bg-surface p-5 shadow-card">
                  <h3 className="text-base font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-2">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="portal-faq-h" className="border-t border-line">
          <div className="mx-auto max-w-3xl px-5 py-16">
            <SectionHeading id="portal-faq-h" title={strings.landing.faqTitle} />
            <div className="mt-8 divide-y divide-line rounded-lg border border-line bg-surface">
              {strings.landing.faq.map(item => (
                <details key={item.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">{item.q}</summary>
                  <p className="mt-2 text-ink-2">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-[#172F3D] text-white dark:bg-surface dark:text-ink">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{strings.landing.ctaTitle}</h2>
              <p className="mt-2 max-w-xl text-slate-300 dark:text-ink-2">{strings.landing.ctaLead}</p>
            </div>
            <Button size="lg" onClick={onSignIn}>{strings.nav.signIn}</Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-6 text-sm text-muted">
          <span>© 2026 Junctura Contributors · Apache-2.0</span>
          <button type="button" onClick={() => navigateHash("/dong-thuan")} className="hover:text-ink hover:underline">{strings.nav.consents}</button>
          <button type="button" onClick={() => navigateHash("/truy-cap")} className="hover:text-ink hover:underline">{strings.nav.access}</button>
        </div>
      </footer>
    </div>
  );
}
