// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";

export interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Native <dialog>: focus trap, Esc and inert background come from the browser. */
export function Dialog({ open, title, onClose, children, footer }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  return (
    <dialog ref={ref} aria-labelledby={titleId} onClose={onClose} onCancel={onClose}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink shadow-pop backdrop:bg-ink/50">
      <div className="space-y-3 p-5">
        <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
        <div className="text-sm text-ink-2">{children}</div>
      </div>
      {footer && <div className="flex justify-end gap-2 border-t border-line bg-surface-2 px-5 py-3">{footer}</div>}
    </dialog>
  );
}

/** Irreversible or sensitive actions: say what happens, name the target, never default to the destructive choice. */
export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = "Huỷ", danger, loading, onConfirm, onCancel }: {
  open: boolean; title: string; description: ReactNode; confirmLabel: string; cancelLabel?: string; danger?: boolean; loading?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Dialog open={open} title={title} onClose={onCancel}
      footer={<>
        <Button variant="secondary" onClick={onCancel} autoFocus>{cancelLabel}</Button>
        <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </>}>
      {description}
    </Dialog>
  );
}
