import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

export const PAGE_SIZE = 20;

export type SortDir = 'asc' | 'desc';

export function usePagedSort<T>(
  items: T[],
  options: {
    search: string;
    match: (item: T, q: string) => boolean;
    sortKey: string;
    sortDir: SortDir;
    value: (item: T, key: string) => string | number;
  },
) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [options.search, options.sortKey, options.sortDir, items.length]);

  const filtered = useMemo(() => {
    const q = options.search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => options.match(item, q));
  }, [items, options.search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = options.value(a, options.sortKey);
      const bv = options.value(b, options.sortKey);
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'es');
      return options.sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [filtered, options.sortKey, options.sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return { pageItems, page: safePage, setPage, pageCount, total: filtered.length };
}

export function SortHeader({
  columns,
  sortKey,
  sortDir,
  onSort,
}: {
  columns: Array<{ key: string; label: string }>;
  sortKey: string;
  sortDir: SortDir;
  onSort: (key: string) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {columns.map((col) => {
        const active = sortKey === col.key;
        return (
          <button
            key={col.key}
            type="button"
            onClick={() => onSort(col.key)}
            className={[
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-colors',
              active ? 'bg-[var(--sage-soft)] text-[var(--ink)]' : 'text-[var(--ink-soft)] hover:bg-[var(--empty)]',
            ].join(' ')}
          >
            {col.label}
            {active ? sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (total <= PAGE_SIZE) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--ink-soft)]">
      <p>
        {total} en total · página {page} de {pageCount}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-full px-3 py-1 hover:bg-[var(--sage-soft)] disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Anterior
        </button>
        <button
          type="button"
          className="rounded-full px-3 py-1 hover:bg-[var(--sage-soft)] disabled:opacity-40"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export function ListToolbar({
  search,
  onSearch,
  placeholder,
  children,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end gap-3">
      <label className="min-w-[200px] flex-1">
        <span className="sr-only">{placeholder}</span>
        <input
          className="w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
          placeholder={placeholder}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </label>
      {children}
    </div>
  );
}
