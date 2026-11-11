// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover border-transparent",
  secondary: "bg-surface text-ink border-control hover:bg-surface-2",
  ghost: "bg-transparent text-brand border-transparent hover:bg-brand-soft",
  danger: "bg-danger text-on-danger border-transparent hover:opacity-90",
};

const SIZE: Record<ButtonSize, string> = {
  md: "min-h-9 px-3.5 text-sm",
  lg: "min-h-11 px-5 text-base",
};

/** Native button; `loading` disables it and announces the busy state. */
export function Button({ variant = "primary", size = "md", loading = false, icon, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT[variant], SIZE[size], className,
      )}
      {...rest}
    >
      {loading ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
