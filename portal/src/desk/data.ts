// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { WORKFLOWS, type Workflow } from "../space/data";
import type { Facility } from "./context";

/** The three shared medical workflow keys the desk shows; other definitions stay hidden. */
export const MEDICAL_KEYS: readonly string[] = [
  "junctura_chuyen_tuyen",
  "junctura_xac_minh_don_thuoc",
  "junctura_xac_minh_chi_phi",
];

export const isMedicalKey = (key: string): boolean => MEDICAL_KEYS.includes(key);

/** The parsed BPMN steps of a medical workflow key, or undefined for other keys. */
export const workflowFor = (key: string): Workflow | undefined => WORKFLOWS.find(workflow => workflow.id === key);

// ---------------------------------------------------------------- urgency of the digital form

/** Urgency levels of the digital form; Vietnamese labels live in strings.ts. */
export type Urgency = "thuong" | "khan" | "cap-cuu";

export const URGENCIES: readonly Urgency[] = ["thuong", "khan", "cap-cuu"];

export const urgencyOf = (value: unknown): Urgency | null =>
  URGENCIES.includes(value as Urgency) ? value as Urgency : null;

/** The urgency recorded in a list item's input, when the engine returns the input at all. */
export const inputUrgency = (item: { input?: { mucKhan?: unknown } }): Urgency | null => urgencyOf(item.input?.mucKhan);

/** Which facility opens which shared workflow; the others open nothing. */
export const OPENERS: Readonly<Record<string, Facility>> = {
  junctura_chuyen_tuyen: "tram-y-te",
  junctura_xac_minh_don_thuoc: "nha-thuoc",
  junctura_xac_minh_chi_phi: "bao-hiem",
};

/** Short reference-code prefixes per workflow key, for the generated codes. */
export const PREFIXES: Readonly<Record<string, string>> = {
  junctura_chuyen_tuyen: "CT-",
  junctura_xac_minh_don_thuoc: "DT-",
  junctura_xac_minh_chi_phi: "CP-",
};

/** The workflow keys the facility may open. */
export const openableKeysFor = (facility: Facility): readonly string[] =>
  Object.keys(OPENERS).filter(key => OPENERS[key] === facility);

/** The facilities that take part in a workflow, from its BPMN candidate groups, in step order. */
export const participatingFacilities = (key: string): readonly string[] => {
  const workflow = workflowFor(key);
  if (!workflow) return [];
  const seen = new Set<string>();
  for (const step of workflow.steps) for (const group of step.groups) seen.add(group);
  return [...seen];
};

// ---------------------------------------------------------------- shapes from Core

/** The step a running execution waits at: name, optional assignee and candidate groups. */
export interface CurrentStep {
  name: string;
  assignee?: string | null;
  groups?: readonly string[];
}

/** One execution in the workflow history list (newest first, at most 100 per page). */
export interface ExecutionItem {
  id: string;
  definition: { id: string; key: string; name: string; version: number };
  status: "running" | "completed" | "cancelled";
  startedAt?: string | null;
  updatedAt?: string | null;
  title?: string | null;
  currentStep?: CurrentStep | null;
  /** The engine history list does not return the input; `mucKhan` is read when it ever does. */
  input?: { mucKhan?: unknown } & Record<string, unknown>;
}

export interface ExecutionList {
  items: readonly ExecutionItem[];
  limit?: number;
}

/** One definition line of the workflow summary, with per-status counts. */
export interface SummaryDefinition {
  key: string;
  name: string;
  application: { id: string; name: string } | null;
  steps: readonly { name: string; owner: string | null }[];
  counts: { running: number; completed: number; cancelled: number };
  updatedAt?: string | null;
}

export interface WorkflowSummary {
  definitions: readonly SummaryDefinition[];
  totals: { definitions: number; running: number; completed: number; cancelled: number };
}

/** A deployed definition version as listed by the engine. */
export interface DefinitionItem {
  id: string;
  key: string;
  version: number;
  name: string;
}

/** The durable engine record of one execution; `input` is what the opener sent. */
export interface ExecutionDetail {
  id: string;
  definitionId: string;
  status: "running" | "completed" | "cancelled";
  input?: {
    reference?: unknown;
    openedBy?: unknown;
    mucKhan?: unknown;
    coSoNhan?: unknown;
    ghiChu?: unknown;
  } & Record<string, unknown>;
}

// ---------------------------------------------------------------- shapes of the health gateway

/** An author of a notice, note or uploaded file, as the gateway reports it. */
export interface Author {
  displayName: string;
  facility: Facility;
}

/** One notice of the bulletin board, newest first in the list response. */
export interface Notice {
  id: string;
  title: string;
  body: string;
  author: Author;
  createdAt: string;
}

export interface NoticeList {
  items: readonly Notice[];
}

/** One exchange note of a case, oldest first in the list response. */
export interface CaseNote {
  id: string;
  executionId: string;
  text: string;
  author: Author;
  createdAt: string;
}

export interface NoteList {
  items: readonly CaseNote[];
}

/** Metadata of one attachment of a case, oldest first in the list response. */
export interface FileMeta {
  id: string;
  executionId: string;
  name: string;
  type: string;
  bytes: number;
  author: Author;
  createdAt: string;
}

export interface FileList {
  items: readonly FileMeta[];
}

// ---------------------------------------------------------------- helpers

/** True when a running execution waits at a step that names `facility` as candidate group. */
export const waitsForFacility = (item: ExecutionItem, facility: string): boolean =>
  item.status === "running" && item.currentStep?.groups?.includes(facility) === true;

/** Reference codes are short uppercase machine-sortable identifiers, e.g. CT-123456. */
export const REFERENCE_PATTERN = /^[A-Z][A-Z0-9-]{0,31}$/;

/**
 * Builds a fresh reference code from a prefix (e.g. `CT-`) plus six random alphanumerics,
 * so two runs almost never collide and the value always matches {@link REFERENCE_PATTERN}.
 */
export const generateReference = (prefix: string): string => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint32Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return prefix + code;
};

/** The latest deployed definition per workflow key: the highest version wins, whatever the list order. */
export const latestDefinitionBy = (items: readonly DefinitionItem[]): Readonly<Record<string, DefinitionItem>> => {
  const byKey: Record<string, DefinitionItem> = {};
  for (const item of items) {
    const known = byKey[item.key];
    if (!known || Number(item.version) > Number(known.version)) byKey[item.key] = item;
  }
  return byKey;
};
