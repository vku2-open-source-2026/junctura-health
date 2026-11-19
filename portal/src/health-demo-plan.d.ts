// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

// Types for the pure demo plan module (aliased to ../demo/plan.mjs at build time).
declare module "@junctura/health-demo/plan" {
  export interface PlanApp {
    name: string;
    key: string;
    displayName: string;
    webPort: number;
    clientId: string;
    webClientId: string;
    providerHost: string;
    origin: string;
  }
  export const APPS: readonly PlanApp[];
}
