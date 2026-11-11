// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface Column<Row> {
  key: string;
  header: string;
  render?: (row: Row) => ReactNode;
  /** Value used for sorting; when present the column is sortable. */
  sortValue?: (row: Row) => string | number;
  align?: "left" | "right";
  mono?: boolean;
}

export interface DataTableProps<Row> {
  caption: string;
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  onRowClick?: (row: Row) => void;
  empty?: ReactNode;
  className?: string;
}

/** Dense, keyboard-friendly table. Sortable headers are buttons; clickable rows expose a real control in their first cell. */
export function DataTable<Row>({ caption, columns, rows, rowKey, onRowClick, empty, className }: DataTableProps<Row>) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const sorted = useMemo(() => {
    const column = columns.find(item => item.key === sort?.key);
    if (!sort || !column?.sortValue) return rows;
    const value = column.sortValue;
    return [...rows].sort((a, b) => {
      const x = value(a), y = value(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [rows, columns, sort]);

  const toggle = (key: string) => setSort(current => (current?.key === key ? (current.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-line bg-surface shadow-card", className)}>
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wide text-muted">
          <tr>
            {columns.map(column => {
              const active = sort?.key === column.key;
              return (
                <th key={column.key} scope="col" aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : column.sortValue ? "none" : undefined}
                  className={cn("px-4 py-3 font-medium", column.align === "right" && "text-right")}>
                  {column.sortValue ? (
                    <button type="button" onClick={() => toggle(column.key)} className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-ink">
                      {column.header}
                      {active && (sort.dir === 1 ? <ArrowUp aria-hidden className="size-3.5" /> : <ArrowDown aria-hidden className="size-3.5" />)}
                    </button>
                  ) : column.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sorted.map(row => (
            <tr key={rowKey(row)} onClick={onRowClick && (() => onRowClick(row))} className={cn(onRowClick && "cursor-pointer", "hover:bg-brand-soft")}>
              {columns.map((column, index) => {
                const content = column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "");
                return (
                  <td key={column.key} className={cn("px-4 py-3", column.align === "right" && "text-right", column.mono && "font-mono text-xs")}>
                    {onRowClick && index === 0
                      ? <button type="button" onClick={event => { event.stopPropagation(); onRowClick(row); }} className="text-left font-medium text-brand underline-offset-2 hover:underline">{content}</button>
                      : content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="p-6 text-sm text-muted">{empty ?? "Không có dữ liệu."}</div>}
    </div>
  );
}
