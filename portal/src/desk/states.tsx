// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { EmptyState, ErrorState, Skeleton } from "@junctura/health-ui";
import { deskStrings as s } from "./strings";
import { isDeskApiError } from "./context";

/** Renders the API failure in plain Vietnamese: 403, 404, network and everything else. */
export function DeskError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  if (isDeskApiError(error) && error.status === 403) {
    return <ErrorState title={s.errors.forbiddenTitle} onRetry={onRetry}>{s.errors.forbidden}</ErrorState>;
  }
  if (isDeskApiError(error) && error.status === 404) {
    return <ErrorState title={s.errors.notFoundTitle} onRetry={onRetry}>{s.errors.notFound}</ErrorState>;
  }
  if (isDeskApiError(error)) {
    return <ErrorState onRetry={onRetry}>{s.errors.generic}</ErrorState>;
  }
  return <ErrorState title={s.errors.networkTitle} onRetry={onRetry}>{s.errors.network}</ErrorState>;
}

/** Full-page loading placeholder for the desk pages. */
export function DeskLoading({ lines = 4 }: { lines?: number }) {
  return <Skeleton lines={lines} />;
}

/** Full-page empty placeholder with an optional action button. */
export function DeskEmpty({ title, action }: { title: string; action?: React.ReactNode }) {
  return <EmptyState title={title} action={action} />;
}
