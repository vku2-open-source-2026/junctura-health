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
export { DESK_ROUTES, type DeskSpaceRoute } from "./routes";
export { deskPageFor, isDeskRoute, DeskRedirect, DeskNotFound } from "./pages";
export { deskStrings, facilityLabel, statusLabel, urgencyLabel } from "./strings";
export { TodayPage } from "./today";
export { NoticesPage } from "./notices";
export { DirectoryPage } from "./directory";
export { ExecutionsPage } from "./executions";
export { OpenCasePage } from "./open";
export { CaseDetailPage } from "./detail";
