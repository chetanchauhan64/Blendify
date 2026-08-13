// ============================================================
// BLENDIFY — Discount Engine Page  /admin/discounts
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Trash2, Edit, Zap } from 'lucide-react';
import { DataTable, Column } from '@/components/admin/ui/DataTable';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Drawer } from '@/components/admin/ui/Drawer';
import { ExportMenu } from '@/components/admin/ui/ExportMenu';
import { adminToast } from '@/components/admin/ui/Toast';
import { handleExportDownload } from '@/lib/hooks/useAdminTable';

interface DiscountRule {
  id: string; name: string; type: string; discountType: string; discountValue: number;
  priority: number; isActive: boolean; startsAt: string | null; endsAt: string | null;
  usedCount: number; createdAt: string;
}

interface FormState {
  name: string; description: string; type: string; discountType: string; discountValue: string;
  minOrderAmount: string; maxDiscountAmount: string; usageLimit: string; priority: string;
  isActive: boolean; isAutoApply: boolean; isStackable: boolean; startsAt: string; endsAt: string;
}

const DEFAULT_FORM: FormState = { name: '', description: '', type: 'ORDER', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '', maxDiscountAmount: '', usageLimit: '', priority: '0', isActive: true, isAutoApply: false, isStackable: false, startsAt: '', endsAt: '' };

export default function DiscountsPage() {
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DiscountRule | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25', ...(search ? { search } : {}), ...(isActive ? { isActive } : {}) });
    const res = await fetch(`/api/admin/discounts?${params}`);
    const data = await res.json();
    if (data.success) { setRules(data.data); setPagination(data.pagination); }
    setLoading(false);
  }, [search, isActive]);

  useEffect(() => { fetch_(1); }, [search, isActive]);

  const openCreate = () => { setEditTarget(null); setForm(DEFAULT_FORM); setDrawerOpen(true); };
  const openEdit = (r: DiscountRule) => {
    setEditTarget(r);
    setForm({ name: r.name, description: '', type: r.type, discountType: r.discountType, discountValue: String(r.discountValue), minOrderAmount: '', maxDiscountAmount: '', usageLimit: '', priority: String(r.priority), isActive: r.isActive, isAutoApply: false, isStackable: false, startsAt: r.startsAt?.slice(0, 16) ?? '', endsAt: r.endsAt?.slice(0, 16) ?? '' });
    setDrawerOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, discountValue: parseFloat(form.discountValue), minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null, maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : null, usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null, priority: parseInt(form.priority) || 0, startsAt: form.startsAt ? new Date(form.startsAt) : null, endsAt: form.endsAt ? new Date(form.endsAt) : null, conditions: {}, rewards: [] };
      const method = editTarget ? 'PATCH' : 'POST';
      const url = editTarget ? `/api/admin/discounts/${editTarget.id}` : '/api/admin/discounts';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { adminToast.success(editTarget ? 'Rule updated' : 'Rule created'); setDrawerOpen(false); fetch_(pagination.page); }
      else adminToast.error(data.error);
    } catch { adminToast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await fetch(`/api/admin/discounts/${deleteTarget}`, { method: 'DELETE' });
    adminToast.success('Discount rule deleted'); setDeleteTarget(null); fetch_(pagination.page);
    setDeleteLoading(false);
  };

  const columns: Column<DiscountRule>[] = [
    { key: 'name', header: 'Rule Name', sortable: true, cell: (r) => <div style={{ fontWeight: 500, fontSize: '13px' }}>{r.name}</div> },
    { key: 'type', header: 'Type', cell: (r) => <span style={{ fontSize: '12px', background: 'var(--admin-surface-overlay)', padding: '2px 8px', borderRadius: '100px' }}>{r.type}</span> },
    { key: 'discount', header: 'Discount', cell: (r) => <span style={{ fontWeight: 600 }}>{r.discountType === 'PERCENTAGE' ? `${r.discountValue}%` : `₹${r.discountValue}`}</span> },
    { key: 'priority', header: 'Priority', sortable: true, cell: (r) => <span style={{ fontWeight: 500 }}>{r.priority}</span> },
    { key: 'usedCount', header: 'Uses', cell: (r) => <span style={{ fontSize: '12px' }}>{r.usedCount}</span> },
    { key: 'isActive', header: 'Status', cell: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
    { key: 'endsAt', header: 'Ends', cell: (r) => r.endsAt ? <span style={{ fontSize: '12px' }}>{new Date(r.endsAt).toLocaleDateString('en-IN')}</span> : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>Never</span> },
    {
      key: 'actions', header: '',
      cell: (r) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => openEdit(r)} id={`disc-edit-${r.id}`}><Edit size={13} /></button>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: 'var(--admin-error)' }} onClick={() => setDeleteTarget(r.id)} id={`disc-delete-${r.id}`}><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Discount Engine</h1><p className="admin-page-subtitle">Automated discount rules applied at checkout based on configurable conditions</p></div>
        <div className="admin-page-actions">
          <ExportMenu onExport={(f) => handleExportDownload(f, 'discounts')} id="disc-export" />
          <button className="admin-btn admin-btn-primary" onClick={openCreate} id="disc-create"><Plus size={14} />New Rule</button>
        </div>
      </div>

      <DataTable id="disc-table" data={rules} columns={columns} loading={loading} totalCount={pagination?.total ?? 0} page={pagination?.page ?? 1} limit={pagination?.limit ?? 25} onPageChange={fetch_} selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        toolbar={
          <>
            <div className="admin-search-input-wrap"><Search size={14} /><input id="disc-search" className="admin-search-input" placeholder="Search rules..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select className="admin-select" style={{ height: '32px', width: 'auto', fontSize: '12px', padding: '0 28px 0 10px' }} value={isActive} onChange={(e) => setIsActive(e.target.value)} id="disc-status-filter">
              <option value="">All</option><option value="true">Active</option><option value="false">Inactive</option>
            </select>
          </>
        }
        emptyTitle="No discount rules yet" emptyDescription="Create automatic discount rules that apply at checkout."
        emptyAction={<button className="admin-btn admin-btn-primary admin-btn-sm" onClick={openCreate} id="disc-empty-create"><Plus size={13} /><Zap size={13} />Create Rule</button>}
      />

      <Drawer open={drawerOpen} title={editTarget ? 'Edit Discount Rule' : 'New Discount Rule'} onClose={() => setDrawerOpen(false)}
        footer={<><button className="admin-btn admin-btn-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button><button className="admin-btn admin-btn-primary" onClick={save} disabled={saving} id="disc-save">{saving && <span className="admin-spinner" style={{ width: 14, height: 14 }} />}Save</button></>}>
        <div className="admin-form-group"><label className="admin-label required" htmlFor="disc-name">Rule Name</label><input id="disc-name" className="admin-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Spend ₹2000, Get 15% Off" /></div>
        <div className="admin-form-group"><label className="admin-label" htmlFor="disc-desc">Description</label><input id="disc-desc" className="admin-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Internal description" /></div>
        <div className="admin-form-row">
          <div className="admin-form-group"><label className="admin-label required" htmlFor="disc-type">Rule Type</label><select id="disc-type" className="admin-select" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}><option value="ORDER">Order Total</option><option value="PRODUCT">Specific Products</option><option value="CATEGORY">Category</option><option value="CUSTOMER">Customer Segment</option><option value="BUY_X_GET_Y">Buy X Get Y</option><option value="BUNDLE">Bundle</option></select></div>
          <div className="admin-form-group"><label className="admin-label required" htmlFor="disc-disc-type">Discount Type</label><select id="disc-disc-type" className="admin-select" value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed Amount</option><option value="FREE_SHIPPING">Free Shipping</option></select></div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group"><label className="admin-label required" htmlFor="disc-value">Discount Value</label><input id="disc-value" className="admin-input" type="number" value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} placeholder="15" /></div>
          <div className="admin-form-group"><label className="admin-label" htmlFor="disc-min">Min Order (₹)</label><input id="disc-min" className="admin-input" type="number" value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} placeholder="0" /></div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group"><label className="admin-label" htmlFor="disc-max-discount">Max Discount (₹)</label><input id="disc-max-discount" className="admin-input" type="number" value={form.maxDiscountAmount} onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))} placeholder="Unlimited" /></div>
          <div className="admin-form-group"><label className="admin-label" htmlFor="disc-priority">Priority</label><input id="disc-priority" className="admin-input" type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} placeholder="0 = lowest" /></div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group"><label className="admin-label" htmlFor="disc-starts">Starts At</label><input id="disc-starts" className="admin-input" type="datetime-local" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} /></div>
          <div className="admin-form-group"><label className="admin-label" htmlFor="disc-ends">Ends At</label><input id="disc-ends" className="admin-input" type="datetime-local" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} /></div>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '4px' }}>
          {[['isActive', 'Active'], ['isAutoApply', 'Auto-apply'], ['isStackable', 'Stackable with other discounts']].map(([key, label]) => (
            <div key={key} className="admin-field-row"><label className="admin-toggle" htmlFor={`disc-toggle-${key}`}><input id={`disc-toggle-${key}`} type="checkbox" checked={(form as unknown as Record<string, boolean>)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} /><span className="admin-toggle-slider" /></label><span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>{label}</span></div>
          ))}
        </div>
      </Drawer>

      <ConfirmDialog open={!!deleteTarget} title="Delete Discount Rule?" description="This rule will be permanently removed and won't apply at checkout anymore." confirmLabel="Delete" loading={deleteLoading} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
