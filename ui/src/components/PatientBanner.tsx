// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import type { ReactNode } from "react";
import { ageFromBirthYear, formatDate, sexLabel } from "../lib/format";
import { AllergyStatus, type AllergyState } from "./Alerts";
import { IdChip } from "./IdChip";

export interface PatientBannerProps {
  name: string;
  recordId: string;
  birthYear?: number | null;
  birthDate?: string | null;
  sex?: string | null;
  allergy: { state: AllergyState; items?: string[]; reason?: string };
  extra?: ReactNode;
  actions?: ReactNode;
}

/** Always visible above patient content: who this is, and the allergy state. */
export function PatientBanner({ name, recordId, birthYear, birthDate, sex, allergy, extra, actions }: PatientBannerProps) {
  const age = typeof birthYear === "number" ? ageFromBirthYear(birthYear) : null;
  return (
    <section aria-label="Thông tin người bệnh" className="sticky top-[var(--jh-topbar,0px)] z-20 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-surface px-5 py-3 shadow-card">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-ink">{name}</h1>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
          <IdChip value={recordId} label="mã hồ sơ" />
          {birthDate ? <span>Sinh {formatDate(birthDate)}</span> : birthYear ? <span>Sinh {birthYear}</span> : null}
          {age !== null && <span>{age} tuổi</span>}
          {sex && <span>{sexLabel(sex)}</span>}
          {extra}
        </p>
      </div>
      <div className="min-w-48"><AllergyStatus {...allergy} /></div>
      {actions && <div className="ml-auto flex gap-2">{actions}</div>}
    </section>
  );
}
