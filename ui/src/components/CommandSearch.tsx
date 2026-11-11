// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { CornerDownLeft, LoaderCircle, Search } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Dialog } from "./Dialog";

export interface SearchResult { id: string; title: string; subtitle?: string; badge?: ReactNode }

export interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
  /** Called on every change; may be async. The latest call wins. */
  onSearch: (query: string) => SearchResult[] | Promise<SearchResult[]>;
  onSelect: (result: SearchResult) => void;
  placeholder?: string;
  hint?: string;
}

/** Quick find in a dialog: type, arrow keys, Enter. Used for patients and records from any screen. */
export function CommandSearch({ open, onClose, onSearch, onSelect, placeholder = "Tìm theo họ tên, số điện thoại, mã hồ sơ", hint = "Gõ ít nhất 2 ký tự" }: CommandSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const ticket = useRef(0);
  const listId = useId();

  useEffect(() => { if (!open) { setQuery(""); setResults([]); setActive(0); } }, [open]);
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) { setResults([]); setLoading(false); return; }
    const mine = ++ticket.current;
    setLoading(true);
    Promise.resolve(onSearch(query.trim())).then(found => { if (mine === ticket.current) { setResults(found); setActive(0); setLoading(false); } },
      () => { if (mine === ticket.current) { setResults([]); setLoading(false); } });
  }, [query, open, onSearch]);

  const choose = (result: SearchResult | undefined) => { if (result) { onSelect(result); onClose(); } };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setActive(index => Math.min(index + 1, results.length - 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive(index => Math.max(index - 1, 0)); }
    else if (event.key === "Enter") { event.preventDefault(); choose(results[active]); }
  };

  return (
    <Dialog open={open} title="Tìm nhanh" onClose={onClose}>
      <div className="-mx-1 space-y-2">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input autoFocus role="combobox" aria-expanded={results.length > 0} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            aria-label="Từ khoá tìm kiếm" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={onKeyDown} placeholder={placeholder}
            className="w-full rounded-lg border border-control bg-surface py-2.5 pl-9 pr-9 text-base text-ink placeholder:text-placeholder" />
          {loading && <LoaderCircle aria-hidden className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" />}
        </div>
        <ul id={listId} role="listbox" aria-label="Kết quả" className="max-h-72 overflow-y-auto">
          {results.map((result, index) => (
            <li key={result.id} id={`${listId}-${index}`} role="option" aria-selected={index === active} onMouseEnter={() => setActive(index)} onClick={() => choose(result)}
              className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2", index === active ? "bg-brand-soft" : "")}>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{result.title}</span>
                {result.subtitle && <span className="block truncate text-sm text-muted">{result.subtitle}</span>}
              </span>
              {result.badge}
              {index === active && <CornerDownLeft aria-hidden className="size-4 text-muted" />}
            </li>
          ))}
        </ul>
        <p role="status" className="px-1 text-sm text-muted">
          {query.trim().length < 2 ? hint : loading ? "Đang tìm" : results.length === 0 ? "Không tìm thấy kết quả" : `${results.length} kết quả`}
        </p>
      </div>
    </Dialog>
  );
}
