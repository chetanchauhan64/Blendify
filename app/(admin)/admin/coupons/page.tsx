// ============================================================
// BLENDIFY — Coupons Page  /admin/coupons
// ============================================================
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Search, Tag, Trash2, ToggleLeft } from 'lucide-react';
import { DataTable, Column } from '@/components/admin/ui/DataTable';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { ExportMenu } from '@/components/admin/ui/ExportMenu';
import { Drawer } from '@/components/admin/ui/Drawer';
import { adminToast } from '@/components/admin/ui/Toast';
import { StatCard } from '@/components/admin/ui/StatCard';

interface Coupon {
  id: string; code: string; description: string | null; type: string;
  discountValue: number; minOrderAmount: number | null; maxDiscountAmount: number | null;
  maxUses: number | null; usedCount: number; isActive: boolean;
  startsAt: string | null; expiresAt: string | null; createdAt: string;
}

interface FormState {
  code: string; description: string; type: string; discountValue: string;
  minOrderAmount: string; maxDiscountAmount: string; maxUses: string;
  maxUsesPerUser: string; isActive: boolean; startsAt: string; expiresAt: string;
  applicableTo: string;
}

const DEFAULT_FORM: FormState = {
  code: '', description: '', type: 'PERCENTAGE', discountValue: '', minOrderAmount: '',
  maxDiscountAmount: '', maxUses: '', maxUsesPerUser: '', isActive: true,
  startsAt: '', expiresAt: '', applicableTo: 'ALL',
};

function genCode() {
  return Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 34)]).join('');
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25', ...(search ? { search } : {}), ...(isActive ? { isActive } : {}) });
    const res = await fetch(`/api/admin/coupons?${params}`);
    const data = await res.json();
    if (data.success) { setCoupons(data.data); setPagination(data.pagination); }
    setLoading(false);
  }, [search, isActive]);

  useEffect(() => { fetchData(1); }, [search, isActive]);

  const openCreate = () => { setEditTarget(null); setForm({ ...DEFAULT_FORM, code: genCode() }); setDrawerOpen(true); };
  const openEdit = (c: Coupon) => {
    setEditTarget(c);
    setForm({ code: c.code, description: c.description ?? '', type: c.type, discountValue: String(c.discountValue), minOrderAmount: String(c.minOrderAmount ?? ''), maxDiscountAmount: String(c.maxDiscountAmount ?? ''), maxUses: String(c.maxUses ?? ''), maxUsesPerUser: '', isActive: c.isActive, startsAt: c.startsAt?.slice(0, 16) ?? '', expiresAt: c.expiresAt?.slice(0, 16) ?? '', applicableTo: 'ALL' });
    setDrawerOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, discountValue: parseFloat(form.discountValue), minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null, maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : null, maxUses: form.maxUses ? parseInt(form.maxUses) : null, maxUsesPerUser: form.maxUsesPerUser ? parseInt(form.maxUsesPerUser) : null, startsAt: form.startsAt ? new Date(form.startsAt) : null, expiresAt: form.expiresAt ? new Date(form.expiresAt) : null };
      const method = editTarget ? 'PATCH' : 'POST';
      const url = editTarget ? `/api/admin/coupons/${editTarget.id}` : '/api/admin/coupons';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { adminToast.success(editTarget ? 'Coupon updated' : 'Coupon created'); setDrawerOpen(false); fetchData(pagination.page); }
      else adminToast.error(data.error);
    } catch { adminToast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await fetch(`/api/admin/coupons/${deleteTarget}`, { method: 'DELETE' });
    adminToast.success('Coupon deleted'); setDeleteTarget(null); fetchData(pagination.page);
    setDeleteLoading(false);
  };

  const toggleActive = async (c: Coupon) => {
    await fetch(`/api/admin/coupons/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !c.isActive }) });
    adminToast.success(`Coupon ${c.isActive ? 'deactivated' : 'activated'}`); fetchData(pagination.page);
  };

  const handleExport = async (format: string) => {
    const res = await fetch(`/api/admin/export/coupons?format=${format}`);
    const blob = await res.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `coupons.${format === 'excel' ? 'xls' : format}`;
    if (format === 'print') { window.open(`/api/admin/export/coupons?format=print`); return; }
    a.click();
  };

  const columns: Column<Coupon>[] = [
    { key: 'code', header: 'Code', sortable: true, cell: (r) => <span style={{ fontFamily: 'var(--admin-font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--admin-accent)', letterSpacing: '0.5px' }}>{r.code}</span> },
    { key: 'type', header: 'Type', cell: (r) => <span style={{ fontSize: '12px' }}>{r.type.replace(/_/g, ' ')}</span> },
    { key: 'discountValue', header: 'Value', sortable: true, cell: (r) => <span style={{ fontWeight: 600 }}>{r.type === 'PERCENTAGE' ? `${r.discountValue}%` : r.type === 'FREE_SHIPPING' ? 'Free Ship' : `₹${r.discountValue}`}</span> },
    { key: 'usage', header: 'Usage', cell: (r) => <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>{r.usedCount}{r.maxUses ? ` / ${r.maxUses}` : ''}</span> },
    { key: 'isActive', header: 'Status', cell: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
    { key: 'expiresAt', header: 'Expires', cell: (r) => r.expiresAt ? <span style={{ fontSize: '12px' }}>{new Date(r.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span> : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>Never</span> },
    {
      key: 'actions', header: '',
      cell: (r) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => openEdit(r)} id={`coupon-edit-${r.id}`}>Edit</button>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => toggleActive(r)} id={`coupon-toggle-${r.id}`}><ToggleLeft size={13} /></button>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: 'var(--admin-error)' }} onClick={() => setDeleteTarget(r.id)} id={`coupon-delete-${r.id}`}><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Coupons</h1><p className="admin-page-subtitle">Create and manage discount coupons</p></div>
        <div className="admin-page-actions">
          <ExportMenu onExport={handleExport} id="coupons-export" />
          <button className="admin-btn admin-btn-primary" onClick={openCreate} id="coupons-create"><Plus size={14} />New Coupon</button>
        </div>
      </div>

      <DataTable id="coupons-table" data={coupons} columns={columns} loading={loading} totalCount={pagination.total} page={pagination.page} limit={pagination.limit} onPageChange={fetchData} selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        toolbar={
          <>
            <div className="admin-search-input-wrap"><Search size={14} /><input id="coupons-search" className="admin-search-input" placeholder="Search by code..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select className="admin-select" style={{ height: '32px', width: 'auto', fontSize: '12px', padding: '0 28px 0 10px' }} value={isActive} onChange={(e) => setIsActive(e.target.value)} id="coupons-status-filter">
              <option value="">All</option><option value="true">Active</option><option value="false">Inactive</option>
            </select>
          </>
        }
        bulkActions={
          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={async () => {
            if (!selectedIds.length) return;
            try {
              await Promise.all(selectedIds.map((id) => fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })));
              adminToast.success(`${selectedIds.length} coupon(s) deleted`);
              setSelectedIds([]);
              fetchData(pagination.page);
            } catch { adminToast.error('Bulk delete failed'); }
          }} id="coupons-bulk-delete"><Trash2 size={13} />Delete Selected ({selectedIds.length})</button>
        }
        emptyTitle="No coupons yet" emptyDescription="Create your first coupon to get started."
        emptyAction={<button className="admin-btn admin-btn-primary admin-btn-sm" onClick={openCreate} id="coupons-empty-create"><Plus size={13} />Create Coupon</button>}
      />

      {/* Form Drawer */}
      <Drawer open={drawerOpen} title={editTarget ? 'Edit Coupon' : 'Create Coupon'} onClose={() => setDrawerOpen(false)}
        footer={<><button className="admin-btn admin-btn-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button><button className="admin-btn admin-btn-primary" onClick={save} disabled={saving} id="coupon-save">{saving && <span className="admin-spinner" style={{ width: 14, height: 14 }} />}Save</button></>}>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-label required" htmlFor="coupon-code">Code</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input id="coupon-code" className="admin-input" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER20" />
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setForm((f) => ({ ...f, code: genCode() }))}>Generate</button>
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-label required" htmlFor="coupon-type">Type</label>
            <select id="coupon-type" className="admin-select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
              <option value="BUY_X_GET_Y">Buy X Get Y</option>
            </select>
          </div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-label required" htmlFor="coupon-value">Discount Value</label>
            <input id="coupon-value" className="admin-input" type="number" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} placeholder={form.type === 'PERCENTAGE' ? '20' : '100'} />
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="coupon-min-order">Min Order (₹)</label>
            <input id="coupon-min-order" className="admin-input" type="number" value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} placeholder="0" />
          </div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="coupon-max-uses">Max Uses</label>
            <input id="coupon-max-uses" className="admin-input" type="number" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} placeholder="Unlimited" />
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="coupon-per-user">Per User Limit</label>
            <input id="coupon-per-user" className="admin-input" type="number" value={form.maxUsesPerUser} onChange={(e) => setForm((f) => ({ ...f, maxUsesPerUser: e.target.value }))} placeholder="Unlimited" />
          </div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="coupon-starts">Starts At</label>
            <input id="coupon-starts" className="admin-input" type="datetime-local" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="coupon-expires">Expires At</label>
            <input id="coupon-expires" className="admin-input" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-label" htmlFor="coupon-description">Description (internal)</label>
          <input id="coupon-description" className="admin-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Summer sale promo" />
        </div>
        <div className="admin-field-row" style={{ marginTop: '8px' }}>
          <label className="admin-toggle" htmlFor="coupon-active">
            <input id="coupon-active" type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked })) } />
            <span className="admin-toggle-slider" />
          </label>
          <span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>Active</span>
        </div>
      </Drawer>

      <ConfirmDialog open={!!deleteTarget} title="Delete Coupon?" description="This will permanently delete the coupon. Orders that used it won't be affected." confirmLabel="Delete" loading={deleteLoading} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
