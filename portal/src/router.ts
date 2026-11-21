// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useEffect, useState } from "react";

/** Minimal hash router: the public portal renders the home page for every hash route. */

export const readHash = (): string => {
  const raw = window.location.hash.replace(/^#/, "");
  return raw.startsWith("/") ? raw : "/";
};

export const navigateHash = (to: string): void => {
  window.location.hash = `#${to}`;
};

/** Subscribes to hash changes and returns the current route. */
export function useHashRoute(): [string, (to: string) => void] {
  const [route, setRoute] = useState(readHash);
  useEffect(() => {
    const onChange = () => setRoute(readHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const navigate = useCallback((to: string) => navigateHash(to), []);
  return [route, navigate];
}
