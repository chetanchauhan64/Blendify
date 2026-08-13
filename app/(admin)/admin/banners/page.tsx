// ============================================================
// BLENDIFY — Homepage Banners Page  /admin/banners
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Image as ImageIcon, Trash2, Edit } from 'lucide-react';
import { DataTable, Column } from '@/components/admin/ui/DataTable';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Drawer } from '@/components/admin/ui/Drawer';
import { CloudinaryUpload } from '@/components/admin/ui/CloudinaryUpload';
import { ResponsivePreview, BannerPreview } from '@/components/admin/ui/ResponsivePreview';
import { adminToast } from '@/components/admin/ui/Toast';

interface Banner {
  id: string; title: string; subtitle: string | null; desktopImage: string;
  mobileImage: string | null; ctaText: string | null; ctaUrl: string | null;
  position: string; textPosition: string; textColor: string; overlayOpacity: number;
  badge: string | null; isActive: boolean; sortOrder: number; startsAt: string | null;
  endsAt: string | null; createdAt: string;
}

interface FormState {
  title: string; subtitle: string; desktopImage: string; mobileImage: string;
  ctaText: string; ctaUrl: string; position: string; textPosition: 'left' | 'center' | 'right';
  textColor: string; overlayOpacity: string; badge: string; isActive: boolean;
  sortOrder: string; startsAt: string; endsAt: string;
}

const DEFAULT_FORM: FormState = {
  title: 'Artisanal Whole Bean Coffee', subtitle: 'Ethically sourced from single-origin estates across South India',
  desktopImage: '', mobileImage: '', ctaText: 'Explore Collection', ctaUrl: '/shop',
  position: 'HERO', textPosition: 'left', textColor: '#ffffff', overlayOpacity: '0.4',
  badge: 'NEW HARVEST', isActive: true, sortOrder: '0', startsAt: '', endsAt: '',
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Banner | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/banners');
    const data = await res.json();
    if (data.success) setBanners(data.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, []);

  const openCreate = () => { setEditTarget(null); setForm(DEFAULT_FORM); setDrawerOpen(true); };
  const openEdit = (b: Banner) => {
    setEditTarget(b);
    setForm({ title: b.title, subtitle: b.subtitle ?? '', desktopImage: b.desktopImage, mobileImage: b.mobileImage ?? '', ctaText: b.ctaText ?? '', ctaUrl: b.ctaUrl ?? '', position: b.position, textPosition: (b.textPosition as 'left' | 'center' | 'right') || 'left', textColor: b.textColor, overlayOpacity: String(b.overlayOpacity), badge: b.badge ?? '', isActive: b.isActive, sortOrder: String(b.sortOrder), startsAt: b.startsAt?.slice(0, 16) ?? '', endsAt: b.endsAt?.slice(0, 16) ?? '' });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!form.desktopImage) { adminToast.error('Desktop image is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, overlayOpacity: parseFloat(form.overlayOpacity) || 0.4, sortOrder: parseInt(form.sortOrder) || 0, startsAt: form.startsAt ? new Date(form.startsAt) : null, endsAt: form.endsAt ? new Date(form.endsAt) : null };
      const method = editTarget ? 'PATCH' : 'POST';
      const url = editTarget ? `/api/admin/banners/${editTarget.id}` : '/api/admin/banners';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { adminToast.success(editTarget ? 'Banner updated' : 'Banner created'); setDrawerOpen(false); fetch_(); }
      else adminToast.error(data.error);
    } catch { adminToast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await fetch(`/api/admin/banners/${deleteTarget}`, { method: 'DELETE' });
    adminToast.success('Banner deleted'); setDeleteTarget(null); fetch_();
    setDeleteLoading(false);
  };

  const columns: Column<Banner>[] = [
    {
      key: 'desktopImage', header: 'Banner',
      cell: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '80px', height: '40px', borderRadius: '4px', overflow: 'hidden', background: '#222', flexShrink: 0 }}>
            {r.desktopImage ? <img src={r.desktopImage} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}><ImageIcon size={16} /></div>}
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: '13px' }}>{r.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>{r.position} · Order: {r.sortOrder}</div>
          </div>
        </div>
      ),
    },
    { key: 'badge', header: 'Badge', cell: (r) => r.badge ? <span style={{ fontSize: '11px', background: 'var(--admin-surface-overlay)', padding: '2px 8px', borderRadius: '100px' }}>{r.badge}</span> : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>—</span> },
    { key: 'isActive', header: 'Status', cell: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
    { key: 'endsAt', header: 'Expires', cell: (r) => r.endsAt ? <span style={{ fontSize: '12px' }}>{new Date(r.endsAt).toLocaleDateString('en-IN')}</span> : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>Never</span> },
    {
      key: 'actions', header: '',
      cell: (r) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => openEdit(r)} id={`banner-edit-${r.id}`}><Edit size={13} /></button>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: 'var(--admin-error)' }} onClick={() => setDeleteTarget(r.id)} id={`banner-delete-${r.id}`}><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Homepage Banners</h1><p className="admin-page-subtitle">Manage high-impact promotional banners, hero sliders, and marketing sections</p></div>
        <button className="admin-btn admin-btn-primary" onClick={openCreate} id="banner-create"><Plus size={14} />New Banner</button>
      </div>

      <DataTable id="banner-table" data={banners} columns={columns} loading={loading} totalCount={banners.length} selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        emptyTitle="No banners created" emptyDescription="Create hero banners and promotional sections for your homepage."
        emptyAction={<button className="admin-btn admin-btn-primary admin-btn-sm" onClick={openCreate} id="banner-empty-create"><Plus size={13} /><ImageIcon size={13} />Create Banner</button>}
      />

      <Drawer open={drawerOpen} title={editTarget ? 'Edit Banner' : 'New Banner'} width={640} onClose={() => setDrawerOpen(false)}
        footer={<><button className="admin-btn admin-btn-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button><button className="admin-btn admin-btn-primary" onClick={save} disabled={saving} id="banner-save">{saving && <span className="admin-spinner" style={{ width: 14, height: 14 }} />}Save Banner</button></>}>
        
        {/* Real-time Preview */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: '8px' }}>Live Preview</div>
          <ResponsivePreview
            desktopContent={<BannerPreview title={form.title} subtitle={form.subtitle} imageUrl={form.desktopImage} ctaText={form.ctaText} textPosition={form.textPosition} textColor={form.textColor} overlayOpacity={parseFloat(form.overlayOpacity) || 0.4} badge={form.badge} />}
            mobileContent={<BannerPreview title={form.title} subtitle={form.subtitle} imageUrl={form.mobileImage || form.desktopImage} ctaText={form.ctaText} textPosition={form.textPosition} textColor={form.textColor} overlayOpacity={parseFloat(form.overlayOpacity) || 0.4} badge={form.badge} mobile />}
          />
        </div>

        <div className="admin-form-group"><label className="admin-label required" htmlFor="banner-title">Title</label><input id="banner-title" className="admin-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Artisanal Whole Bean Coffee" /></div>
        <div className="admin-form-group"><label className="admin-label" htmlFor="banner-sub">Subtitle</label><input id="banner-sub" className="admin-input" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} placeholder="Ethically sourced single-origin estate coffee" /></div>
        
        <div className="admin-form-row">
          <CloudinaryUpload label="Desktop Image (required)" folder="admin/banners" value={form.desktopImage} onChange={(url) => setForm((f) => ({ ...f, desktopImage: url }))} onRemove={() => setForm((f) => ({ ...f, desktopImage: '' }))} aspectRatio="21/9" id="banner-desktop-img" />
          <CloudinaryUpload label="Mobile Image (optional)" folder="admin/banners" value={form.mobileImage} onChange={(url) => setForm((f) => ({ ...f, mobileImage: url }))} onRemove={() => setForm((f) => ({ ...f, mobileImage: '' }))} aspectRatio="4/3" id="banner-mobile-img" />
        </div>

        <div className="admin-form-row" style={{ marginTop: '12px' }}>
          <div className="admin-form-group"><label className="admin-label" htmlFor="banner-cta-text">CTA Button Text</label><input id="banner-cta-text" className="admin-input" value={form.ctaText} onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))} placeholder="Explore Collection" /></div>
          <div className="admin-form-group"><label className="admin-label" htmlFor="banner-cta-url">CTA Link URL</label><input id="banner-cta-url" className="admin-input" value={form.ctaUrl} onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))} placeholder="/shop or /collections/specialty" /></div>
        </div>

        <div className="admin-form-row">
          <div className="admin-form-group"><label className="admin-label" htmlFor="banner-badge">Badge (optional)</label><input id="banner-badge" className="admin-input" value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} placeholder="NEW HARVEST" /></div>
          <div className="admin-form-group"><label className="admin-label" htmlFor="banner-pos">Position</label><select id="banner-pos" className="admin-select" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}><option value="HERO">Hero Slider</option><option value="MID_PAGE">Mid-Page Banner</option><option value="CATEGORY">Category Top</option><option value="FOOTER_PROMO">Footer Promo</option></select></div>
        </div>

        <div className="admin-form-row">
          <div className="admin-form-group"><label className="admin-label" htmlFor="banner-text-align">Text Alignment</label><select id="banner-text-align" className="admin-select" value={form.textPosition} onChange={(e) => setForm((f) => ({ ...f, textPosition: e.target.value as 'left' | 'center' | 'right' }))}><option value="left">Left Aligned</option><option value="center">Centered</option><option value="right">Right Aligned</option></select></div>
          <div className="admin-form-group"><label className="admin-label" htmlFor="banner-opacity">Overlay Opacity (0 to 1)</label><input id="banner-opacity" className="admin-input" type="number" step="0.1" min="0" max="1" value={form.overlayOpacity} onChange={(e) => setForm((f) => ({ ...f, overlayOpacity: e.target.value }))} /></div>
        </div>

        <div className="admin-field-row"><label className="admin-toggle" htmlFor="banner-active"><input id="banner-active" type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} /><span className="admin-toggle-slider" /></label><span style={{ fontSize: '13px', color: 'var(--admin-text-secondary)' }}>Active</span></div>
      </Drawer>

      <ConfirmDialog open={!!deleteTarget} title="Delete Banner?" description="This banner will be removed from your storefront immediately." confirmLabel="Delete" loading={deleteLoading} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
