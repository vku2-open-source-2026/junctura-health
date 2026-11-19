// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

export {
  isDeskApiError,
  DeskProvider,
  useDesk,
  type DeskApi,
  type DeskApiError,
  type DeskStaff,
  type Facility,
} from "./context";
export { DESK_ROUTES } from "./routes";
export { deskPageFor } from "./pages";
export { deskStrings, facilityLabel, statusLabel } from "./strings";
export { OverviewPage } from "./overview";
export { ExecutionsPage } from "./executions";
export { OpenCasePage } from "./open";
export { CaseDetailPage } from "./detail";
