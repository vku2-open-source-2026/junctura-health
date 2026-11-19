// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { useEffect } from "react";
import { PublicHome } from "./pages/PublicHome";
import { useHashRoute } from "./router";
import { ContractDetailPage, ContractsPage, FacilitiesPage, WorkflowsPage } from "./space";

const CONTRACT_DETAIL = /^\/hop-dong\/([a-z][a-z0-9-]{0,62})$/;

/** The page for a hash route; unknown routes show the home page. */
export function pageFor(route: string) {
  const detail = CONTRACT_DETAIL.exec(route);
  if (detail) return <ContractDetailPage slug={detail[1]} />;
  if (route === "/hop-dong") return <ContractsPage />;
  if (route === "/quy-trinh") return <WorkflowsPage />;
  if (route === "/co-so") return <FacilitiesPage />;
  return <PublicHome />;
}

/**
 * Root of Cổng Junctura Health, the public read-only site of Layer 2: the shared capability
 * contracts, business workflows and participating facilities, built from this repository.
 * Patients sign in and manage consents in the MyHealth app of Layer 3, not here.
 */
export function PortalApp() {
  const [route] = useHashRoute();
  useEffect(() => { window.scrollTo?.(0, 0); }, [route]);
  return pageFor(route);
}
