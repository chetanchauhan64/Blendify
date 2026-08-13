// ============================================================
// BLENDIFY — Newsletter Page  /admin/newsletter
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Download, Mail, Users, UserX, Trash2 } from 'lucide-react';
import { DataTable, Column } from '@/components/admin/ui/DataTable';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { StatCard } from '@/components/admin/ui/StatCard';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { ExportMenu } from '@/components/admin/ui/ExportMenu';
import { adminToast } from '@/components/admin/ui/Toast';
import { handleExportDownload } from '@/lib/hooks/useAdminTable';

interface Subscriber {
  id: string; email: string; firstName: string | null; lastName: string | null;
  isActive: boolean; source: string | null; tags: string[]; subscribedAt: string;
  unsubscribedAt: string | null;
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ action: string; ids: string[] } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState<{ total: number; active: number; inactive: number } | null>(null);

  const fetch_ = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25', ...(search ? { search } : {}), ...(isActive ? { isActive } : {}) });
    const res = await fetch(`/api/admin/newsletter?${params}`);
    const data = await res.json();
    if (data.success) {
      setSubscribers(data.data);
      setPagination(data.pagination);
      if (!stats) setStats({ total: data.pagination.total, active: data.data.filter((s: Subscriber) => s.isActive).length, inactive: data.data.filter((s: Subscriber) => !s.isActive).length });
    }
    setLoading(false);
  }, [search, isActive]);

  useEffect(() => { fetch_(1); }, [search, isActive]);

  const execAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(confirmAction) });
      const data = await res.json();
      if (data.success) {
        adminToast.success(`${data.affected} subscriber(s) ${confirmAction.action}d`);
        setSelectedIds([]); setConfirmAction(null); fetch_(pagination.page);
      } else adminToast.error(data.error);
    } catch { adminToast.error('Action failed'); }
    setActionLoading(false);
  };

  const columns: Column<Subscriber>[] = [
    {
      key: 'email', header: 'Email', sortable: true,
      cell: (r) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '13px' }}>{r.email}</div>
          {(r.firstName || r.lastName) && <div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>{[r.firstName, r.lastName].filter(Boolean).join(' ')}</div>}
        </div>
      ),
    },
    { key: 'isActive', header: 'Status', cell: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
    { key: 'source', header: 'Source', cell: (r) => r.source ? <span style={{ fontSize: '12px', background: 'var(--admin-surface-overlay)', padding: '2px 8px', borderRadius: '100px' }}>{r.source}</span> : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>—</span> },
    {
      key: 'tags', header: 'Tags',
      cell: (r) => r.tags.length > 0
        ? <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{r.tags.map((t) => <span key={t} style={{ fontSize: '10px', background: 'var(--admin-accent-dim)', color: 'var(--admin-accent)', padding: '1px 6px', borderRadius: '100px' }}>{t}</span>)}</div>
        : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>—</span>,
    },
    { key: 'subscribedAt', header: 'Subscribed', sortable: true, cell: (r) => <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>{new Date(r.subscribedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span> },
  ];

  const bulkActions = (
    <>
      <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setConfirmAction({ action: 'unsubscribe', ids: selectedIds })} id="nl-bulk-unsub"><UserX size={13} />Unsubscribe</button>
      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => setConfirmAction({ action: 'delete', ids: selectedIds })} id="nl-bulk-delete"><Trash2 size={13} />Delete</button>
    </>
  );

  return (
    <div>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">Newsletter</h1><p className="admin-page-subtitle">Manage subscribers, tags, and export lists for campaigns</p></div>
        <div className="admin-page-actions">
          <ExportMenu onExport={(f) => handleExportDownload(f, 'newsletter')} id="nl-export" />
          <a className="admin-btn admin-btn-primary" href="/admin/email-campaigns" id="nl-create-campaign"><Mail size={14} />Create Campaign</a>
        </div>
      </div>

      {stats && (
        <div className="admin-stat-grid" style={{ marginBottom: '24px' }}>
          <StatCard id="nl-total" label="Total Subscribers" value={pagination.total} icon={<Users size={16} />} iconVariant="accent" loading={loading} />
          <StatCard id="nl-active" label="Active" value={subscribers.filter((s) => s.isActive).length} icon={<Users size={16} />} iconVariant="success" loading={loading} />
          <StatCard id="nl-inactive" label="Unsubscribed" value={subscribers.filter((s) => !s.isActive).length} icon={<UserX size={16} />} iconVariant="error" loading={loading} />
        </div>
      )}

      <DataTable id="nl-table" data={subscribers} columns={columns} loading={loading} totalCount={pagination?.total ?? 0} page={pagination?.page ?? 1} limit={pagination?.limit ?? 25} onPageChange={fetch_} selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds} bulkActions={bulkActions}
        toolbar={
          <>
            <div className="admin-search-input-wrap"><Search size={14} /><input id="nl-search" className="admin-search-input" placeholder="Search by email or name..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select className="admin-select" style={{ height: '32px', width: 'auto', fontSize: '12px', padding: '0 28px 0 10px' }} value={isActive} onChange={(e) => setIsActive(e.target.value)} id="nl-status-filter">
              <option value="">All</option><option value="true">Active</option><option value="false">Unsubscribed</option>
            </select>
          </>
        }
        emptyTitle="No subscribers yet" emptyDescription="Newsletter subscribers appear here as customers sign up on your storefront."
      />

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.action === 'delete' ? `Delete ${confirmAction?.ids.length} subscriber(s)?` : `Unsubscribe ${confirmAction?.ids.length} subscriber(s)?`}
        description={confirmAction?.action === 'delete' ? 'This will permanently remove them from your list.' : 'They will be marked as unsubscribed and won\'t receive future emails.'}
        confirmLabel={confirmAction?.action === 'delete' ? 'Delete' : 'Unsubscribe'}
        variant={confirmAction?.action === 'delete' ? 'danger' : 'warning'}
        loading={actionLoading}
        onConfirm={execAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
