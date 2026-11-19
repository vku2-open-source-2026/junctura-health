// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { Badge, JuncturaMark, PublicControls } from "@junctura/health-ui";
import { appName, appNames, catalog } from "../catalog";
import { purposeLabel, strings } from "../strings";
import { SPACE_ROUTES } from "../space";

function SectionHeading({ id, title, lead }: { id: string; title: string; lead?: string }) {
  return (
    <div id={id}>
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {lead && <p className="mt-3 max-w-2xl text-lg text-ink-2">{lead}</p>}
    </div>
  );
}

/** Public landing page of the portal: what Layer 2 is, the shared capability catalog and who takes part. */
export function PublicHome() {
  return (
    <div className="min-h-dvh bg-app text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
          <JuncturaMark product={strings.app.shortName} size={30} />
          <nav aria-label={strings.app.shortName} className="order-last flex w-full gap-1 sm:order-none sm:ml-auto sm:w-auto">
            {SPACE_ROUTES.map(route => (
              <a key={route.path} href={`#${route.path}`} className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-2 hover:text-ink">{route.label}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <PublicControls />
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
          <Badge tone="ok" className="mb-5">{strings.app.shortName}</Badge>
          <h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">{strings.app.tagline}</h1>
          <p className="mt-6 max-w-xl text-lg text-ink-2">{strings.app.lead}</p>
          {strings.app.note && <p className="mt-5 text-sm text-muted">{strings.app.note}</p>}
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
                    <h3 className="text-lg font-semibold"><a href={`#/hop-dong/${entry.slug}`} className="hover:underline">{entry.title}</a></h3>
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

        <section aria-labelledby="portal-subject-h" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <SectionHeading id="portal-subject-h" title={strings.landing.subjectTitle} lead={strings.landing.subjectLead} />
            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {strings.landing.subject.map(item => (
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
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-6 text-sm text-muted">
          <span>© 2026 Junctura Contributors · Apache-2.0</span>
          <span>{strings.app.name} · trang công khai, chỉ đọc</span>
        </div>
      </footer>
    </div>
  );
}
