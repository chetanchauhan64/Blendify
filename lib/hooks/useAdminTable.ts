// ============================================================
// BLENDIFY — useAdminTable hook
// Shared logic for all admin list pages
// ============================================================
'use client';

import { useState, useCallback, useEffect } from 'react';

export interface PaginationState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminTableOptions<T> {
  apiPath: string;
  initialLimit?: number;
  transformRow?: (row: unknown) => T;
}

export function useAdminTable<T extends { id: string }>(opts: AdminTableOptions<T>) {
  const { apiPath, initialLimit = 25, transformRow } = opts;
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({ total: 0, page: 1, limit: initialLimit, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [extraParams, setExtraParams] = useState<Record<string, string>>({});

  const fetchData = useCallback(async (page = 1, params: Record<string, string> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const allParams = { page: String(page), limit: String(pagination.limit), ...extraParams, ...params };
      const qs = new URLSearchParams(Object.fromEntries(Object.entries(allParams).filter(([, v]) => v !== ''))).toString();
      const res = await fetch(`${apiPath}?${qs}`);
      const json = await res.json();
      if (json.success) {
        const rows = (json.data as unknown[]).map((r) => transformRow ? transformRow(r) : r as T);
        setData(rows);
        if (json.pagination) setPagination({ ...json.pagination, page });
      } else {
        setError(json.error ?? 'Failed to load data');
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, [apiPath, pagination.limit, extraParams, transformRow]);

  const refetch = useCallback(() => fetchData(pagination.page), [fetchData, pagination.page]);

  const applyFilters = useCallback((params: Record<string, string>) => {
    setExtraParams(params);
  }, []);

  useEffect(() => { fetchData(1); }, [extraParams, fetchData]);

  return {
    data, pagination, loading, error, selectedIds, setSelectedIds,
    fetchData, refetch, applyFilters,
    setLimit: (limit: number) => setPagination((p) => ({ ...p, limit })),
  };
}

export async function apiAction(url: string, method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', body?: unknown) {
  const res = await fetch(url, {
    method,
    ...(body !== undefined ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

export function handleExportDownload(format: string, module: string, extraParams = '') {
  const url = `/api/admin/export/${module}?format=${format}${extraParams ? `&${extraParams}` : ''}`;
  if (format === 'print') { window.open(url); return; }
  fetch(url).then((r) => r.blob()).then((blob) => {
    const ext = format === 'excel' ? 'xls' : format === 'pdf' ? 'html' : 'csv';
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${module}-${new Date().toISOString().slice(0, 10)}.${ext}`; a.click();
  });
}
