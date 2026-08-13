// ============================================================
// BLENDIFY — Bundles Page  /admin/bundles
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Package2, Trash2, Edit } from 'lucide-react';
import { DataTable, Column } from '@/components/admin/ui/DataTable';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Drawer } from '@/components/admin/ui/Drawer';
import { ExportMenu } from '@/components/admin/ui/ExportMenu';
import { CloudinaryUpload } from '@/components/admin/ui/CloudinaryUpload';
import { adminToast } from '@/components/admin/ui/Toast';
import { handleExportDownload } from '@/lib/hooks/useAdminTable';

interface Bundle {
  id: string; slug: string; name: string; description: string | null;
  image: string | null; originalPrice: number; bundlePrice: number;
  savingsPercent: number; isActive: boolean; isFeatured: boolean;
  sortOrder: number; items: Array<{ id: string; quantity: number; product: { name: string }; variant: { name: string } }>;
  createdAt: string;
}

interface FormState {
  name: string; slug: string; description: string; image: string;
  originalPrice: string; bundlePrice: string; savingsPercent: string;
  isActive: boolean; isFeatured: boolean; sortOrder: string;
}

const DEFAULT_FORM: FormState = {
  name: '', slug: '', description: '', image: '', originalPrice: '', bundlePrice: '',
  savingsPercent: '', isActive: true, isFeatured: false, sortOrder: '0',
};

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Bundle | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25', ...(search ? { search } : {}) });
    const res = await fetch(`/api/admin/bundles?${params}`);
    const data = await res.json();
    if (data.success) { setBundles(data.data); setPagination(data.pagination); }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetch_(1); }, [search]);

  const openCreate = () => { setEditTarget(null); setForm(DEFAULT_FORM); setDrawerOpen(true); };
  const openEdit = (b: Bundle) => {
    setEditTarget(b);
    setForm({ name: b.name, slug: b.slug, description: b.description ?? '', image: b.image ?? '', originalPrice: String(b.originalPrice), bundlePrice: String(b.bundlePrice), savingsPercent: String(b.savingsPercent), isActive: b.isActive, isFeatured: b.isFeatured, sortOrder: String(b.sortOrder) });
    setDrawerOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const orig = parseFloat(form.originalPrice) || 0;
      const bndl = parseFloat(form.bundlePrice) || 0;
      const sav = orig > 0 ? ((orig - bndl) / orig) * 100 : 0;

      const payload = { ...form, originalPrice: orig, bundlePrice: bndl, savingsPercent: sav, sortOrder: parseInt(form.sortOrder) || 0, items: [] };
      const method = editTarget ? 'PATCH' : 'POST';
      const url = editTarget ? `/api/admin/bundles/${editTarget.id}` : '/api/admin/bundles';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { adminToast.success(editTarget ? 'Bundle updated' : 'Bundle created'); setDrawerOpen(false); fetch_(pagination.page); }
      else adminToast.error(data.error);
    } catch { adminToast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await fetch(`/api/admin/bundles/${deleteTarget}`, { method: 'DELETE' });
    adminToast.success('Bundle deleted'); setDeleteTarget(null); fetch_(pagination.page);
    setDeleteLoading(false);
  };

  const fmtCurrency = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

  const columns: Column<Bundle>[] = [
    {
      key: 'name', header: 'Bundle Name', sortable: true,
      cell: (r) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '13px' }}>{r.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>/{r.slug} · {r.items.length} items</div>
        </div>
      ),
    },
    { key: 'originalPrice', header: 'Original Price', cell: (r) => <span style={{ textDecoration: 'line-through', color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>{fmtCurrency(r.originalPrice)}</span> },
    { key: 'bundlePrice', header: 'Bundle Price', cell: (r) => <span style={{ fontWeight: 700, color: 'var(--admin-success)' }}>{fmtCurrency(r.bundlePrice)}</span> },
    { key: 'savingsPercent', header: 'Savings', cell: (r) => <span style={{ fontSize: '11px', background: 'var(--admin-success-bg)', color: 'var(--admin-success)', padding: '2px 8px', borderRadius: '100px', fontWeight: 600 }}>Save {r.savingsPercent.toFixed(0)}%</span> },
    { key: 'isActive', header: 'Status', cell: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions', header: '',
      cell: (r) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => openEdit(r)} id={`bundle-edit-${r.id}`}><Edit size={13} /></button>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: 'var(--admin-error)' }} onClick={() => setDeleteTarget(r.id)} id={`bundle-delete-${r.id}`}><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Bundle Offers</h1><p className="admin-page-subtitle">Group multiple products into discounted curated bundles</p></div>
        <div className="admin-page-actions">
          <ExportMenu onExport={(f) => handleExportDownload(f, 'bundles')} id="bundle-export" />
          <button className="admin-btn admin-btn-primary" onClick={openCreate} id="bundle-create"><Plus size={14} />New Bundle</button>
        </div>
      </div>

      <DataTable id="bundle-table" data={bundles} columns={columns} loading={loading} totalCount={pagination?.total ?? 0} page={pagination?.page ?? 1} limit={pagination?.limit ?? 25} onPageChange={fetch_} selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        toolbar={
          <div className="admin-search-input-wrap"><Search size={14} /><input id="bundle-search" className="admin-search-input" placeholder="Search bundles..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        }
        emptyTitle="No product bundles" emptyDescription="Create curated coffee bundles with combined discount pricing."
        emptyAction={<button className="admin-btn admin-btn-primary admin-btn-sm" onClick={openCreate} id="bundle-empty-create"><Plus size={13} /><Package2 size={13} />Create Bundle</button>}
      />

      <Drawer open={drawerOpen} title={editTarget ? 'Edit Bundle' : 'New Bundle'} width={580} onClose={() => setDrawerOpen(false)}
        footer={<><button className="admin-btn admin-btn-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button><button className="admin-btn admin-btn-primary" onClick={save} disabled={saving} id="bundle-save">{saving && <span className="admin-spinner" style={{ width: 14, height: 14 }} />}Save Bundle</button></>}>
        <div className="admin-form-group"><label className="admin-label required" htmlFor="bundle-name">Bundle Name</label><input id="bundle-name" className="admin-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))} placeholder="Starter Brewer Bundle" /></div>
        <div className="admin-form-group"><label className="admin-label required" htmlFor="bundle-slug">URL Slug</label><input id="bundle-slug" className="admin-input" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="starter-brewer-bundle" /></div>
        <div className="admin-form-group"><label className="admin-label" htmlFor="bundle-desc">Description</label><textarea id="bundle-desc" className="admin-textarea" style={{ minHeight: '70px' }} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Curated set of whole bean bags + French press..." /></div>

        <div className="admin-form-row">
          <div className="admin-form-group"><label className="admin-label required" htmlFor="bundle-orig-price">Original Total Price (₹)</label><input id="bundle-orig-price" className="admin-input" type="number" value={form.originalPrice} onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))} placeholder="2400" /></div>
          <div className="admin-form-group"><label className="admin-label required" htmlFor="bundle-bndl-price">Bundle Discount Price (₹)</label><input id="bundle-bndl-price" className="admin-input" type="number" value={form.bundlePrice} onChange={(e) => setForm((f) => ({ ...f, bundlePrice: e.target.value }))} placeholder="1999" /></div>
        </div>

        <CloudinaryUpload label="Bundle Image" folder="admin/bundles" value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} onRemove={() => setForm((f) => ({ ...f, image: '' }))} aspectRatio="1/1" id="bundle-img" />

        <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
          <div className="admin-field-row"><label className="admin-toggle" htmlFor="bundle-active"><input id="bundle-active" type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /><span className="admin-toggle-slider" /></label><span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>Active</span></div>
          <div className="admin-field-row"><label className="admin-toggle" htmlFor="bundle-feat"><input id="bundle-feat" type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} /><span className="admin-toggle-slider" /></label><span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>Featured</span></div>
        </div>
      </Drawer>

      <ConfirmDialog open={!!deleteTarget} title="Delete Bundle?" description="This will permanently delete the bundle offer." confirmLabel="Delete" loading={deleteLoading} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
