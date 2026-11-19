// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { facilityView } from "./data";
import { SpacePage } from "./layout";
import { spaceStrings as s } from "./strings";

const CapabilityList = ({ items }: { items: readonly { slug: string; title: string }[] }) => (
  <ul className="mt-2 space-y-1 text-sm">
    {items.length === 0
      ? <li className="text-muted">{s.facilities.none}</li>
      : items.map(item => (
          <li key={item.slug}>
            <a href={`#/hop-dong/${item.slug}`} className="text-brand underline-offset-2 hover:underline">{item.title}</a>
          </li>
        ))}
  </ul>
);

/** One card per facility: the capabilities it provides and the ones it calls as a consumer. */
export function FacilitiesPage() {
  return (
    <SpacePage title={s.facilities.title} lead={s.facilities.lead} current="/co-so">
      <ul className="grid gap-5 lg:grid-cols-2">
        {facilityView().map(facility => (
          <li key={facility.appId} className="rounded-lg border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold">{facility.name}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted">{s.facilities.provides}</h3>
                <CapabilityList items={facility.provides} />
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-wide text-muted">{s.facilities.uses}</h3>
                <CapabilityList items={facility.uses} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </SpacePage>
  );
}
