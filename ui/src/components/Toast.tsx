// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { CircleCheck, CircleAlert, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

export type ToastTone = "ok" | "danger" | "brand";
interface ToastItem { id: number; tone: ToastTone; message: string }
interface ToastApi { notify: (message: string, tone?: ToastTone) => void }

const ToastContext = createContext<ToastApi>({ notify: () => {} });
export const useToast = (): ToastApi => useContext(ToastContext);

const STYLE: Record<ToastTone, string> = {
  ok: "border-ok-line bg-ok-soft text-ok",
  danger: "border-danger-line bg-danger-soft text-danger",
  brand: "border-brand-line bg-brand-soft text-brand",
};
const ICON = { ok: CircleCheck, danger: CircleAlert, brand: Info } as const;

/** Mount once near the root. Messages appear in a polite live region and dismiss themselves. */
export function ToastProvider({ children, duration = 5000 }: { children: ReactNode; duration?: number }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems(current => current.filter(item => item.id !== id)), []);
  const notify = useCallback((message: string, tone: ToastTone = "brand") => {
    const id = Date.now() + Math.random();
    setItems(current => [...current, { id, tone, message }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
  }, [dismiss, duration]);
  const api = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {items.map(item => {
          const Icon = ICON[item.tone];
          return (
            <div key={item.id} className={cn("pointer-events-auto flex w-full max-w-sm animate-[jh-slide-in_0.2s_ease-out] items-start gap-2 rounded-lg border px-3 py-2.5 text-sm shadow-pop", STYLE[item.tone])}>
              <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span className="flex-1">{item.message}</span>
              <button type="button" aria-label="Đóng thông báo" onClick={() => dismiss(item.id)} className="rounded p-0.5 hover:opacity-70"><X aria-hidden className="size-4" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
