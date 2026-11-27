// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// The composition the compatibility check is about: the AppShell of the shared
// @junctura/ui RC carrying the Health-specific PatientBanner, so both packages
// render in one tree (same React, tokens and stylesheets together).
import { AppShell, type AppShellProps, type NavItem } from "@junctura/ui";
import { PatientBanner, type PatientBannerProps } from "@junctura/health-ui";
import type { ReactNode } from "react";

export interface HealthFrameProps {
  product: string;
  nav: NavItem[];
  current: string;
  onNavigate: (id: string) => void;
  /** Patient context shown above every screen of the health apps. */
  patient?: PatientBannerProps;
  user?: AppShellProps["user"];
  children: ReactNode;
}

/** The Health workspace frame: shared RC shell, health-specific patient banner. */
export function HealthFrame({ product, nav, current, onNavigate, patient, user, children }: HealthFrameProps) {
  return (
    <AppShell product={product} nav={nav} current={current} onNavigate={onNavigate} user={user}>
      {patient && <PatientBanner {...patient} />}
      <main>{children}</main>
    </AppShell>
  );
}
