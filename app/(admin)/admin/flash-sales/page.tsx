// ============================================================
// BLENDIFY — Flash Sales Page  /admin/flash-sales
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Trash2, Zap, Edit } from 'lucide-react';
import { DataTable, Column } from '@/components/admin/ui/DataTable';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { ExportMenu } from '@/components/admin/ui/ExportMenu';
import { Drawer } from '@/components/admin/ui/Drawer';
import { adminToast } from '@/components/admin/ui/Toast';
import { handleExportDownload } from '@/lib/hooks/useAdminTable';

interface FlashSale {
  id: string; name: string; description: string | null; discountType: string;
  discountValue: number; isActive: boolean; startsAt: string; endsAt: string;
  computedStatus: string; _count: { items: number }; createdAt: string;
}

interface FormState {
  name: string; description: string; discountType: string; discountValue: string;
  startsAt: string; endsAt: string; isActive: boolean; sortOrder: string;
}

const DEFAULT_FORM: FormState = { name: '', description: '', discountType: 'PERCENTAGE', discountValue: '', startsAt: '', endsAt: '', isActive: true, sortOrder: '0' };

export default function FlashSalesPage() {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FlashSale | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25', ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) });
    const res = await fetch(`/api/admin/flash-sales?${params}`);
    const data = await res.json();
    if (data.success) { setSales(data.data); setPagination(data.pagination); }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetch_(1); }, [search, statusFilter]);

  const openCreate = () => { setEditTarget(null); setForm(DEFAULT_FORM); setDrawerOpen(true); };
  const openEdit = (s: FlashSale) => {
    setEditTarget(s);
    setForm({ name: s.name, description: s.description ?? '', discountType: s.discountType, discountValue: String(s.discountValue), startsAt: s.startsAt.slice(0, 16), endsAt: s.endsAt.slice(0, 16), isActive: s.isActive, sortOrder: '0' });
    setDrawerOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, discountValue: parseFloat(form.discountValue), startsAt: new Date(form.startsAt), endsAt: new Date(form.endsAt), sortOrder: parseInt(form.sortOrder), items: [] };
      const method = editTarget ? 'PATCH' : 'POST';
      const url = editTarget ? `/api/admin/flash-sales/${editTarget.id}` : '/api/admin/flash-sales';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { adminToast.success(editTarget ? 'Flash sale updated' : 'Flash sale created'); setDrawerOpen(false); fetch_(pagination.page); }
      else adminToast.error(data.error);
    } catch { adminToast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await fetch(`/api/admin/flash-sales/${deleteTarget}`, { method: 'DELETE' });
    adminToast.success('Flash sale deleted'); setDeleteTarget(null); fetch_(pagination.page);
    setDeleteLoading(false);
  };

  const fmtDate = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  const columns: Column<FlashSale>[] = [
    { key: 'name', header: 'Name', sortable: true, cell: (r) => <div><div style={{ fontWeight: 500, fontSize: '13px' }}>{r.name}</div>{r.description && <div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>{r.description}</div>}</div> },
    { key: 'discountType', header: 'Discount', cell: (r) => <span style={{ fontWeight: 600 }}>{r.discountType === 'PERCENTAGE' ? `${r.discountValue}%` : `₹${r.discountValue}`}</span> },
    { key: 'items', header: 'Products', cell: (r) => <span>{r._count.items} products</span> },
    { key: 'computedStatus', header: 'Status', cell: (r) => <StatusBadge status={r.computedStatus} /> },
    { key: 'startsAt', header: 'Starts', cell: (r) => <span style={{ fontSize: '12px' }}>{fmtDate(r.startsAt)}</span> },
    { key: 'endsAt', header: 'Ends', cell: (r) => <span style={{ fontSize: '12px' }}>{fmtDate(r.endsAt)}</span> },
    {
      key: 'actions', header: '',
      cell: (r) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => openEdit(r)} id={`flash-edit-${r.id}`}><Edit size={13} /></button>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: 'var(--admin-error)' }} onClick={() => setDeleteTarget(r.id)} id={`flash-delete-${r.id}`}><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Flash Sales</h1><p className="admin-page-subtitle">Time-limited promotional discounts on selected products</p></div>
        <div className="admin-page-actions">
          <ExportMenu onExport={(f) => handleExportDownload(f, 'flash-sales')} id="flash-export" />
          <button className="admin-btn admin-btn-primary" onClick={openCreate} id="flash-create"><Plus size={14} />New Flash Sale</button>
        </div>
      </div>

      <DataTable id="flash-table" data={sales} columns={columns} loading={loading} totalCount={pagination?.total ?? 0} page={pagination?.page ?? 1} limit={pagination?.limit ?? 25} onPageChange={fetch_} selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        toolbar={
          <>
            <div className="admin-search-input-wrap"><Search size={14} /><input id="flash-search" className="admin-search-input" placeholder="Search flash sales..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select className="admin-select" style={{ height: '32px', width: 'auto', fontSize: '12px', padding: '0 28px 0 10px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} id="flash-status-filter">
              <option value="">All Statuses</option><option value="active">Live</option><option value="scheduled">Scheduled</option><option value="expired">Expired</option><option value="inactive">Inactive</option>
            </select>
          </>
        }
        emptyTitle="No flash sales yet" emptyDescription="Create flash sales to drive urgency and boost conversions."
        emptyAction={<button className="admin-btn admin-btn-primary admin-btn-sm" onClick={openCreate} id="flash-empty-create"><Plus size={13} /><Zap size={13} />Create Flash Sale</button>}
      />

      <Drawer open={drawerOpen} title={editTarget ? 'Edit Flash Sale' : 'New Flash Sale'} onClose={() => setDrawerOpen(false)}
        footer={<><button className="admin-btn admin-btn-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button><button className="admin-btn admin-btn-primary" onClick={save} disabled={saving} id="flash-save">{saving && <span className="admin-spinner" style={{ width: 14, height: 14 }} />}Save</button></>}>
        <div className="admin-form-group"><label className="admin-label required" htmlFor="flash-name">Name</label><input id="flash-name" className="admin-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Summer Flash Sale" /></div>
        <div className="admin-form-group"><label className="admin-label" htmlFor="flash-desc">Description</label><input id="flash-desc" className="admin-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description..." /></div>
        <div className="admin-form-row">
          <div className="admin-form-group"><label className="admin-label required" htmlFor="flash-type">Discount Type</label><select id="flash-type" className="admin-select" value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}><option value="PERCENTAGE">Percentage (%)</option><option value="FIXED_AMOUNT">Fixed (₹)</option></select></div>
          <div className="admin-form-group"><label className="admin-label required" htmlFor="flash-value">Value</label><input id="flash-value" className="admin-input" type="number" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} placeholder="20" /></div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group"><label className="admin-label required" htmlFor="flash-start">Start Date & Time</label><input id="flash-start" className="admin-input" type="datetime-local" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} /></div>
          <div className="admin-form-group"><label className="admin-label required" htmlFor="flash-end">End Date & Time</label><input id="flash-end" className="admin-input" type="datetime-local" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} /></div>
        </div>
        <div className="admin-field-row"><label className="admin-toggle" htmlFor="flash-active"><input id="flash-active" type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /><span className="admin-toggle-slider" /></label><span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>Active</span></div>
        <div className="admin-divider" />
        <p style={{ fontSize: '12px', color: 'var(--admin-text-tertiary)' }}>After saving, add products to this flash sale from the detail page.</p>
      </Drawer>

      <ConfirmDialog open={!!deleteTarget} title="Delete Flash Sale?" description="This will permanently remove the flash sale and all associated product overrides." confirmLabel="Delete" loading={deleteLoading} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
