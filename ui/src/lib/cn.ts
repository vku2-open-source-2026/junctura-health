// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
export type ClassValue = string | false | null | undefined;

/** Joins class names, skipping falsy values. */
export const cn = (...parts: ClassValue[]): string => parts.filter(Boolean).join(" ");
