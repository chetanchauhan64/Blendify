// ============================================================
// BLENDIFY — Popup Campaigns Page  /admin/popups
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Layers, Trash2, Edit } from 'lucide-react';
import { DataTable, Column } from '@/components/admin/ui/DataTable';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Drawer } from '@/components/admin/ui/Drawer';
import { CloudinaryUpload } from '@/components/admin/ui/CloudinaryUpload';
import { adminToast } from '@/components/admin/ui/Toast';

interface Popup {
  id: string; name: string; title: string; subtitle: string | null;
  triggerType: string; triggerValue: number | null; delaySeconds: number;
  couponCode: string | null; image: string | null; isActive: boolean;
  viewCount: number; conversionCount: number; createdAt: string;
}

interface FormState {
  name: string; title: string; subtitle: string; triggerType: string;
  triggerValue: string; delaySeconds: string; couponCode: string; image: string;
  isActive: boolean;
}

const DEFAULT_FORM: FormState = {
  name: 'Welcome 10% Off Popup', title: 'Unlock 10% Off Your First Order',
  subtitle: 'Subscribe to our newsletter and receive a secret discount code instantly.',
  triggerType: 'DELAY', triggerValue: '5', delaySeconds: '3', couponCode: 'WELCOME10',
  image: '', isActive: true,
};

export default function PopupsPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Popup | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/popups');
    const data = await res.json();
    if (data.success) setPopups(data.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, []);

  const openCreate = () => { setEditTarget(null); setForm(DEFAULT_FORM); setDrawerOpen(true); };
  const openEdit = (p: Popup) => {
    setEditTarget(p);
    setForm({ name: p.name, title: p.title, subtitle: p.subtitle ?? '', triggerType: p.triggerType, triggerValue: String(p.triggerValue ?? ''), delaySeconds: String(p.delaySeconds), couponCode: p.couponCode ?? '', image: p.image ?? '', isActive: p.isActive });
    setDrawerOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, triggerValue: form.triggerValue ? parseFloat(form.triggerValue) : null, delaySeconds: parseInt(form.delaySeconds) || 0 };
      const method = editTarget ? 'PATCH' : 'POST';
      const url = editTarget ? `/api/admin/popups/${editTarget.id}` : '/api/admin/popups';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { adminToast.success(editTarget ? 'Popup updated' : 'Popup created'); setDrawerOpen(false); fetch_(); }
      else adminToast.error(data.error);
    } catch { adminToast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await fetch(`/api/admin/popups/${deleteTarget}`, { method: 'DELETE' });
    adminToast.success('Popup deleted'); setDeleteTarget(null); fetch_();
    setDeleteLoading(false);
  };

  const convRate = (p: Popup) => p.viewCount > 0 ? ((p.conversionCount / p.viewCount) * 100).toFixed(1) : '0';

  const columns: Column<Popup>[] = [
    { key: 'name', header: 'Popup Name', sortable: true, cell: (r) => <div><div style={{ fontWeight: 500, fontSize: '13px' }}>{r.name}</div><div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>{r.title}</div></div> },
    { key: 'triggerType', header: 'Trigger', cell: (r) => <span style={{ fontSize: '12px', background: 'var(--admin-surface-overlay)', padding: '2px 8px', borderRadius: '100px' }}>{r.triggerType.replace(/_/g, ' ')}</span> },
    { key: 'isActive', header: 'Status', cell: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
    { key: 'viewCount', header: 'Views', cell: (r) => <span style={{ fontSize: '12px' }}>{r.viewCount.toLocaleString()}</span> },
    { key: 'conversionCount', header: 'Conversions', cell: (r) => <span style={{ fontWeight: 600, color: 'var(--admin-success)' }}>{r.conversionCount.toLocaleString()}</span> },
    { key: 'rate', header: 'Conv. Rate', cell: (r) => <span>{convRate(r)}%</span> },
    {
      key: 'actions', header: '',
      cell: (r) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => openEdit(r)} id={`popup-edit-${r.id}`}><Edit size={13} /></button>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: 'var(--admin-error)' }} onClick={() => setDeleteTarget(r.id)} id={`popup-delete-${r.id}`}><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Popup Campaigns</h1><p className="admin-page-subtitle">Configure modal popups for newsletter signups, exit intent, and promotional offers</p></div>
        <button className="admin-btn admin-btn-primary" onClick={openCreate} id="popup-create"><Plus size={14} />New Popup</button>
      </div>

      <DataTable id="popup-table" data={popups} columns={columns} loading={loading} totalCount={popups.length} selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        emptyTitle="No popups created" emptyDescription="Create popups to capture emails and boost sales conversions."
        emptyAction={<button className="admin-btn admin-btn-primary admin-btn-sm" onClick={openCreate} id="popup-empty-create"><Plus size={13} /><Layers size={13} />Create Popup</button>}
      />

      <Drawer open={drawerOpen} title={editTarget ? 'Edit Popup' : 'New Popup'} width={580} onClose={() => setDrawerOpen(false)}
        footer={<><button className="admin-btn admin-btn-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button><button className="admin-btn admin-btn-primary" onClick={save} disabled={saving} id="popup-save">{saving && <span className="admin-spinner" style={{ width: 14, height: 14 }} />}Save Popup</button></>}>
        <div className="admin-form-group"><label className="admin-label required" htmlFor="popup-name">Campaign Name</label><input id="popup-name" className="admin-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Welcome 10% Off Popup" /></div>
        <div className="admin-form-group"><label className="admin-label required" htmlFor="popup-title">Popup Heading</label><input id="popup-title" className="admin-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Unlock 10% Off Your First Order" /></div>
        <div className="admin-form-group"><label className="admin-label" htmlFor="popup-sub">Subtitle Text</label><textarea id="popup-sub" className="admin-textarea" style={{ minHeight: '60px' }} value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} placeholder="Subscribe to get a secret code..." /></div>
        
        <div className="admin-form-row">
          <div className="admin-form-group"><label className="admin-label required" htmlFor="popup-trigger">Trigger Condition</label><select id="popup-trigger" className="admin-select" value={form.triggerType} onChange={(e) => setForm((f) => ({ ...f, triggerType: e.target.value }))}><option value="DELAY">Time Delay (seconds)</option><option value="EXIT_INTENT">Exit Intent (cursor move)</option><option value="SCROLL_PERCENT">Scroll Percentage</option><option value="PAGE_VIEWS">Page Views Count</option></select></div>
          <div className="admin-form-group"><label className="admin-label" htmlFor="popup-trig-val">Trigger Value</label><input id="popup-trig-val" className="admin-input" type="number" value={form.triggerValue} onChange={(e) => setForm((f) => ({ ...f, triggerValue: e.target.value }))} placeholder="5" /></div>
        </div>

        <div className="admin-form-group"><label className="admin-label" htmlFor="popup-coupon">Auto-Assign Coupon Code</label><input id="popup-coupon" className="admin-input" value={form.couponCode} onChange={(e) => setForm((f) => ({ ...f, couponCode: e.target.value.toUpperCase() }))} placeholder="WELCOME10" /></div>
        
        <CloudinaryUpload label="Popup Image (optional)" folder="admin/popups" value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} onRemove={() => setForm((f) => ({ ...f, image: '' }))} aspectRatio="1/1" id="popup-img" />

        <div className="admin-field-row" style={{ marginTop: '12px' }}><label className="admin-toggle" htmlFor="popup-active"><input id="popup-active" type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /><span className="admin-toggle-slider" /></label><span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>Active</span></div>
      </Drawer>

      <ConfirmDialog open={!!deleteTarget} title="Delete Popup?" description="This popup will stop appearing to visitors immediately." confirmLabel="Delete" loading={deleteLoading} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
