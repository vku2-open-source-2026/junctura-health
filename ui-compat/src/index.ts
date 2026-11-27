// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Health UI entry point over the pinned @junctura/ui release candidate.
//
// The 21 shared components, tokens, styles, fonts and the small helpers move to the
// industry-neutral @junctura/ui of Junctura Workspace; the Health-specific components
// (patient banner, allergy and consent badges, emergency access, queue, AI panel) stay
// in @junctura/health-ui. This entry point is what @junctura/health-ui becomes once
// the RC ships: it re-exports the RC wholesale and adds only the Health-specific
// surface, and scripts/check-ui-compat.mjs builds and smoke-tests it against the RC
// tarball. It is not wired into the ordinary ui/ or portal/ builds while the RC is
// unpublished.
export * from "@junctura/ui";
export {
  AI_LABEL,
  AiSummaryPanel,
  type AiSummaryPanelProps,
  ActionList,
  type ActionItem,
  AlertBanner,
  alertLevelLabel,
  AllergyStatus,
  ConsentBadge,
  EmergencyBar,
  EmergencyDialog,
  minutesWaiting,
  PatientBanner,
  type PatientBannerProps,
  QueueList,
  type QueueItem,
  type QueueListProps,
  type QueuePriority,
  SourceBadge,
  StaleNotice,
  type AlertLevel,
  type AllergyState,
  type ConsentState,
} from "@junctura/health-ui";
export { HealthFrame, type HealthFrameProps } from "./health-frame";
