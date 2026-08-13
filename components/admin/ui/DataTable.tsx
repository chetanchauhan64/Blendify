// ============================================================
// BLENDIFY — DataTable Component (Enhanced Redesign)
// Column Visibility, Saved Views, Bulk Actions, Inline Editing
// Freeze Column, Remember User Preferences
// ============================================================
'use client';

import { useState, useCallback, useId, useRef, useEffect } from 'react';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  Eye, EyeOff, SlidersHorizontal, X, Save, Plus,
} from 'lucide-react';
import { SkeletonTable } from './SkeletonTable';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T, onEdit?: (id: string, key: string, value: string) => void) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  className?: string;
  hideable?: boolean;
  frozen?: boolean;
}

export interface SavedView {
  name: string;
  columns: string[];
  sort?: { key: string; order: 'asc' | 'desc' };
}

export interface DataTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  error?: string;
  totalCount?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  toolbar?: React.ReactNode;
  bulkActions?: React.ReactNode;
  id?: string;
  onInlineEdit?: (id: string, key: string, value: string) => Promise<void>;
  storageKey?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  error,
  totalCount = 0,
  page = 1,
  limit = 25,
  sortBy,
  sortOrder = 'desc',
  onSort,
  onPageChange,
  onLimitChange,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters or creating a new record.',
  emptyAction,
  toolbar,
  bulkActions,
  id,
  onInlineEdit,
  storageKey,
}: DataTableProps<T>) {
  const tableId      = useId();
  const effectiveId  = id ?? tableId;
  const colVisRef    = useRef<HTMLDivElement>(null);

  // ── Column visibility ─────────────────────────────────────
  const defaultHidden: string[] = [];
  const [hiddenCols, setHiddenCols] = useState<string[]>(() => {
    if (!storageKey) return defaultHidden;
    try {
      const stored = localStorage.getItem(`dtable-${storageKey}-hidden`);
      return stored ? JSON.parse(stored) : defaultHidden;
    } catch { return defaultHidden; }
  });

  const [colVisOpen,  setColVisOpen]  = useState(false);
  const [savedViews,  setSavedViews]  = useState<SavedView[]>(() => {
    if (!storageKey) return [];
    try {
      const stored = localStorage.getItem(`dtable-${storageKey}-views`);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [activeView,  setActiveView]  = useState<string | null>(null);
  const [newViewName, setNewViewName] = useState('');

  const visibleCols  = columns.filter((c) => !hiddenCols.includes(c.key));
  const hideablesCols = columns.filter((c) => c.hideable !== false);

  const toggleCol = (key: string) => {
    setHiddenCols((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      if (storageKey) {
        try { localStorage.setItem(`dtable-${storageKey}-hidden`, JSON.stringify(next)); } catch { /* ignore */ }
      }
      return next;
    });
  };

  // Click-outside col vis
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colVisRef.current && !colVisRef.current.contains(e.target as Node)) {
        setColVisOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Saved Views ───────────────────────────────────────────
  const saveCurrentView = () => {
    if (!newViewName.trim()) return;
    const view: SavedView = {
      name: newViewName.trim(),
      columns: visibleCols.map((c) => c.key),
      sort: sortBy ? { key: sortBy, order: sortOrder } : undefined,
    };
    const next = [...savedViews, view];
    setSavedViews(next);
    setActiveView(view.name);
    setNewViewName('');
    if (storageKey) {
      try { localStorage.setItem(`dtable-${storageKey}-views`, JSON.stringify(next)); } catch { /* ignore */ }
    }
  };

  const applyView = (view: SavedView) => {
    const toHide = columns.filter((c) => !view.columns.includes(c.key)).map((c) => c.key);
    setHiddenCols(toHide);
    setActiveView(view.name);
    if (view.sort && onSort) onSort(view.sort.key, view.sort.order);
  };

  const deleteView = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = savedViews.filter((v) => v.name !== name);
    setSavedViews(next);
    if (activeView === name) setActiveView(null);
    if (storageKey) {
      try { localStorage.setItem(`dtable-${storageKey}-views`, JSON.stringify(next)); } catch { /* ignore */ }
    }
  };

  // ── Pagination ────────────────────────────────────────────
  const totalPages   = Math.ceil(totalCount / limit);
  const allSelected  = data.length > 0 && data.every((row) => selectedIds.includes(row.id));
  const someSelected = data.some((row) => selectedIds.includes(row.id)) && !allSelected;

  const handleSort = (key: string) => {
    if (!onSort) return;
    if (sortBy === key) {
      onSort(key, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(key, 'desc');
    }
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !data.some((row) => row.id === id)));
    } else {
      onSelectionChange([...new Set([...selectedIds, ...data.map((r) => r.id)])]);
    }
  };

  const toggleRow = (rowId: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(rowId)) {
      onSelectionChange(selectedIds.filter((id) => id !== rowId));
    } else {
      onSelectionChange([...selectedIds, rowId]);
    }
  };

  const generatePages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="admin-table-wrapper" id={`data-table-${effectiveId}`} role="region" aria-label="Data table">

      {/* ── Saved Views bar ─────────────────────────────── */}
      {savedViews.length > 0 && (
        <div className="admin-saved-views" role="tablist" aria-label="Saved views">
          <span style={{ fontSize: '11px', color: 'var(--admin-text-disabled)', fontWeight: 600, letterSpacing: '0.5px' }}>
            VIEWS:
          </span>
          {savedViews.map((view) => (
            <button
              key={view.name}
              className={`admin-saved-view-btn ${activeView === view.name ? 'active' : ''}`}
              onClick={() => applyView(view)}
              role="tab"
              aria-selected={activeView === view.name}
            >
              {view.name}
              <span
                onClick={(e) => deleteView(view.name, e)}
                style={{ marginLeft: 2, opacity: 0.5, lineHeight: 1 }}
                aria-label={`Delete view ${view.name}`}
              >
                <X size={10} />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Toolbar ─────────────────────────────────────── */}
      {toolbar && (
        <div className="admin-table-toolbar">
          <div className="admin-table-toolbar-left">{toolbar}</div>

          {/* Column visibility */}
          <div className="admin-table-toolbar-right">
            <div style={{ position: 'relative' }} ref={colVisRef}>
              <button
                className="admin-btn admin-btn-ghost admin-btn-sm"
                onClick={() => setColVisOpen((v) => !v)}
                aria-label="Toggle column visibility"
                aria-expanded={colVisOpen}
                aria-haspopup="dialog"
                id={`${effectiveId}-col-vis-btn`}
                title="Show/hide columns"
              >
                <SlidersHorizontal size={14} aria-hidden="true" />
                Columns
                {hiddenCols.length > 0 && (
                  <span style={{
                    background: 'var(--admin-accent)', color: '#FAF0E6',
                    borderRadius: '100px', fontSize: '10px', fontWeight: 700,
                    padding: '0 5px', minWidth: '16px', textAlign: 'center',
                  }}>
                    {hiddenCols.length}
                  </span>
                )}
              </button>

              {colVisOpen && (
                <div
                  className="admin-col-visibility"
                  role="dialog"
                  aria-label="Column visibility options"
                >
                  <div style={{ padding: '6px 10px 8px', borderBottom: '1px solid var(--admin-border)', marginBottom: 4 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--admin-text-tertiary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Columns
                    </span>
                  </div>
                  {hideablesCols.map((col) => (
                    <div
                      key={col.key}
                      className="admin-col-visibility-item"
                      onClick={() => toggleCol(col.key)}
                      role="checkbox"
                      aria-checked={!hiddenCols.includes(col.key)}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleCol(col.key); }}
                    >
                      {hiddenCols.includes(col.key)
                        ? <EyeOff size={14} style={{ color: 'var(--admin-text-disabled)', flexShrink: 0 }} aria-hidden="true" />
                        : <Eye    size={14} style={{ color: 'var(--admin-success)',        flexShrink: 0 }} aria-hidden="true" />
                      }
                      {col.header}
                    </div>
                  ))}

                  {/* Save view */}
                  <div style={{ padding: '8px', borderTop: '1px solid var(--admin-border)', marginTop: 4 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--admin-text-disabled)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>
                      Save Current View
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        className="admin-input"
                        style={{ height: 28, fontSize: 12 }}
                        placeholder="View name…"
                        value={newViewName}
                        onChange={(e) => setNewViewName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveCurrentView(); }}
                        aria-label="New view name"
                      />
                      <button
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        style={{ height: 28, padding: '0 8px', flexShrink: 0 }}
                        onClick={saveCurrentView}
                        disabled={!newViewName.trim()}
                        aria-label="Save view"
                      >
                        <Save size={12} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk actions bar ─────────────────────────────── */}
      {selectable && selectedIds.length > 0 && bulkActions && (
        <div className="admin-bulk-bar" role="toolbar" aria-label={`${selectedIds.length} items selected`}>
          <span className="admin-bulk-count" aria-live="polite">
            {selectedIds.length} selected
          </span>
          <div className="admin-bulk-actions">{bulkActions}</div>
          <button
            className="admin-btn admin-btn-ghost admin-btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => onSelectionChange?.([])}
            aria-label="Clear selection"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────── */}
      <div className="admin-table-overflow">
        <table className="admin-table" role="grid" aria-label={`Data table ${effectiveId}`}>
          <thead>
            <tr>
              {selectable && (
                <th className="th-checkbox" scope="col">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                    id={`${effectiveId}-select-all`}
                  />
                </th>
              )}
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width }}
                  className={`${sortBy === col.key ? 'sorted' : ''} ${col.className ?? ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                  aria-sort={sortBy === col.key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {col.header}
                    {col.sortable && (
                      <span style={{ color: 'var(--admin-text-disabled)', display: 'flex', alignItems: 'center' }} aria-hidden="true">
                        {sortBy === col.key ? (
                          sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        ) : (
                          <ChevronsUpDown size={12} />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleCols.length + (selectable ? 1 : 0)} style={{ padding: 0 }}>
                  <SkeletonTable rows={limit > 10 ? 10 : limit} cols={visibleCols.length + (selectable ? 1 : 0)} />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={visibleCols.length + (selectable ? 1 : 0)}>
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-error)', fontSize: '13px' }}>
                    {error}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length + (selectable ? 1 : 0)}>
                  <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={isSelected ? 'row-selected' : ''}
                    aria-selected={selectable ? isSelected : undefined}
                  >
                    {selectable && (
                      <td className="td-checkbox">
                        <input
                          type="checkbox"
                          className="admin-checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(row.id)}
                          aria-label={`Select row ${row.id}`}
                          id={`${effectiveId}-row-${row.id}`}
                        />
                      </td>
                    )}
                    {visibleCols.map((col) => (
                      <td key={col.key} className={col.className}>
                        {col.cell(row, onInlineEdit)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ───────────────────────────────────── */}
      {!loading && !error && totalCount > 0 && (
        <div className="admin-table-pagination">
          <div className="admin-pagination-info" role="status" aria-live="polite">
            Showing{' '}
            {Math.min((page - 1) * limit + 1, totalCount)}–{Math.min(page * limit, totalCount)}{' '}
            of {totalCount.toLocaleString()} records
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Rows per page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--admin-text-tertiary)' }}>
              Rows:
              <select
                value={limit}
                onChange={(e) => onLimitChange?.(Number(e.target.value))}
                className="admin-select"
                style={{ height: '30px', width: 'auto', padding: '0 26px 0 8px', fontSize: '12px' }}
                aria-label="Rows per page"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Page buttons */}
            <div className="admin-pagination-controls" role="navigation" aria-label="Pagination">
              <button
                className="admin-page-btn"
                onClick={() => onPageChange?.(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                ‹
              </button>
              {generatePages().map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px', padding: '0 4px' }} aria-hidden="true">…</span>
                ) : (
                  <button
                    key={p}
                    className={`admin-page-btn ${page === p ? 'active' : ''}`}
                    onClick={() => onPageChange?.(p as number)}
                    aria-label={`Page ${p}`}
                    aria-current={page === p ? 'page' : undefined}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                className="admin-page-btn"
                onClick={() => onPageChange?.(page + 1)}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
