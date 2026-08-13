// ============================================================
// BLENDIFY — Announcement Bars Page  /admin/announcement-bars
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Megaphone, Trash2, Edit, Eye } from 'lucide-react';
import { DataTable, Column } from '@/components/admin/ui/DataTable';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Drawer } from '@/components/admin/ui/Drawer';
import { ResponsivePreview, AnnouncementBarPreview } from '@/components/admin/ui/ResponsivePreview';
import { adminToast } from '@/components/admin/ui/Toast';

interface AnnouncementBar {
  id: string; message: string; linkUrl: string | null; linkText: string | null;
  backgroundColor: string; textColor: string; isActive: boolean; sortOrder: number;
  startsAt: string | null; endsAt: string | null; createdAt: string;
}

interface FormState {
  message: string; linkUrl: string; linkText: string; backgroundColor: string;
  textColor: string; isActive: boolean; sortOrder: string; startsAt: string; endsAt: string;
}

const DEFAULT_FORM: FormState = {
  message: '☕ Free shipping on orders over ₹1,000!', linkUrl: '/shop', linkText: 'Shop Now',
  backgroundColor: '#111827', textColor: '#ffffff', isActive: true, sortOrder: '0', startsAt: '', endsAt: '',
};

export default function AnnouncementBarsPage() {
  const [bars, setBars] = useState<AnnouncementBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AnnouncementBar | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/announcement-bars');
    const data = await res.json();
    if (data.success) setBars(data.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, []);

  const openCreate = () => { setEditTarget(null); setForm(DEFAULT_FORM); setDrawerOpen(true); };
  const openEdit = (b: AnnouncementBar) => {
    setEditTarget(b);
    setForm({ message: b.message, linkUrl: b.linkUrl ?? '', linkText: b.linkText ?? '', backgroundColor: b.backgroundColor, textColor: b.textColor, isActive: b.isActive, sortOrder: String(b.sortOrder), startsAt: b.startsAt?.slice(0, 16) ?? '', endsAt: b.endsAt?.slice(0, 16) ?? '' });
    setDrawerOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, sortOrder: parseInt(form.sortOrder) || 0, startsAt: form.startsAt ? new Date(form.startsAt) : null, endsAt: form.endsAt ? new Date(form.endsAt) : null };
      const method = editTarget ? 'PATCH' : 'POST';
      const url = editTarget ? `/api/admin/announcement-bars/${editTarget.id}` : '/api/admin/announcement-bars';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { adminToast.success(editTarget ? 'Announcement updated' : 'Announcement created'); setDrawerOpen(false); fetch_(); }
      else adminToast.error(data.error);
    } catch { adminToast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await fetch(`/api/admin/announcement-bars/${deleteTarget}`, { method: 'DELETE' });
    adminToast.success('Announcement deleted'); setDeleteTarget(null); fetch_();
    setDeleteLoading(false);
  };

  const toggleActive = async (b: AnnouncementBar) => {
    await fetch(`/api/admin/announcement-bars/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !b.isActive }) });
    adminToast.success(`Announcement ${b.isActive ? 'deactivated' : 'activated'}`); fetch_();
  };

  const columns: Column<AnnouncementBar>[] = [
    {
      key: 'message', header: 'Bar Preview',
      cell: (r) => (
        <div style={{ padding: '6px 12px', background: r.backgroundColor, color: r.textColor, borderRadius: '4px', fontSize: '12px', fontWeight: 500, display: 'inline-flex', gap: '6px', maxWidth: '380px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          <span>{r.message}</span>
          {r.linkText && <span style={{ textDecoration: 'underline', fontWeight: 600 }}>{r.linkText}</span>}
        </div>
      ),
    },
    { key: 'isActive', header: 'Status', cell: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
    { key: 'sortOrder', header: 'Order', cell: (r) => <span style={{ fontSize: '12px' }}>{r.sortOrder}</span> },
    { key: 'endsAt', header: 'Expires', cell: (r) => r.endsAt ? <span style={{ fontSize: '12px' }}>{new Date(r.endsAt).toLocaleDateString('en-IN')}</span> : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>Never</span> },
    {
      key: 'actions', header: '',
      cell: (r) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => openEdit(r)} id={`ab-edit-${r.id}`}><Edit size={13} /></button>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => toggleActive(r)} id={`ab-toggle-${r.id}`}>{r.isActive ? 'Hide' : 'Show'}</button>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: 'var(--admin-error)' }} onClick={() => setDeleteTarget(r.id)} id={`ab-delete-${r.id}`}><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Announcement Bars</h1><p className="admin-page-subtitle">Manage sticky notification bars displayed at the top of the storefront</p></div>
        <button className="admin-btn admin-btn-primary" onClick={openCreate} id="ab-create"><Plus size={14} />New Announcement</button>
      </div>

      <DataTable id="ab-table" data={bars} columns={columns} loading={loading} totalCount={bars.length} selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        emptyTitle="No announcement bars" emptyDescription="Create sticky top bars to highlight promos, free shipping, or special announcements."
        emptyAction={<button className="admin-btn admin-btn-primary admin-btn-sm" onClick={openCreate} id="ab-empty-create"><Plus size={13} /><Megaphone size={13} />Create Announcement</button>}
      />

      <Drawer open={drawerOpen} title={editTarget ? 'Edit Announcement Bar' : 'New Announcement Bar'} width={580} onClose={() => setDrawerOpen(false)}
        footer={<><button className="admin-btn admin-btn-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button><button className="admin-btn admin-btn-primary" onClick={save} disabled={saving} id="ab-save">{saving && <span className="admin-spinner" style={{ width: 14, height: 14 }} />}Save Bar</button></>}>
        
        {/* Real-time Preview */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '8px' }}>Live Preview</div>
          <ResponsivePreview
            desktopContent={<AnnouncementBarPreview message={form.message} backgroundColor={form.backgroundColor} textColor={form.textColor} linkText={form.linkText} linkUrl={form.linkUrl} />}
            mobileContent={<AnnouncementBarPreview message={form.message} backgroundColor={form.backgroundColor} textColor={form.textColor} linkText={form.linkText} linkUrl={form.linkUrl} mobile />}
          />
        </div>

        <div className="admin-form-group"><label className="admin-label required" htmlFor="ab-msg">Message Text</label><input id="ab-msg" className="admin-input" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="☕ Free shipping on orders over ₹1,000!" /></div>
        <div className="admin-form-row">
          <div className="admin-form-group"><label className="admin-label" htmlFor="ab-link-text">Link Text (optional)</label><input id="ab-link-text" className="admin-input" value={form.linkText} onChange={(e) => setForm((f) => ({ ...f, linkText: e.target.value }))} placeholder="Shop Now" /></div>
          <div className="admin-form-group"><label className="admin-label" htmlFor="ab-link-url">Link URL</label><input id="ab-link-url" className="admin-input" value={form.linkUrl} onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} placeholder="/shop or https://..." /></div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="ab-bg-color">Background Color</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="color" value={form.backgroundColor} onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))} style={{ width: '36px', height: '36px', padding: '2px', border: '1px solid var(--admin-border)', borderRadius: '6px', background: 'none', cursor: 'pointer' }} />
              <input id="ab-bg-color" className="admin-input" value={form.backgroundColor} onChange={(e) => setForm((f) => ({ ...f, backgroundColor: e.target.value }))} />
            </div>
          </div>
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="ab-text-color">Text Color</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="color" value={form.textColor} onChange={(e) => setForm((f) => ({ ...f, textColor: e.target.value }))} style={{ width: '36px', height: '36px', padding: '2px', border: '1px solid var(--admin-border)', borderRadius: '6px', background: 'none', cursor: 'pointer' }} />
              <input id="ab-text-color" className="admin-input" value={form.textColor} onChange={(e) => setForm((f) => ({ ...f, textColor: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group"><label className="admin-label" htmlFor="ab-starts">Starts At</label><input id="ab-starts" className="admin-input" type="datetime-local" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} /></div>
          <div className="admin-form-group"><label className="admin-label" htmlFor="ab-ends">Ends At</label><input id="ab-ends" className="admin-input" type="datetime-local" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} /></div>
        </div>
        <div className="admin-field-row"><label className="admin-toggle" htmlFor="ab-active"><input id="ab-active" type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /><span className="admin-toggle-slider" /></label><span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>Active on Storefront</span></div>
      </Drawer>

      <ConfirmDialog open={!!deleteTarget} title="Delete Announcement Bar?" description="This announcement will be removed from your storefront immediately." confirmLabel="Delete" loading={deleteLoading} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
