// ============================================================
// BLENDIFY — Email Campaigns Page  /admin/email-campaigns
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Send, Trash2, Edit, BarChart2 } from 'lucide-react';
import { DataTable, Column } from '@/components/admin/ui/DataTable';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { StatCard } from '@/components/admin/ui/StatCard';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Drawer } from '@/components/admin/ui/Drawer';
import { ExportMenu } from '@/components/admin/ui/ExportMenu';
import { adminToast } from '@/components/admin/ui/Toast';
import { handleExportDownload } from '@/lib/hooks/useAdminTable';

interface Campaign {
  id: string; name: string; subject: string; targetType: string; status: string;
  scheduledAt: string | null; sentAt: string | null; sentCount: number;
  openCount: number; clickCount: number; failedCount: number; createdAt: string;
}

interface FormState { name: string; subject: string; htmlBody: string; textBody: string; targetType: string; scheduledAt: string; }
const DEFAULT_FORM: FormState = { name: '', subject: '', htmlBody: '', textBody: '', targetType: 'ALL', scheduledAt: '' };

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<{ total: number; draft: number; scheduled: number; sent: number; failed: number; totalEmailsSent: number; avgOpenRate: number; avgClickRate: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Campaign | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetch_ = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25', ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) });
    const res = await fetch(`/api/admin/email-campaigns?${params}`);
    const data = await res.json();
    if (data.success) { setCampaigns(data.data); setPagination(data.pagination); }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetch_(1); }, [search, statusFilter]);

  const send = async (id: string) => {
    setSending(id);
    try {
      const res = await fetch(`/api/admin/email-campaigns/${id}/send`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        adminToast.success(`Sent to ${data.data.sent} recipients${data.data.simulated ? ' (simulated — add RESEND_API_KEY to send live)' : ''}`);
        fetch_(pagination.page);
      } else adminToast.error(data.error);
    } catch { adminToast.error('Send failed'); }
    setSending(null);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, targetTags: [], scheduledAt: form.scheduledAt ? new Date(form.scheduledAt) : undefined };
      const method = editTarget ? 'PATCH' : 'POST';
      const url = editTarget ? `/api/admin/email-campaigns/${editTarget.id}` : '/api/admin/email-campaigns';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { adminToast.success(editTarget ? 'Campaign updated' : 'Campaign created'); setDrawerOpen(false); fetch_(pagination.page); }
      else adminToast.error(data.error);
    } catch { adminToast.error('Save failed'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await fetch(`/api/admin/email-campaigns/${deleteTarget}`, { method: 'DELETE' });
    adminToast.success('Campaign deleted'); setDeleteTarget(null); fetch_(pagination.page);
    setDeleteLoading(false);
  };

  const openRate = (c: Campaign) => c.sentCount > 0 ? ((c.openCount / c.sentCount) * 100).toFixed(1) : '—';
  const clickRate = (c: Campaign) => c.sentCount > 0 ? ((c.clickCount / c.sentCount) * 100).toFixed(1) : '—';

  const columns: Column<Campaign>[] = [
    { key: 'name', header: 'Campaign', sortable: true, cell: (r) => <div><div style={{ fontWeight: 500, fontSize: '13px' }}>{r.name}</div><div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>{r.subject}</div></div> },
    { key: 'targetType', header: 'Audience', cell: (r) => <span style={{ fontSize: '12px', background: 'var(--admin-surface-overlay)', padding: '2px 8px', borderRadius: '100px' }}>{r.targetType}</span> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status.toLowerCase()} /> },
    { key: 'sentCount', header: 'Sent', sortable: true, cell: (r) => <span style={{ fontWeight: 600 }}>{r.sentCount.toLocaleString()}</span> },
    { key: 'openRate', header: 'Open Rate', cell: (r) => <span style={{ fontSize: '13px' }}>{openRate(r)}{r.sentCount > 0 ? '%' : ''}</span> },
    { key: 'clickRate', header: 'Click Rate', cell: (r) => <span style={{ fontSize: '13px' }}>{clickRate(r)}{r.sentCount > 0 ? '%' : ''}</span> },
    { key: 'sentAt', header: 'Sent At', cell: (r) => r.sentAt ? <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>{new Date(r.sentAt).toLocaleDateString('en-IN')}</span> : r.scheduledAt ? <span style={{ fontSize: '12px', color: 'var(--admin-warning)' }}>Scheduled {new Date(r.scheduledAt).toLocaleDateString('en-IN')}</span> : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>—</span> },
    {
      key: 'actions', header: '',
      cell: (r) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          {['DRAFT', 'SCHEDULED'].includes(r.status) && (
            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => send(r.id)} disabled={sending === r.id} id={`campaign-send-${r.id}`}>
              {sending === r.id ? <span className="admin-spinner" style={{ width: 12, height: 12 }} /> : <Send size={12} />}Send
            </button>
          )}
          {['DRAFT', 'SCHEDULED'].includes(r.status) && (
            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => { setEditTarget(r); setForm({ name: r.name, subject: r.subject, htmlBody: '', textBody: '', targetType: r.targetType, scheduledAt: r.scheduledAt?.slice(0, 16) ?? '' }); setDrawerOpen(true); }} id={`campaign-edit-${r.id}`}><Edit size={13} /></button>
          )}
          <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: 'var(--admin-error)' }} onClick={() => setDeleteTarget(r.id)} id={`campaign-delete-${r.id}`}><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Email Campaigns</h1><p className="admin-page-subtitle">Create, schedule, and send email campaigns via Resend</p></div>
        <div className="admin-page-actions">
          <ExportMenu onExport={(f) => handleExportDownload(f, 'email-campaigns')} id="campaigns-export" />
          <button className="admin-btn admin-btn-primary" onClick={() => { setEditTarget(null); setForm(DEFAULT_FORM); setDrawerOpen(true); }} id="campaigns-create"><Plus size={14} />New Campaign</button>
        </div>
      </div>

      {analytics && (
        <div className="admin-stat-grid" style={{ marginBottom: '24px' }}>
          <StatCard id="cam-total" label="Total Campaigns" value={analytics.total ?? 0} iconVariant="accent" />
          <StatCard id="cam-sent" label="Emails Sent" value={(analytics.totalEmailsSent ?? 0).toLocaleString()} iconVariant="success" />
          <StatCard id="cam-open" label="Avg Open Rate" value={`${(analytics.avgOpenRate ?? 0).toFixed(1)}%`} iconVariant="info" />
          <StatCard id="cam-click" label="Avg Click Rate" value={`${(analytics.avgClickRate ?? 0).toFixed(1)}%`} iconVariant="warning" />
        </div>
      )}

      <DataTable id="campaigns-table" data={campaigns} columns={columns} loading={loading} totalCount={pagination?.total ?? 0} page={pagination?.page ?? 1} limit={pagination?.limit ?? 25} onPageChange={fetch_} selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        toolbar={
          <>
            <div className="admin-search-input-wrap"><Search size={14} /><input id="campaigns-search" className="admin-search-input" placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select className="admin-select" style={{ height: '32px', width: 'auto', fontSize: '12px', padding: '0 28px 0 10px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} id="campaigns-status-filter">
              <option value="">All Statuses</option><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="SENT">Sent</option><option value="FAILED">Failed</option>
            </select>
          </>
        }
        emptyTitle="No email campaigns yet" emptyDescription="Create your first email campaign to engage with your subscribers."
        emptyAction={<button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setDrawerOpen(true)} id="campaigns-empty-create"><Plus size={13} />Create Campaign</button>}
      />

      <Drawer open={drawerOpen} title={editTarget ? 'Edit Campaign' : 'New Campaign'} width={600} onClose={() => setDrawerOpen(false)}
        footer={<><button className="admin-btn admin-btn-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button><button className="admin-btn admin-btn-primary" onClick={save} disabled={saving} id="campaign-save">{saving && <span className="admin-spinner" style={{ width: 14, height: 14 }} />}Save</button></>}>
        <div className="admin-form-group"><label className="admin-label required" htmlFor="cam-name">Campaign Name</label><input id="cam-name" className="admin-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Spring Newsletter" /></div>
        <div className="admin-form-group"><label className="admin-label required" htmlFor="cam-subject">Email Subject</label><input id="cam-subject" className="admin-input" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="Your Spring Blends Are Here ☕" /></div>
        <div className="admin-form-group">
          <label className="admin-label required" htmlFor="cam-audience">Target Audience</label>
          <select id="cam-audience" className="admin-select" value={form.targetType} onChange={(e) => setForm((f) => ({ ...f, targetType: e.target.value }))}>
            <option value="ALL">All Subscribers</option>
            <option value="TAG">By Tag</option>
            <option value="ACTIVE">Active Customers</option>
            <option value="INACTIVE">Inactive Customers</option>
            <option value="VIP">VIP / Gold+ Tier</option>
          </select>
        </div>
        <div className="admin-form-group"><label className="admin-label" htmlFor="cam-schedule">Schedule At (leave blank to save as draft)</label><input id="cam-schedule" className="admin-input" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} /></div>
        <div className="admin-form-group">
          <label className="admin-label required" htmlFor="cam-html">HTML Body</label>
          <textarea id="cam-html" className="admin-textarea" style={{ minHeight: '200px', fontFamily: 'var(--admin-font-mono)', fontSize: '12px' }} value={form.htmlBody} onChange={(e) => setForm((f) => ({ ...f, htmlBody: e.target.value }))} placeholder="<html><body><h1>Hello {{firstName}}</h1>...</body></html>" />
        </div>
        <div className="admin-form-group"><label className="admin-label" htmlFor="cam-text">Plain Text Version</label><textarea id="cam-text" className="admin-textarea" style={{ minHeight: '80px' }} value={form.textBody} onChange={(e) => setForm((f) => ({ ...f, textBody: e.target.value }))} placeholder="Plain text fallback..." /></div>
        <div style={{ padding: '12px', background: 'var(--admin-info-bg)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '8px', fontSize: '12px', color: 'var(--admin-info)' }}>
          ℹ️ Email delivery requires <code style={{ fontFamily: 'var(--admin-font-mono)' }}>RESEND_API_KEY</code> environment variable. Without it, campaigns are tracked but emails are not sent.
        </div>
      </Drawer>

      <ConfirmDialog open={!!deleteTarget} title="Delete Campaign?" description="This will permanently delete the campaign. Sent metrics will be lost." confirmLabel="Delete" loading={deleteLoading} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
