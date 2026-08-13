// ============================================================
// BLENDIFY — Reviews Moderation Page  /admin/reviews
// ============================================================
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Star, Search, CheckCircle, XCircle, EyeOff, Trash2, MessageSquare, Download, Filter } from 'lucide-react';
import { DataTable, Column } from '@/components/admin/ui/DataTable';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ui/ConfirmDialog';
import { ExportMenu } from '@/components/admin/ui/ExportMenu';
import { StatCard } from '@/components/admin/ui/StatCard';
import { adminToast } from '@/components/admin/ui/Toast';
import { Drawer } from '@/components/admin/ui/Drawer';

interface Review {
  id: string;
  authorName: string;
  authorEmail: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  reply: string | null;
  repliedAt: string | null;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  product?: { id: string; name: string; slug: string } | null;
  user?: { email: string; firstName: string; lastName: string } | null;
}

interface Pagination { total: number; page: number; limit: number; totalPages: number }

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: '1px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} fill={i <= rating ? '#fbbf24' : 'none'} stroke={i <= rating ? '#fbbf24' : 'var(--admin-text-disabled)'} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 25, totalPages: 0 });
  const [limit, setLimit]          = useState(25);
  const [loading, setLoading]      = useState(true);
  const [search, setSearch]        = useState('');
  const [status, setStatus]        = useState('');
  const [sortBy, setSortBy]        = useState('createdAt');
  const [sortOrder, setSortOrder]  = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string[] | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [replyDrawer, setReplyDrawer] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySaving, setReplySaving] = useState(false);
  const [analytics, setAnalytics] = useState<{ total: number; pending: number; approved: number; avgRating: number } | null>(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), limit: String(limit),
      sortBy, sortOrder,
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    });
    const res = await fetch(`/api/admin/reviews?${params}`);
    const data = await res.json();
    if (data.success) {
      setReviews(data.data ?? []);
      const pg = data.pagination ?? { total: 0, page: 1, limit: 25, totalPages: 0 };
      setPagination(pg);
      setLimit(pg.limit);
    }
    setLoading(false);
  }, [search, status, sortBy, sortOrder, limit]);

  useEffect(() => { fetchData(1); }, [search, status, sortBy, sortOrder]);

  useEffect(() => {
    fetch('/api/admin/reviews?analyticsOnly=true')
      .then((r) => r.json())
      .then((d) => { if (d.success?.analytics) setAnalytics(d.success.analytics); });
    // Fetch analytics from a separate endpoint if available
    // Fallback: derive from pagination
  }, []);

  const bulkAction = async (action: 'approve' | 'reject' | 'hide' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete') { setDeleteTarget(selectedIds); return; }
    try {
      const res = await fetch('/api/admin/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ids: selectedIds }) });
      const data = await res.json();
      if (data.success) { adminToast.success(`${data.data.affected} reviews ${action}d`); setSelectedIds([]); fetchData(pagination.page); }
      else adminToast.error(data.error);
    } catch { adminToast.error('Action failed'); }
  };

  const singleAction = async (id: string, action: string) => {
    try {
      await fetch(`/api/admin/reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: action.toUpperCase() }) });
      adminToast.success('Review updated');
      fetchData(pagination.page);
    } catch { adminToast.error('Update failed'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await fetch('/api/admin/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', ids: deleteTarget }) });
      adminToast.success(`${deleteTarget.length} review(s) deleted`);
      setSelectedIds([]); setDeleteTarget(null); fetchData(pagination.page);
    } catch { adminToast.error('Delete failed'); }
    setDeleteLoading(false);
  };

  const saveReply = async () => {
    if (!replyDrawer) return;
    setReplySaving(true);
    try {
      await fetch(`/api/admin/reviews/${replyDrawer.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reply: replyText }) });
      adminToast.success('Reply saved');
      setReplyDrawer(null); setReplyText(''); fetchData(pagination.page);
    } catch { adminToast.error('Save failed'); }
    setReplySaving(false);
  };

  const handleExport = async (format: string) => {
    const url = `/api/admin/export/reviews?format=${format}&status=${status}&search=${search}`;
    if (format === 'print') { window.open(url); return; }
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `reviews.${format === 'excel' ? 'xls' : format === 'pdf' ? 'html' : 'csv'}`; a.click();
  };

  const columns: Column<Review>[] = [
    {
      key: 'authorName', header: 'Customer', sortable: true,
      cell: (r) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: '13px' }}>{r.authorName}</div>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>{r.authorEmail ?? r.user?.email ?? ''}</div>
        </div>
      ),
    },
    {
      key: 'product', header: 'Product',
      cell: (r) => r.product ? (
        <a href={`/products/${r.product.slug}`} target="_blank" style={{ fontSize: '12px', color: 'var(--admin-accent)', textDecoration: 'none' }}>{r.product.name}</a>
      ) : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '12px' }}>—</span>,
    },
    {
      key: 'rating', header: 'Rating', sortable: true,
      cell: (r) => <StarRating rating={r.rating} />,
    },
    {
      key: 'body', header: 'Review',
      cell: (r) => (
        <div style={{ maxWidth: '280px' }}>
          {r.title && <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '2px' }}>{r.title}</div>}
          <div style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.body}</div>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status', sortable: true,
      cell: (r) => <StatusBadge status={r.status.toLowerCase()} />,
    },
    {
      key: 'verifiedPurchase', header: 'Verified',
      cell: (r) => r.verifiedPurchase
        ? <span style={{ fontSize: '11px', color: 'var(--admin-success)', fontWeight: 500 }}>✓ Verified</span>
        : <span style={{ color: 'var(--admin-text-tertiary)', fontSize: '11px' }}>—</span>,
    },
    {
      key: 'createdAt', header: 'Date', sortable: true,
      cell: (r) => <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>,
    },
    {
      key: 'actions', header: '',
      cell: (r) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          {r.status !== 'APPROVED' && (
            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => singleAction(r.id, 'APPROVED')} title="Approve" id={`review-approve-${r.id}`}>
              <CheckCircle size={13} />
            </button>
          )}
          {r.status !== 'REJECTED' && (
            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => singleAction(r.id, 'REJECTED')} title="Reject" id={`review-reject-${r.id}`}>
              <XCircle size={13} />
            </button>
          )}
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => { setReplyDrawer(r); setReplyText(r.reply ?? ''); }} title="Reply" id={`review-reply-${r.id}`}>
            <MessageSquare size={13} />
          </button>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" style={{ color: 'var(--admin-error)' }} onClick={() => setDeleteTarget([r.id])} title="Delete" id={`review-delete-${r.id}`}>
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <>
      <div className="admin-search-input-wrap">
        <Search size={14} />
        <input id="reviews-search" className="admin-search-input" placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <select className="admin-select" style={{ height: '32px', width: 'auto', fontSize: '12px', padding: '0 28px 0 10px' }} value={status} onChange={(e) => setStatus(e.target.value)} id="reviews-status-filter">
        <option value="">All Statuses</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
        <option value="HIDDEN">Hidden</option>
      </select>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
        <ExportMenu onExport={handleExport} id="reviews-export" />
      </div>
    </>
  );

  const bulkActions = (
    <>
      <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => bulkAction('approve')} id="reviews-bulk-approve"><CheckCircle size={13} />Approve</button>
      <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => bulkAction('reject')} id="reviews-bulk-reject"><XCircle size={13} />Reject</button>
      <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => bulkAction('hide')} id="reviews-bulk-hide"><EyeOff size={13} />Hide</button>
      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => bulkAction('delete')} id="reviews-bulk-delete"><Trash2 size={13} />Delete</button>
    </>
  );

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Reviews & Ratings</h1>
          <p className="admin-page-subtitle">Moderate customer reviews and manage public replies</p>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stat-grid" style={{ marginBottom: '24px' }}>
        <StatCard id="reviews-stat-pending" label="Pending Review" value={pagination.total} icon={<Star size={16} />} iconVariant="warning" loading={loading} />
        <StatCard id="reviews-stat-total" label="Total Reviews" value={pagination.total} icon={<Star size={16} />} iconVariant="info" loading={loading} />
      </div>

      <DataTable
        id="reviews-table"
        data={reviews}
        columns={columns}
        loading={loading}
        totalCount={pagination?.total ?? 0}
        page={pagination?.page ?? 1}
        limit={pagination?.limit ?? 25}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={(k, o) => { setSortBy(k); setSortOrder(o); }}
        onPageChange={(p) => fetchData(p)}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        toolbar={toolbar}
        bulkActions={bulkActions}
        emptyTitle="No reviews found"
        emptyDescription="Reviews from customers will appear here."
      />

      {/* Reply Drawer */}
      <Drawer
        open={!!replyDrawer}
        title="Reply to Review"
        subtitle={replyDrawer ? `${replyDrawer.authorName} · ${replyDrawer.rating}★` : ''}
        onClose={() => { setReplyDrawer(null); setReplyText(''); }}
        footer={
          <>
            <button className="admin-btn admin-btn-ghost" onClick={() => setReplyDrawer(null)}>Cancel</button>
            <button className="admin-btn admin-btn-primary" onClick={saveReply} disabled={replySaving} id="review-reply-save">
              {replySaving && <span className="admin-spinner" style={{ width: 14, height: 14 }} />}
              Save Reply
            </button>
          </>
        }
      >
        {replyDrawer && (
          <div>
            <div className="admin-card" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--admin-accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                  {replyDrawer.authorName[0]}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{replyDrawer.authorName}</div>
                  <StarRating rating={replyDrawer.rating} />
                </div>
              </div>
              {replyDrawer.title && <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{replyDrawer.title}</div>}
              <p style={{ fontSize: '13px', color: 'var(--admin-text-secondary)', margin: 0, lineHeight: 1.6 }}>{replyDrawer.body}</p>
            </div>
            <div className="admin-form-group">
              <label className="admin-label" htmlFor="review-reply-text">Your Reply</label>
              <textarea
                id="review-reply-text"
                className="admin-textarea"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a professional response..."
                style={{ minHeight: '140px' }}
              />
            </div>
            <p style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>This reply will be publicly visible on the product page.</p>
          </div>
        )}
      </Drawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${(deleteTarget?.length ?? 0) > 1 ? `${deleteTarget?.length} reviews` : 'review'}?`}
        description="This action cannot be undone. The review(s) will be permanently removed."
        confirmLabel="Delete"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
