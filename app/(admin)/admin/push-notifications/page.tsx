// ============================================================
// BLENDIFY — Push Notifications Page  /admin/push-notifications
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Bell, Send, Trash2 } from 'lucide-react';
import { DataTable, Column } from '@/components/admin/ui/DataTable';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { Drawer } from '@/components/admin/ui/Drawer';
import { adminToast } from '@/components/admin/ui/Toast';
import { StatCard } from '@/components/admin/ui/StatCard';

interface PushNotification {
  id: string; title: string; message: string; icon: string | null;
  url: string | null; status: string; sentCount: number; clickCount: number;
  scheduledAt: string | null; sentAt: string | null; createdAt: string;
}

interface FormState { title: string; message: string; icon: string; url: string; scheduledAt: string; }
const DEFAULT_FORM: FormState = { title: '', message: '', icon: '', url: '', scheduledAt: '' };

import { ExportMenu } from '@/components/admin/ui/ExportMenu';
import { handleExportDownload } from '@/lib/hooks/useAdminTable';

export default function PushNotificationsPage() {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25', ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) });
    const res = await fetch(`/api/admin/push-notifications?${params}`);
    const data = await res.json();
    if (data.success) { setNotifications(data.data); setPagination(data.pagination); }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetch_(1); }, [search, statusFilter]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, scheduledAt: form.scheduledAt ? new Date(form.scheduledAt) : null };
      const res = await fetch('/api/admin/push-notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { adminToast.success('Push notification created'); setDrawerOpen(false); fetch_(pagination.page); }
      else adminToast.error(data.error);
    } catch { adminToast.error('Save failed'); }
    setSaving(false);
  };

  const columns: Column<PushNotification>[] = [
    { key: 'title', header: 'Title', sortable: true, cell: (r) => <div><div style={{ fontWeight: 500, fontSize: '13px' }}>{r.title}</div><div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>{r.message}</div></div> },
    { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status.toLowerCase()} /> },
    { key: 'sentCount', header: 'Recipients', cell: (r) => <span style={{ fontWeight: 600 }}>{r.sentCount.toLocaleString()}</span> },
    { key: 'clickCount', header: 'Clicks', cell: (r) => <span style={{ fontSize: '12px' }}>{r.clickCount.toLocaleString()}</span> },
    { key: 'sentAt', header: 'Sent At', cell: (r) => r.sentAt ? <span style={{ fontSize: '12px' }}>{new Date(r.sentAt).toLocaleDateString('en-IN')}</span> : r.scheduledAt ? <span style={{ fontSize: '12px', color: 'var(--admin-warning)' }}>Scheduled {new Date(r.scheduledAt).toLocaleDateString('en-IN')}</span> : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>Draft</span> },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Push Notifications</h1><p className="admin-page-subtitle">Send web push notifications to subscribed customers</p></div>
        <div className="admin-page-actions">
          <ExportMenu onExport={(f) => handleExportDownload(f, 'push-notifications')} id="push-export" />
          <button className="admin-btn admin-btn-primary" onClick={() => { setForm(DEFAULT_FORM); setDrawerOpen(true); }} id="push-create"><Plus size={14} />New Notification</button>
        </div>
      </div>

      <DataTable id="push-table" data={notifications} columns={columns} loading={loading} totalCount={pagination?.total ?? 0} page={pagination?.page ?? 1} limit={pagination?.limit ?? 25} onPageChange={fetch_} selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        toolbar={
          <>
            <div className="admin-search-input-wrap"><Search size={14} /><input id="push-search" className="admin-search-input" placeholder="Search notifications..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select className="admin-select" style={{ height: '32px', width: 'auto', fontSize: '12px', padding: '0 28px 0 10px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} id="push-status-filter">
              <option value="">All Statuses</option><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="SENT">Sent</option>
            </select>
          </>
        }
        emptyTitle="No notifications sent" emptyDescription="Create and send browser push notifications to engage site visitors."
        emptyAction={<button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setDrawerOpen(true)} id="push-empty-create"><Plus size={13} /><Bell size={13} />New Notification</button>}
      />

      <Drawer open={drawerOpen} title="New Push Notification" onClose={() => setDrawerOpen(false)}
        footer={<><button className="admin-btn admin-btn-ghost" onClick={() => setDrawerOpen(false)}>Cancel</button><button className="admin-btn admin-btn-primary" onClick={save} disabled={saving} id="push-save">{saving && <span className="admin-spinner" style={{ width: 14, height: 14 }} />}Send / Schedule</button></>}>
        <div className="admin-form-group"><label className="admin-label required" htmlFor="push-title">Title</label><input id="push-title" className="admin-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Flash Sale Live! ☕" /></div>
        <div className="admin-form-group"><label className="admin-label required" htmlFor="push-message">Message</label><textarea id="push-message" className="admin-textarea" style={{ minHeight: '80px' }} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Get 25% off all specialty blends for the next 6 hours." /></div>
        <div className="admin-form-group"><label className="admin-label" htmlFor="push-url">Target URL</label><input id="push-url" className="admin-input" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="/shop or https://..." /></div>
        <div className="admin-form-group"><label className="admin-label" htmlFor="push-schedule">Schedule At (optional)</label><input id="push-schedule" className="admin-input" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} /></div>
      </Drawer>
    </div>
  );
}
