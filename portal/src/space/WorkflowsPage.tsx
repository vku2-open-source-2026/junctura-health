// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { WORKFLOWS } from "./data";
import { SpacePage } from "./layout";
import { groupLabel, spaceStrings as s, stepLabel } from "./strings";

/** The shared BPMN workflows as numbered step lists with the acting groups of each step. */
export function WorkflowsPage() {
  return (
    <SpacePage title={s.workflows.title} lead={s.workflows.lead} current="/quy-trinh">
      <ul className="space-y-5">
        {WORKFLOWS.map(workflow => (
          <li key={workflow.id} className="rounded-lg border border-line bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{workflow.name}</h2>
              <p className="text-sm text-muted">{workflow.steps.length} {s.workflows.stepCount}</p>
            </div>
            <ol className="mt-4 space-y-3">
              {workflow.steps.map((step, index) => (
                <li key={step.id} className="flex items-start gap-3">
                  <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{stepLabel(step)}</p>
                    {step.groups.length > 0 && (
                      <p className="mt-0.5 text-xs text-muted">
                        {s.workflows.groups}: {step.groups.map(groupLabel).join(", ")}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
    </SpacePage>
  );
}
