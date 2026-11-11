// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

interface FieldFrameProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
}

const CONTROL = "w-full rounded-lg border bg-surface px-3 py-2 text-base text-ink placeholder:text-placeholder focus-visible:outline-2 disabled:opacity-60";

function Frame({ id, label, hint, error, required, children }: FieldFrameProps & { id: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required && <span aria-hidden className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-sm text-muted">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

const describedBy = (id: string, hint?: string, error?: string) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export type TextFieldProps = FieldFrameProps & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

/** Labelled text input; the error is announced and tied to the control. */
export function TextField({ label, hint, error, required, className, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <Frame id={id} label={label} hint={hint} error={error} required={required}>
      <input id={id} required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)}
        className={cn(CONTROL, error ? "border-danger" : "border-control", className)} {...rest} />
    </Frame>
  );
}

export type TextAreaFieldProps = FieldFrameProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export function TextAreaField({ label, hint, error, required, className, rows = 4, ...rest }: TextAreaFieldProps) {
  const id = useId();
  return (
    <Frame id={id} label={label} hint={hint} error={error} required={required}>
      <textarea id={id} rows={rows} required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)}
        className={cn(CONTROL, error ? "border-danger" : "border-control", className)} {...rest} />
    </Frame>
  );
}

export type SelectFieldProps = FieldFrameProps & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & { options: { value: string; label: string }[]; placeholder?: string };

export function SelectField({ label, hint, error, required, className, options, placeholder, ...rest }: SelectFieldProps) {
  const id = useId();
  return (
    <Frame id={id} label={label} hint={hint} error={error} required={required}>
      <select id={id} required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)}
        className={cn(CONTROL, error ? "border-danger" : "border-control", className)} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </Frame>
  );
}
