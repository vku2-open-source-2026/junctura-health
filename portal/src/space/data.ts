// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Build-time data of the shared capability space: assembled from the pure modules of
 * this repository (capability contracts, demo plan) and the BPMN workflow files, which
 * Vite inlines as strings via `?raw`. No runtime calls to Junctura: everything below is
 * pure and synchronous, so the pages render from the repository snapshot alone.
 */

import type { Schema } from "@junctura/health-contracts";
import { CONTRACTS } from "@junctura/health-contracts";
import { APPS } from "@junctura/health-demo/plan";
import { appName } from "../catalog";
import { purposeLabel } from "../strings";
import chuyenTuyenXml from "@junctura/health-workflows/chuyen-tuyen.bpmn20.xml?raw";
import xacMinhChiPhiXml from "@junctura/health-workflows/xac-minh-chi-phi.bpmn20.xml?raw";
import xacMinhDonThuocXml from "@junctura/health-workflows/xac-minh-don-thuoc.bpmn20.xml?raw";

// ---------------------------------------------------------------- contracts

export interface FieldView {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface ContractView {
  slug: string;
  version: string;
  title: string;
  description: string;
  provider: string;
  providerName: string;
  consumers: readonly string[];
  consumerNames: readonly string[];
  purposes: readonly string[];
  purposeNames: readonly string[];
  emergencyAccess: boolean;
  sideEffects: string;
  timeoutMs: number;
  inputs: readonly FieldView[];
  outputs: readonly FieldView[];
}

const fieldType = (schema: Schema): string => (schema.type === "array" ? `array<${schema.items.type}>` : schema.type);

const fieldsOf = (schema: Schema): FieldView[] =>
  schema.type === "object"
    ? Object.entries(schema.properties).map(([name, field]) => ({
        name,
        type: fieldType(field),
        required: schema.required.includes(name),
        description: field.description,
      }))
    : [];

/** Summary of one capability contract, with friendly names and flat field lists. */
export function contractView(slug: string): ContractView | undefined {
  const contract = CONTRACTS.find(item => item.slug === slug);
  if (!contract) return undefined;
  return {
    slug: contract.slug,
    version: contract.version,
    title: contract.title,
    description: contract.description,
    provider: contract.provider,
    providerName: appName(contract.provider),
    consumers: [...contract.consumers],
    consumerNames: contract.consumers.map(appName),
    purposes: [...contract.purposes],
    purposeNames: contract.purposes.map(purposeLabel),
    emergencyAccess: contract.emergencyAccess,
    sideEffects: contract.sideEffects.description,
    timeoutMs: contract.timeoutMs,
    inputs: fieldsOf(contract.inputSchema),
    outputs: fieldsOf(contract.outputSchema),
  };
}

/** Every contract of the repository, in contract order. */
export const CONTRACT_VIEWS: readonly ContractView[] = CONTRACTS.flatMap(contract => {
  const view = contractView(contract.slug);
  return view ? [view] : [];
});

// ---------------------------------------------------------------- facilities

export interface CapabilityRef {
  slug: string;
  title: string;
}

export interface FacilityView {
  appId: string;
  key: string;
  name: string;
  provides: readonly CapabilityRef[];
  uses: readonly CapabilityRef[];
}

/** Every demo facility with the capabilities it provides and the ones it calls as a consumer. */
export const facilityView = (): readonly FacilityView[] =>
  APPS.map(app => ({
    appId: app.name,
    key: app.key,
    name: app.displayName,
    provides: CONTRACT_VIEWS.filter(view => view.provider === app.name).map(({ slug, title }) => ({ slug, title })),
    uses: CONTRACT_VIEWS.filter(view => view.consumers.includes(app.name)).map(({ slug, title }) => ({ slug, title })),
  }));

// ---------------------------------------------------------------- workflows

const BPMN = "http://www.omg.org/spec/BPMN/20100524/MODEL";
const FLOWABLE = "http://flowable.org/bpmn";

export type WorkflowStepKind = "startEvent" | "userTask" | "exclusiveGateway" | "endEvent";

export interface WorkflowStep {
  id: string;
  kind: WorkflowStepKind;
  name: string;
  groups: readonly string[];
}

export interface Workflow {
  id: string;
  name: string;
  steps: readonly WorkflowStep[];
}

const STEP_KINDS: readonly WorkflowStepKind[] = ["startEvent", "userTask", "exclusiveGateway", "endEvent"];

/**
 * Walks a single-process BPMN 2.0 definition (the only shape the Layer 1 policy accepts)
 * following `sequenceFlow` edges from the start event, and returns the ordered steps with
 * their Flowable candidate groups. Unknown element kinds on the path are skipped.
 */
export function parseWorkflow(xml: string): Workflow {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  const process = document.getElementsByTagNameNS(BPMN, "process")[0];
  if (!process) return { id: "", name: "", steps: [] };

  const byId = new Map<string, Element>();
  for (const kind of STEP_KINDS) {
    for (const element of Array.from(process.getElementsByTagNameNS(BPMN, kind))) {
      byId.set(element.getAttribute("id") ?? "", element);
    }
  }
  const nextOf = new Map<string, string>();
  for (const flow of Array.from(process.getElementsByTagNameNS(BPMN, "sequenceFlow"))) {
    const source = flow.getAttribute("sourceRef") ?? "";
    const target = flow.getAttribute("targetRef") ?? "";
    if (!nextOf.has(source)) nextOf.set(source, target);
  }

  const steps: WorkflowStep[] = [];
  const visited = new Set<string>();
  let cursor = process.getElementsByTagNameNS(BPMN, "startEvent")[0]?.getAttribute("id") ?? "";
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    const element = byId.get(cursor);
    if (element) {
      const groups = (element.getAttributeNS(FLOWABLE, "candidateGroups") ?? "").split(/[\s,]+/).filter(Boolean);
      steps.push({ id: cursor, kind: element.localName as WorkflowStepKind, name: element.getAttribute("name") ?? "", groups });
    }
    cursor = nextOf.get(cursor) ?? "";
  }
  return { id: process.getAttribute("id") ?? "", name: process.getAttribute("name") ?? "", steps };
}

/** The three shared workflows of the repository, parsed from the inlined BPMN files. */
export const WORKFLOWS: readonly Workflow[] = [chuyenTuyenXml, xacMinhDonThuocXml, xacMinhChiPhiXml].map(parseWorkflow);
